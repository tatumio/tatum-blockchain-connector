export * from './QtumService';
export * from './QtumController';
export * from './QtumError';
export const QTUM_HEADER_ENDPOINT = 'x-qtum-endpoint';
export const INSIGHT_BASEURLS: { [key: string]: string } = {
    "QTUM_MAINNET": "https://insight.backendq.com/insight-api",
    "QTUM_TESTNET": "https://testnet.qtum.org/insight-api"
}