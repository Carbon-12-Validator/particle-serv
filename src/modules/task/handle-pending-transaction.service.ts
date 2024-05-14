import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { RpcService } from '../rpc/services/rpc.service';
import { LarkService } from '../common/services/lark.service';
import { Helper } from '../../common/helper';
import {
    BLOCK_SIGNER_REASON,
    EVENT_ENTRY_POINT_USER_OPERATION,
    IS_PRODUCTION,
    IUserOperationEventObject,
    keyCacheChainSignerTransactionCount,
    keyLockPendingTransaction,
    keyLockSendingTransaction,
} from '../../common/common-types';
import { TRANSACTION_STATUS, TransactionDocument } from '../rpc/schemas/transaction.schema';
import { TransactionService } from '../rpc/services/transaction.service';
import { UserOperationService } from '../rpc/services/user-operation.service';
import { AAService } from '../rpc/services/aa.service';
import { getBundlerChainConfig } from '../../configs/bundler-common';
import P2PCache from '../../common/p2p-cache';
import { Contract, toBeHex } from 'ethers';
import entryPointAbi from '../rpc/aa/abis/entry-point-abi';
import { canRunCron, createTxGasData, deepHexlify, tryParseSignedTx } from '../rpc/aa/utils';
import { Cron } from '@nestjs/schedule';
import { FeeMarketEIP1559Transaction, LegacyTransaction } from '@ethereumjs/tx';

@Injectable()
export class HandlePendingTransactionService {
    private readonly lockSendingTransactions: Set<string> = new Set();
    private readonly lockPendingTransactions: Set<string> = new Set();
    private readonly signerDoneTransactionMaxNonce: Map<string, number> = new Map();

    public constructor(
        @InjectConnection() private readonly connection: Connection,
        private readonly rpcService: RpcService,
        private readonly larkService: LarkService,
        private readonly transactionService: TransactionService,
        private readonly userOperationService: UserOperationService,
        private readonly aaService: AAService,
    ) {}

    @Cron('*/5 * * * * *')
    public async handleLongPendingTransactions() {
        if (!canRunCron()) {
            return;
        }

        const pendingTransactions = await this.transactionService.getLongAgoTransactionsByStatusSortConfirmations(
            TRANSACTION_STATUS.PENDING,
            500,
        );

        const chainIdFromMap: any = {};
        for (const pendingTransaction of pendingTransactions) {
            if (!chainIdFromMap[pendingTransaction.chainId]) {
                chainIdFromMap[pendingTransaction.chainId] = [];
            }

            if (!chainIdFromMap[pendingTransaction.chainId].includes(pendingTransaction.from.toLowerCase())) {
                chainIdFromMap[pendingTransaction.chainId].push(pendingTransaction.from);
            }
        }

        const chainIds = Object.keys(chainIdFromMap);
        for (const chainId of chainIds) {
            const provider = this.rpcService.getJsonRpcProvider(Number(chainId));
            for (const from of chainIdFromMap[chainId]) {
                // async update signer nonce
                this.aaService.getTransactionCountWithCache(provider, Number(chainId), from, true);
            }
        }

        // async execute, no need to wait
        this.handlePendingTransactionsAction(pendingTransactions);
    }

    @Cron('* * * * * *')
    public async handleRecentPendingTransactions() {
        if (!canRunCron()) {
            return;
        }

        const pendingTransactions = await this.transactionService.getRecentTransactionsByStatusSortConfirmations(
            TRANSACTION_STATUS.PENDING,
            500,
        );

        // async execute, no need to wait
        this.handlePendingTransactionsAction(pendingTransactions);
    }

    private async handlePendingTransactionsAction(pendingTransactions: TransactionDocument[]) {
        const promises = [];
        for (const pendingTransaction of pendingTransactions) {
            const cacheKey1 = `${pendingTransaction.chainId}-${pendingTransaction.from.toLowerCase()}`;
            const cacheKey2 = keyCacheChainSignerTransactionCount(pendingTransaction.chainId, pendingTransaction.from);

            // local cache nonce directly
            const signerDoneTransactionMaxNonceFromP2PCache = P2PCache.get(cacheKey2) ?? 0;
            const signerDoneTransactionMaxNonce = this.signerDoneTransactionMaxNonce.get(cacheKey1) ?? 0;

            promises.push(
                this.getReceiptAndHandlePendingTransactions(
                    pendingTransaction,
                    Math.max(signerDoneTransactionMaxNonce, signerDoneTransactionMaxNonceFromP2PCache),
                ),
            );
        }

        const transactionsAddConfirmations = (await Promise.all(promises)).filter((t) => !!t);
        this.transactionService.addTransactionsConfirmations(transactionsAddConfirmations.map((t) => t.id));
    }

    // There is a concurrency conflict and locks need to be added
    public async trySendAndUpdateTransactionStatus(transaction: TransactionDocument, txHash: string) {
        if (!transaction.signedTxs[txHash]) {
            return;
        }

        const keyLock = keyLockSendingTransaction(transaction.id);
        if (this.lockSendingTransactions.has(keyLock)) {
            return;
        }

        this.lockSendingTransactions.add(keyLock);
        if (this.aaService.isBlockedSigner(transaction.chainId, transaction.from)) {
            this.lockSendingTransactions.delete(keyLock);
            return;
        }

        try {
            // It's possible that when you grab the lock, the previous call has already been made, so you need to check it again
            transaction = await this.transactionService.getTransactionById(transaction.id);
            if (!transaction || !transaction.isLocal()) {
                this.lockSendingTransactions.delete(keyLock);
                return;
            }

            await this.rpcService.sendRawTransaction(transaction.chainId, transaction.signedTxs[txHash]);
        } catch (error) {
            // insufficient funds for intrinsic transaction cost
            if (error?.message?.toLowerCase()?.includes('insufficient funds')) {
                this.aaService.setBlockedSigner(transaction.chainId, transaction.from, BLOCK_SIGNER_REASON.INSUFFICIENT_BALANCE, {
                    transactionId: transaction.id,
                });
            }

            if (
                error?.message?.toLowerCase()?.includes('nonce too low') ||
                error?.message?.toLowerCase()?.includes('replacement transaction underpriced')
            ) {
                // delete transaction and recover user op
                this.aaService.trySetTransactionCountLocalCache(transaction.chainId, transaction.from, transaction.nonce + 1);
                await Helper.startMongoTransaction(this.connection, async (session: any) => {
                    await Promise.all([
                        transaction.delete({ session }),
                        this.userOperationService.setPendingUserOperationsToLocal(transaction.id, session),
                    ]);
                });
            }

            if (!IS_PRODUCTION) {
                console.error(`SendTransaction error: ${transaction.id}`, error);
            }

            this.larkService.sendMessage(
                `Send Transaction Error On Chain ${transaction.chainId} And Transaction ${transaction.id}: ${Helper.converErrorToString(error)}`,
            );

            this.lockSendingTransactions.delete(keyLock);
            return;
        }

        try {
            // not in transaction db, may error is send succss and here is panic, There is a high probability that it will not appear
            await this.transactionService.updateTransactionStatus(transaction, TRANSACTION_STATUS.PENDING);
        } catch (error) {
            this.lockSendingTransactions.delete(keyLock);
            throw error;
        }

        this.lockSendingTransactions.delete(keyLock);
    }

    // There is a concurrency conflict and locks need to be added
    public async handlePendingTransaction(transaction: TransactionDocument, receipt: any) {
        // need a lot of memory, so we don't cache it
        // P2PCache.set(keyCacheChainReceipt(transaction.id), receipt, CACHE_TRANSACTION_RECEIPT_TIMEOUT);
        const keyLock = keyLockPendingTransaction(transaction.id);
        if (this.lockPendingTransactions.has(keyLock)) {
            return;
        }

        this.lockPendingTransactions.add(keyLock);

        transaction = await this.transactionService.getTransactionById(transaction.id);
        if (!transaction || transaction.isDone()) {
            this.lockPendingTransactions.delete(keyLock);
            return;
        }

        if (!receipt) {
            const userOpHashes = transaction.userOperationHashes;
            await this.userOperationService.setUserOperationsAsDone(userOpHashes, '', 0, '');
            await this.transactionService.updateTransactionStatus(transaction, TRANSACTION_STATUS.DONE);

            this.lockPendingTransactions.delete(keyLock);
            return;
        }

        const chainId = transaction.chainId;
        const results = await this.checkAndHandleFailedReceipt(transaction, receipt);
        const userOperationEventObjects: IUserOperationEventObject[] = [];
        for (const { receipt, userOpHashes } of results) {
            const txHash = receipt.transactionHash;
            const blockHash = receipt.blockHash;
            const blockNumber = receipt.blockNumber;

            const contract = new Contract(receipt.to, entryPointAbi);
            for (const log of receipt?.logs ?? []) {
                try {
                    const parsed = contract.interface.parseLog(log);
                    if (parsed?.name !== 'UserOperationEvent') {
                        continue;
                    }

                    const args = deepHexlify(parsed.args);
                    userOperationEventObjects.push({
                        chainId,
                        blockHash,
                        blockNumber,
                        userOperationHash: parsed.args.userOpHash,
                        txHash: receipt.transactionHash,
                        contractAddress: receipt.to,
                        topic: parsed.topic,
                        args,
                    });
                } catch (error) {
                    // May not be an EntryPoint event.
                    continue;
                }
            }

            // async send
            this.userOperationService.createUserOperationEvents(userOperationEventObjects);
            await this.userOperationService.setUserOperationsAsDone(userOpHashes, txHash, blockNumber, blockHash);

            transaction.receipts = transaction.receipts || {};
            transaction.receipts[txHash] = receipt;
            transaction.userOperationHashMapTxHash = transaction.userOperationHashMapTxHash || {};
            for (const userOpHash of userOpHashes) {
                transaction.userOperationHashMapTxHash[userOpHash] = txHash;
            }
        }

        await this.transactionService.updateTransactionStatus(transaction, TRANSACTION_STATUS.DONE);
        this.setSignerDoneTransactionMaxNonce(chainId, transaction.from, transaction.nonce);

        this.lockPendingTransactions.delete(keyLock);
    }

    // Check is the userop is bundled by other tx(mev attack)
    // This is not a strict check
    private async checkAndHandleFailedReceipt(transaction: TransactionDocument, receipt: any) {
        try {
            const bundlerConfig = getBundlerChainConfig(transaction.chainId);

            if (BigInt(receipt.status) === 1n || !bundlerConfig.mevCheck) {
                return [{ receipt, userOpHashes: transaction.userOperationHashes }];
            }

            const provider = this.rpcService.getJsonRpcProvider(transaction.chainId);
            const logs = await provider.getLogs({
                fromBlock: BigInt(receipt.blockNumber) - 20n, // if attack by mev bot, it should be includes in latest blocks
                toBlock: BigInt(receipt.blockNumber),
                topics: [EVENT_ENTRY_POINT_USER_OPERATION],
            });

            const txHashes = {};
            for (const log of logs) {
                const userOpHash = log.topics[1];
                if (transaction.userOperationHashes.includes(userOpHash)) {
                    if (!txHashes[log.transactionHash]) {
                        txHashes[log.transactionHash] = [];
                    }

                    txHashes[log.transactionHash].push(userOpHash);
                }
            }

            // if no matched tx, it means this is a normal failed op
            if (Object.keys(txHashes).length === 0) {
                return [{ receipt, userOpHashes: transaction.userOperationHashes }];
            }

            if (!txHashes[receipt.transactionHash]) {
                txHashes[receipt.transactionHash] = [];
            }

            const receipts = await Promise.all(
                Object.keys(txHashes).map(async (txHash) => {
                    if (txHash === receipt.transactionHash) {
                        return receipt;
                    }

                    return await provider.send('eth_getTransactionReceipt', [txHash]);
                }),
            );

            const results = [];
            for (const receipt of receipts) {
                results.push({
                    receipt,
                    userOpHashes: txHashes[receipt.transactionHash],
                });
            }

            return results;
        } catch (error) {
            if (!IS_PRODUCTION) {
                console.error('checkAndHandleFailedReceipt error', error);
            }

            this.larkService.sendMessage(`CheckAndHandleFailedReceipt Error: ${Helper.converErrorToString(error)}`);
            return [{ receipt, userOpHashes: transaction.userOperationHashes }];
        }
    }

    private setSignerDoneTransactionMaxNonce(chainId: number, from: string, nonce: number) {
        const key = `${chainId}-${from.toLowerCase()}`;
        if (this.signerDoneTransactionMaxNonce.has(key) && this.signerDoneTransactionMaxNonce.get(key) >= nonce) {
            return;
        }

        this.signerDoneTransactionMaxNonce.set(key, nonce);
    }

    private async getReceiptAndHandlePendingTransactions(pendingTransaction: TransactionDocument, signerDoneTransactionMaxNonce?: number) {
        try {
            const receiptPromises = pendingTransaction.txHashes.map((txHash) =>
                this.rpcService.getTransactionReceipt(pendingTransaction.chainId, txHash),
            );
            const receipts = await Promise.all(receiptPromises);
            for (const receipt of receipts) {
                if (!!receipt) {
                    await this.handlePendingTransaction(pendingTransaction, receipt);
                    return null;
                }
            }

            // the pending transaction is too old, force to finish it
            if (!!signerDoneTransactionMaxNonce && signerDoneTransactionMaxNonce > pendingTransaction.nonce) {
                await this.handlePendingTransaction(pendingTransaction, null);
                return null;
            }

            // force retry
            if (pendingTransaction.incrRetry) {
                await this.tryIncrTransactionGasPriceAndReplace(pendingTransaction);
            }

            if (!pendingTransaction.isPendingTimeout() || !signerDoneTransactionMaxNonce) {
                return pendingTransaction;
            }

            const bundlerConfig = getBundlerChainConfig(pendingTransaction.chainId);

            if (
                bundlerConfig.canIncrGasPriceRetry &&
                [signerDoneTransactionMaxNonce + 1, signerDoneTransactionMaxNonce].includes(pendingTransaction.nonce) &&
                pendingTransaction.txHashes.length < bundlerConfig.canIncrGasPriceRetryMaxCount
            ) {
                await this.tryIncrTransactionGasPriceAndReplace(pendingTransaction);
            } else if (pendingTransaction.isOld()) {
                try {
                    // Transactions may be discarded by the node tx pool and need to be reissued
                    await this.rpcService.sendRawTransaction(
                        pendingTransaction.chainId,
                        pendingTransaction.signedTxs[pendingTransaction.txHashes[pendingTransaction.txHashes.length - 1]],
                    );
                } catch (error) {
                    if (!IS_PRODUCTION) {
                        console.error('trySendOldPendingTransaction error', error);
                    }

                    this.larkService.sendMessage(
                        `trySendOldPendingTransaction Error On Chain ${pendingTransaction.chainId} For ${
                            pendingTransaction.id
                        }: ${Helper.converErrorToString(error)}`,
                    );
                }
            }

            return null;
        } catch (error) {
            if (!IS_PRODUCTION) {
                console.error('getReceiptAndHandlePendingTransactions error', error);
            }

            this.larkService.sendMessage(
                `getReceiptAndHandlePendingTransactions Error On Chain ${pendingTransaction.chainId} For ${
                    pendingTransaction.id
                }: ${Helper.converErrorToString(error)}`,
            );
        }
    }

    private async tryIncrTransactionGasPriceAndReplace(transaction: TransactionDocument) {
        const keyLock = keyLockPendingTransaction(transaction.id);
        if (this.lockPendingTransactions.has(keyLock)) {
            return;
        }

        this.lockPendingTransactions.add(keyLock);

        transaction = await this.transactionService.getTransactionById(transaction.id);
        if (transaction.isDone()) {
            this.lockPendingTransactions.delete(keyLock);
            return;
        }

        try {
            const provider = this.rpcService.getJsonRpcProvider(transaction.chainId);
            const remoteNonce = await this.aaService.getTransactionCountWithCache(provider, transaction.chainId, transaction.from, true);
            if (remoteNonce != transaction.nonce) {
                this.lockPendingTransactions.delete(keyLock);
                return;
            }
        } catch (error) {
            this.larkService.sendMessage(
                `TryIncrTransactionGasPrice GetTransactionCount Error On Chain ${transaction.chainId} For ${
                    transaction.from
                }: ${Helper.converErrorToString(error)}`,
            );

            this.lockPendingTransactions.delete(keyLock);
            return;
        }

        if (!transaction.isPendingTimeout()) {
            this.lockPendingTransactions.delete(keyLock);
            return;
        }

        const allValidSigners = this.aaService.getRandomValidSigners(transaction.chainId);
        const signer = allValidSigners.find((signer) => signer.address.toLowerCase() === transaction.from.toLowerCase());
        if (!signer) {
            this.lockPendingTransactions.delete(keyLock);
            return;
        }

        try {
            const coefficient = 1.1;

            const currentSignedTx = transaction.signedTxs[transaction.txHashes[transaction.txHashes.length - 1]];
            const tx = tryParseSignedTx(currentSignedTx);
            const txData: any = tx.toJSON();

            const feeData = await this.aaService.getFeeData(transaction.chainId);
            if (tx instanceof FeeMarketEIP1559Transaction) {
                if (BigInt(feeData.maxFeePerGas) > BigInt(tx.maxFeePerGas)) {
                    txData.maxFeePerGas = toBeHex(feeData.maxFeePerGas);
                }
                if (BigInt(feeData.maxPriorityFeePerGas) > BigInt(tx.maxPriorityFeePerGas)) {
                    txData.maxPriorityFeePerGas = toBeHex(feeData.maxPriorityFeePerGas);
                }

                let bnMaxPriorityFeePerGas = BigInt(txData.maxPriorityFeePerGas);
                let bnMaxFeePerGas = BigInt(txData.maxFeePerGas);
                if (bnMaxPriorityFeePerGas === 0n) {
                    bnMaxPriorityFeePerGas = BigInt(0.01 * 10 ** 9);
                    if (bnMaxPriorityFeePerGas >= bnMaxFeePerGas) {
                        bnMaxFeePerGas = bnMaxPriorityFeePerGas + 1n;
                    }
                }

                txData.maxPriorityFeePerGas = toBeHex((bnMaxPriorityFeePerGas * BigInt(coefficient * 10)) / 10n);
                txData.maxFeePerGas = toBeHex((bnMaxFeePerGas * BigInt(coefficient * 10)) / 10n);
            }

            if (tx instanceof LegacyTransaction) {
                if (BigInt(feeData.gasPrice) > BigInt(tx.gasPrice)) {
                    txData.gasPrice = toBeHex(feeData.gasPrice);
                }

                txData.gasPrice = (BigInt(tx.gasPrice) * BigInt(coefficient * 10)) / 10n;
            }

            const signedTx = await signer.signTransaction({
                chainId: transaction.chainId,
                to: txData.to,
                data: txData.data,
                nonce: txData.nonce,
                gasLimit: txData.gasLimit,
                ...createTxGasData(transaction.chainId, txData),
            });

            // if failed and it's ok, just generate a invalid tx hash
            await this.transactionService.replaceTransactionTxHash(transaction, signedTx);
            await this.rpcService.sendRawTransaction(transaction.chainId, signedTx);
        } catch (error) {
            if (!IS_PRODUCTION) {
                console.error(`Replace Transaction ${transaction.id} error on chain ${transaction.chainId}`, error, transaction);
            }

            this.larkService.sendMessage(
                `ReplaceTransaction Error On Chain ${transaction.chainId} For ${transaction.from}: ${Helper.converErrorToString(error)}`,
            );
        }

        this.lockPendingTransactions.delete(keyLock);
    }
}
