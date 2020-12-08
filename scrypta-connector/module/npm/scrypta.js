"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScryptaBlockchainService = void 0;
const ScryptaCore = require('@scrypta/core');
const constants_1 = require("./constants");
const error_1 = require("./error");
const bip32_1 = require("bip32");
const bip39_1 = require("bip39");
const bitcoinjs_lib_1 = require("bitcoinjs-lib");
const hdkey_1 = require("hdkey");
class ScryptaBlockchainService {
    constructor(testnet = false) {
        this.scrypta = new ScryptaCore;
        this.testnet = testnet;
        if (this.testnet === true) {
            this.scrypta.testnet = true;
        }
    }
    getNetwork() {
        return this.testnet ? constants_1.LYRA_TEST_NETWORK : constants_1.LYRA_NETWORK;
    }
    getDerivationPath() {
        return constants_1.LYRA_DERIVATION_PATH;
    }
    getBlockChainInfo(testnet) {
        return __awaiter(this, void 0, void 0, function* () {
            if (testnet) {
                this.scrypta.testnet = testnet;
            }
            try {
                let info = yield this.scrypta.get('/wallet/getinfo');
                return info;
            }
            catch (e) {
                this.logger.error(e);
                throw new error_1.TatumError(`${e.message} Code: ${e.code}`, `blockchain.error.code`);
            }
        });
    }
    getCurrentBlock(testnet) {
        return new Promise((response) => __awaiter(this, void 0, void 0, function* () {
            if (testnet) {
                this.scrypta.testnet = testnet;
            }
            try {
                let info = yield this.scrypta.get('/wallet/getinfo');
                response(info.blocks);
            }
            catch (e) {
                this.logger.error(e);
                throw new error_1.TatumError(`${e.message}`, `blockchain.error.code`);
            }
        }));
    }
    getBlockHash(i, testnet) {
        return new Promise((response) => __awaiter(this, void 0, void 0, function* () {
            if (testnet) {
                this.scrypta.testnet = testnet;
            }
            try {
                let block = yield this.scrypta.get('/blockhash/' + i);
                response(block.hash);
            }
            catch (e) {
                this.logger.error(e);
                throw new error_1.TatumError(`${e.message}`, `blockchain.error.code`);
            }
        }));
    }
    getBlock(hash, testnet) {
        return new Promise((response) => __awaiter(this, void 0, void 0, function* () {
            if (testnet) {
                this.scrypta.testnet = testnet;
            }
            try {
                let block = yield this.scrypta.get('/rawblock/' + hash);
                response({
                    hash: block.hash,
                    height: block.height,
                    confirmations: block.confirmations,
                    time: block.time,
                    txs: block.txs
                });
            }
            catch (e) {
                this.logger.error(e);
                throw new error_1.TatumError(`${e.message}`, `blockchain.error.code`);
            }
        }));
    }
    generateAddress(xpub, derivationIndex) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const w = bip32_1.fromBase58(xpub, this.getNetwork()).derivePath(String(derivationIndex));
                const address = bitcoinjs_lib_1.payments.p2pkh({ pubkey: w.publicKey, network: this.getNetwork() }).address;
                if (address !== undefined) {
                    return { address };
                }
            }
            catch (e) {
                this.logger.error(e);
                throw new error_1.TatumError('Unable to generate address, wrong xpub and account type.', 'address.generation.failed.wrong.xpub');
            }
            throw new error_1.TatumError('Unable to generate address', 'address.generation.failed');
        });
    }
    generateWallet(mnem) {
        return __awaiter(this, void 0, void 0, function* () {
            const mnemonic = mnem ? mnem : bip39_1.generateMnemonic(256);
            const hdwallet = hdkey_1.default.fromMasterSeed(bip39_1.mnemonicToSeed(mnemonic), this.getNetwork().bip32);
            return { mnemonic, xpub: hdwallet.derive(this.getDerivationPath()).toJSON().xpub };
        });
    }
    generateAddressPrivateKey(derivationIndex, mnemonic) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const w = bip32_1.fromSeed(yield bip39_1.mnemonicToSeed(mnemonic), this.getNetwork())
                    .derivePath(this.getDerivationPath())
                    .derive(derivationIndex);
                return { key: w.toWIF() };
            }
            catch (e) {
                this.logger.error(e);
                throw new error_1.TatumError('Unable to generate address, wrong mnemonic and index.', 'key.generation.failed.wrong.mnemonic');
            }
        });
    }
    getTransactionsByAddress(address, pagination, testnet) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((response) => __awaiter(this, void 0, void 0, function* () {
                if (testnet) {
                    this.scrypta.testnet = testnet;
                }
                try {
                    let transactions = yield this.scrypta.get('/transactions/' + address);
                    response(transactions.data);
                }
                catch (e) {
                    this.logger.error(e);
                    throw new error_1.TatumError(`${e.message}`, `blockchain.error.code`);
                }
            }));
        });
    }
    getUnspentsByAddress(address, pagination, testnet) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((response) => __awaiter(this, void 0, void 0, function* () {
                if (testnet) {
                    this.scrypta.testnet = testnet;
                }
                try {
                    let unspent = yield this.scrypta.get('/unspent/' + address);
                    let parsed = [];
                    for (let k in unspent.unspent) {
                        let utxo = unspent.unspent[k];
                        parsed.push({
                            txid: utxo.txid,
                            vout: utxo.vout,
                            amount: utxo.amount,
                            scriptPubKey: utxo.scriptPubKey,
                            block: utxo.block
                        });
                    }
                    response(parsed);
                }
                catch (e) {
                    this.logger.error(e);
                    throw new error_1.TatumError(`${e.message}`, `blockchain.error.code`);
                }
            }));
        });
    }
    getUTXO(hash, index, testnet) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((response) => __awaiter(this, void 0, void 0, function* () {
                if (testnet) {
                    this.scrypta.testnet = testnet;
                }
                try {
                    let unspent = yield this.scrypta.get('/utxo/' + hash + '/' + index);
                    if (unspent === false) {
                        throw new error_1.TatumError('No such UTXO for transaction and index.', 'tx.hash.index.spent');
                    }
                    response(unspent);
                }
                catch (e) {
                    throw new error_1.TatumError('No such UTXO for transaction and index.', 'tx.hash.index.spent');
                }
            }));
        });
    }
    getRawTransaction(txHash, testnet) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((response) => __awaiter(this, void 0, void 0, function* () {
                if (testnet) {
                    this.scrypta.testnet = testnet;
                }
                try {
                    let rawtx = yield this.scrypta.get('/rawtransaction/' + txHash);
                    if (rawtx === false) {
                        throw new error_1.TatumError('No such transaction.', 'tx.hash');
                    }
                    response(rawtx);
                }
                catch (e) {
                    throw new error_1.TatumError('No such transaction.', 'tx.hash');
                }
            }));
        });
    }
    broadcast(txData, testnet) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((response) => __awaiter(this, void 0, void 0, function* () {
                if (testnet) {
                    this.scrypta.testnet = testnet;
                }
                try {
                    let sendrawtransaction = yield this.scrypta.post('/sendrawtransaction', { rawtransaction: txData });
                    if (sendrawtransaction.data === null) {
                        throw new error_1.TatumError('Can\'t send transaction.', 'tx.broadcast');
                    }
                    else {
                        let txid = sendrawtransaction['data'];
                        response({ txId: txid, failed: false });
                    }
                }
                catch (e) {
                    throw new error_1.TatumError('Can\'t send transaction.', 'tx.broadcast');
                }
            }));
        });
    }
}
exports.ScryptaBlockchainService = ScryptaBlockchainService;
