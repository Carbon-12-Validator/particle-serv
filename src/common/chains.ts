export enum EVM_CHAIN_ID {
    ETHEREUM_MAINNET = 1,
    ETHEREUM_SEPOLIA_TESTNET = 11155111,
    ETHEREUM_HOLESKY_TESTNET = 17000,
    POLYGON_MAINNET = 137,
    POLYGON_AMOY_TESTNET = 80002,
    BNB_MAINNET = 56,
    BNB_TESTNET = 97,
    OPBNB_MAINNET = 204,
    OPBNB_TESTNET = 5611,
    SCROLL_MAINNET = 534352,
    SCROLL_SEPOLIA = 534351,
    LINEA_MAINNET = 59144,
    LINEA_TESTNET_SEPOLIA = 59141,
    OPTIMISM_MAINNET = 10,
    OPTIMISM_TESTNET_SEPOLIA = 11155420,
    BASE_MAINNET = 8453,
    BASE_TESTNET_SEPOLIA = 84532,
    MANTA_MAINNET = 169,
    MANTA_SEPOLIA_TESTNET = 3441006,
    MANTLE_MAINNET = 5000,
    MANTLE_SEPOLIA_TESTNET = 5003,
    ARBITRUM_ONE_MAINNET = 42161,
    ARBITRUM_NOVA_MAINNET = 42170,
    ARBITRUM_SEPOLIA_TESTNET = 421614,
    AVALANCHE_MAINNET = 43114,
    AVALANCHE_TESTNET = 43113,
    GNOSIS_MAINNET = 100,
    GNOSIS_TESTNET = 10200,
    VICTION_MAINNET = 88,
    VICTION_TESTNET = 89,
    MOONBEAM_MAINNET = 1284,
    MOONRIVER_MAINNET = 1285,
    MOONBASE_ALPHA_TESTNET = 1287,
    POLYGON_ZKEVM_MAINNET = 1101,
    POLYGON_ZKEVM_CARDONA_TESTNET = 2442,
    FANTOM_MAINNET = 250,
    FANTOM_TESTNET = 4002,
    COMBO_MAINNET = 9980,
    COMBO_TESTNET = 1715,
    ZKFAIR_MAINNET = 42766,
    ZKFAIR_TESTNET = 43851,
    MAP_PROTOCOL_MAINNET = 22776,
    MAP_PROTOCOL_TESTNET = 212,
    BEVM_MAINNET = 11501,
    BEVM_TESTNET = 11503,
    BEVM_CANARY_MAINNET = 1501,
    BEVM_CANARY_TESTNET = 1502,
    ZETA_MAINNET = 7000,
    ZETA_TESTNET = 7001,
    MERLIN_CHAIN_MAINNET = 4200,
    MERLIN_CHAIN_TESTNET = 686868,
    CORE_MAINNET = 1116,
    CORE_TESTNET = 1115,
    MODE_MAINNET = 34443,
    MODE_TESTNET = 919,
    ANCIENT8_MAINNET = 888888888,
    ANCIENT8_TESTNET = 28122024,
    BLAST_MAINNET = 81457,
    BLAST_TESTNET_SEPOLIA = 168587773,
    ROOTSTOCK_MAINNET = 30,
    XTERIO_MAINNET = 112358,
    XTERIO_TESTNET = 1637450,
    XTERIO_ETH_MAINNET = 2702128,
    ASTAR_ZKEVM_MAINNET = 3776,
    ASTAR_ZKEVM_TESTNET_ZKYOTO = 6038361,
    IMMUTABLE_ZKEVM_MAINNET = 13371,
    IMMUTABLE_ZKEVM_TESTNET = 13473,
    PEQA_KREST_MAINNET = 2241,
    PEQA_AGUNG_TESTNET = 9990,
    BSQUARED_MAINNET = 223,
    BSQUARED_TESTNET = 1123,
    BITLAYER_MAINNET = 200901,
    BITLAYER_TESTNET = 200810,
    // X Layer
    OKBC_MAINNET = 196,
    OKBC_TESTNET = 195,
    // Cyber
    CYBER_MAINNET = 7560,
    CYBER_TESTNET = 111557560,
    // BOB
    BOB_MAINNET = 60808,
    BOB_TESTNET = 111,
    // Taiko
    TAIKO_MAINNET = 167000,
    TAIKO_TESTNET_HEKLA = 167009,
    // GM Network
    GMNETWORK_MAINNET = 2777,
    GMNETWORK_TESTNET = 202402181627,
    // Fuse
    FUSE_MAINNET = 122,
    FUSE_TESTNET = 123,
    // IoTeX
    IOTEX_MAINNET = 4689,
    IOTEX_TESTNET = 4690,
    // Sei
    SEI_MAINNET = 1329,
    SEI_TESTNET = 1328,
    SEI_DEVNET = 713715,
    // SatoshiVM
    SATOSHIVM_ALPHA_MAINNET = 3109,
    SATOSHIVM_TESTNET = 3110,
    // AILayer / AINN
    AINN_MAINNET = 2649,
    AINN_TESTNET = 2648,
    // Lorenzo
    LORENZO_MAINNET = 8329,
    LORENZO_TESTNET = 83291,
    // Only testnets
    BOTANIX_TESTNET = 3636,
    READON_TESTNET = 12015,
    BERACHAIN_TESTNET_BARTIO = 80084,
    TUNA_TESTNET = 89682,
    HYBIRD_TESTNET = 1225,
    // Internal
    PARTICLE_PANGU_TESTNET = 2011,
}

export const DISABLE_DEPOSIT_CHAINS = [
    // Not Supported
    EVM_CHAIN_ID.IMMUTABLE_ZKEVM_MAINNET,
    EVM_CHAIN_ID.ROOTSTOCK_MAINNET,
];

export const PARTICLE_CHAINS = [EVM_CHAIN_ID.PARTICLE_PANGU_TESTNET];

export const SUPPORT_EIP_1559 = [
    EVM_CHAIN_ID.ETHEREUM_MAINNET,
    EVM_CHAIN_ID.ETHEREUM_SEPOLIA_TESTNET,
    EVM_CHAIN_ID.ETHEREUM_HOLESKY_TESTNET,
    EVM_CHAIN_ID.OPTIMISM_MAINNET,
    EVM_CHAIN_ID.OPTIMISM_TESTNET_SEPOLIA,
    EVM_CHAIN_ID.AVALANCHE_MAINNET,
    EVM_CHAIN_ID.AVALANCHE_TESTNET,
    EVM_CHAIN_ID.POLYGON_MAINNET,
    EVM_CHAIN_ID.POLYGON_AMOY_TESTNET,
    EVM_CHAIN_ID.ARBITRUM_ONE_MAINNET,
    EVM_CHAIN_ID.ARBITRUM_NOVA_MAINNET,
    EVM_CHAIN_ID.ARBITRUM_SEPOLIA_TESTNET,
    EVM_CHAIN_ID.LINEA_MAINNET,
    EVM_CHAIN_ID.LINEA_TESTNET_SEPOLIA,
    EVM_CHAIN_ID.OPBNB_MAINNET,
    EVM_CHAIN_ID.OPBNB_TESTNET,
    EVM_CHAIN_ID.COMBO_MAINNET,
    EVM_CHAIN_ID.COMBO_TESTNET,
    EVM_CHAIN_ID.TAIKO_MAINNET,
    EVM_CHAIN_ID.TAIKO_TESTNET_HEKLA,
    EVM_CHAIN_ID.BASE_MAINNET,
    EVM_CHAIN_ID.BASE_TESTNET_SEPOLIA,
    EVM_CHAIN_ID.MANTA_MAINNET,
    EVM_CHAIN_ID.MANTA_SEPOLIA_TESTNET,
    EVM_CHAIN_ID.MOONBEAM_MAINNET,
    EVM_CHAIN_ID.MOONRIVER_MAINNET,
    EVM_CHAIN_ID.MOONBASE_ALPHA_TESTNET,
    EVM_CHAIN_ID.ZETA_MAINNET,
    EVM_CHAIN_ID.ZETA_TESTNET,
    EVM_CHAIN_ID.ANCIENT8_MAINNET,
    EVM_CHAIN_ID.ANCIENT8_TESTNET,
    EVM_CHAIN_ID.MAP_PROTOCOL_MAINNET,
    EVM_CHAIN_ID.MAP_PROTOCOL_TESTNET,
    EVM_CHAIN_ID.SATOSHIVM_ALPHA_MAINNET,
    EVM_CHAIN_ID.SATOSHIVM_TESTNET,
    EVM_CHAIN_ID.MODE_MAINNET,
    EVM_CHAIN_ID.MODE_TESTNET,
    EVM_CHAIN_ID.BLAST_MAINNET,
    EVM_CHAIN_ID.BLAST_TESTNET_SEPOLIA,
    EVM_CHAIN_ID.XTERIO_MAINNET,
    EVM_CHAIN_ID.XTERIO_TESTNET,
    EVM_CHAIN_ID.XTERIO_ETH_MAINNET,
    EVM_CHAIN_ID.GMNETWORK_MAINNET,
    EVM_CHAIN_ID.GMNETWORK_TESTNET,
    EVM_CHAIN_ID.BOB_MAINNET,
    EVM_CHAIN_ID.BOB_TESTNET,
    EVM_CHAIN_ID.IMMUTABLE_ZKEVM_MAINNET,
    EVM_CHAIN_ID.PEQA_KREST_MAINNET,
    EVM_CHAIN_ID.PEQA_AGUNG_TESTNET,
    EVM_CHAIN_ID.PARTICLE_PANGU_TESTNET,
    EVM_CHAIN_ID.CYBER_MAINNET,
    EVM_CHAIN_ID.CYBER_TESTNET,
    EVM_CHAIN_ID.TUNA_TESTNET,
    EVM_CHAIN_ID.SEI_MAINNET,
    EVM_CHAIN_ID.SEI_TESTNET,
    EVM_CHAIN_ID.SEI_DEVNET,
    EVM_CHAIN_ID.LORENZO_MAINNET,
    EVM_CHAIN_ID.LORENZO_TESTNET,
    EVM_CHAIN_ID.HYBIRD_TESTNET,
];

export const L2_GAS_ORACLE = {
    [EVM_CHAIN_ID.SCROLL_MAINNET]: '0x5300000000000000000000000000000000000002',
    [EVM_CHAIN_ID.SCROLL_SEPOLIA]: '0x5300000000000000000000000000000000000002',
    [EVM_CHAIN_ID.OPTIMISM_MAINNET]: '0x420000000000000000000000000000000000000F',
    [EVM_CHAIN_ID.OPTIMISM_TESTNET_SEPOLIA]: '0x420000000000000000000000000000000000000F',
    [EVM_CHAIN_ID.OPBNB_MAINNET]: '0x420000000000000000000000000000000000000F',
    [EVM_CHAIN_ID.OPBNB_TESTNET]: '0x420000000000000000000000000000000000000F',
    [EVM_CHAIN_ID.COMBO_MAINNET]: '0x420000000000000000000000000000000000000F',
    [EVM_CHAIN_ID.COMBO_TESTNET]: '0x420000000000000000000000000000000000000F',
    [EVM_CHAIN_ID.BASE_MAINNET]: '0x420000000000000000000000000000000000000F',
    [EVM_CHAIN_ID.BASE_TESTNET_SEPOLIA]: '0x420000000000000000000000000000000000000F',
    [EVM_CHAIN_ID.BLAST_MAINNET]: '0x420000000000000000000000000000000000000F',
    [EVM_CHAIN_ID.BLAST_TESTNET_SEPOLIA]: '0x420000000000000000000000000000000000000F',
    [EVM_CHAIN_ID.MANTA_MAINNET]: '0x420000000000000000000000000000000000000F',
    [EVM_CHAIN_ID.MANTA_SEPOLIA_TESTNET]: '0x420000000000000000000000000000000000000F',
    [EVM_CHAIN_ID.MODE_MAINNET]: '0x420000000000000000000000000000000000000F',
    [EVM_CHAIN_ID.MODE_TESTNET]: '0x420000000000000000000000000000000000000F',
    [EVM_CHAIN_ID.XTERIO_MAINNET]: '0x420000000000000000000000000000000000000F',
    [EVM_CHAIN_ID.XTERIO_TESTNET]: '0x420000000000000000000000000000000000000F',
    [EVM_CHAIN_ID.XTERIO_ETH_MAINNET]: '0x420000000000000000000000000000000000000F',
    [EVM_CHAIN_ID.GMNETWORK_MAINNET]: '0x420000000000000000000000000000000000000F',
    [EVM_CHAIN_ID.GMNETWORK_TESTNET]: '0x420000000000000000000000000000000000000F',
    [EVM_CHAIN_ID.BOB_MAINNET]: '0x420000000000000000000000000000000000000F',
    [EVM_CHAIN_ID.BOB_TESTNET]: '0x420000000000000000000000000000000000000F',
    [EVM_CHAIN_ID.CYBER_MAINNET]: '0x420000000000000000000000000000000000000F',
    [EVM_CHAIN_ID.CYBER_TESTNET]: '0x420000000000000000000000000000000000000F',
};

export const NEED_TO_ESTIMATE_GAS_BEFORE_SEND = [
    EVM_CHAIN_ID.ARBITRUM_ONE_MAINNET,
    EVM_CHAIN_ID.ARBITRUM_NOVA_MAINNET,
    EVM_CHAIN_ID.ARBITRUM_SEPOLIA_TESTNET,
    EVM_CHAIN_ID.MANTLE_MAINNET,
    EVM_CHAIN_ID.MANTLE_SEPOLIA_TESTNET,
];

export const SUPPORT_MULTCALL3 = [
    EVM_CHAIN_ID.ARBITRUM_ONE_MAINNET,
    EVM_CHAIN_ID.ARBITRUM_NOVA_MAINNET,
    EVM_CHAIN_ID.ARBITRUM_SEPOLIA_TESTNET,
    EVM_CHAIN_ID.MANTLE_MAINNET,
    EVM_CHAIN_ID.MANTLE_SEPOLIA_TESTNET,
    EVM_CHAIN_ID.ETHEREUM_SEPOLIA_TESTNET,
    EVM_CHAIN_ID.POLYGON_AMOY_TESTNET,
    EVM_CHAIN_ID.BLAST_TESTNET_SEPOLIA,
    EVM_CHAIN_ID.BASE_TESTNET_SEPOLIA,
    EVM_CHAIN_ID.LINEA_TESTNET_SEPOLIA,
    EVM_CHAIN_ID.OPTIMISM_TESTNET_SEPOLIA,
    EVM_CHAIN_ID.BNB_TESTNET,
    EVM_CHAIN_ID.AVALANCHE_TESTNET,
    EVM_CHAIN_ID.PARTICLE_PANGU_TESTNET,
    EVM_CHAIN_ID.SEI_TESTNET,
    // EVM_CHAIN_ID.BSQUARED_TESTNET,
];
