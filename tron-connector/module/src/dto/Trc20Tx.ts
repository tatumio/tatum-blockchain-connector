export class Trc20Tx {
    public txID: string;
    public tokenInfo: { symbol: string, address: string, decimals: number, name: string };
    public from: string;
    public to: string;
    public type: string;
    public value: string;
}
