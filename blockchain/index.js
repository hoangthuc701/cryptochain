const Block = require('./block');
const Transaction = require('../wallet/transaction');
const Wallet = require('../wallet');
const { cryptoHash } = require('../utils');
const { REWARD_INPUT, MINING_REWARD } = require('../config');

class Blockchain {
  constructor() {
    this.chain = [Block.genesis()];
  }

  addBlock({ data }) {
    const newBlock = Block.mineBlock({
      lastBlock: this.chain[this.chain.length - 1],
      data,
    });
    this.chain.push(newBlock);
  }

  static isValidChain(chain) {
    if (JSON.stringify(chain[0]) !== JSON.stringify(Block.genesis())) return false;
    for (let i = 1; i < chain.length; i += 1) {
      const block = chain[i];
      const actualLastHash = chain[i - 1].hash;
      const lastDifficulty = chain[i - 1].difficulty;
      // eslint-disable-next-line object-curly-newline
      const { timestamp, lastHash, data, hash, nonce, difficulty } = block;
      if (lastHash !== actualLastHash) return false;
      const validatedHash = cryptoHash(timestamp, lastHash, data, nonce, difficulty);
      if (hash !== validatedHash) return false;
      if (Math.abs(lastDifficulty - difficulty > 1)) return false;
    }
    return true;
  }

  replaceChain(chain, validateTransactions, onSuccess) {
    if (chain.length <= this.chain.length) {
      console.error('The chain must be longer.');
      return;
    }
    if (!Blockchain.isValidChain(chain)) {
      console.error('The chain must be valid.');
      return;
    }
    if (validateTransactions && !this.validTransactionData({ chain })) {
      console.error('The incoming chain has invalid data!!');
      return;
    }

    if (onSuccess) onSuccess();
    this.chain = chain;
  }

  // eslint-disable-next-line class-methods-use-this
  validTransactionData({ chain }) {
    for (let i = 1; i < chain.length; i += 1) {
      const block = chain[i];
      const transactionSet = new Set();
      let rewardTransactionCount = 0;

      // eslint-disable-next-line no-restricted-syntax
      for (const transaction of block.data) {
        if (transaction.input.address === REWARD_INPUT.address) {
          rewardTransactionCount += 1;
          if (rewardTransactionCount > 1) {
            console.error('Miner reward exceed limit.');
            return false;
          }
          if (Object.values(transaction.outputMap)[0] !== MINING_REWARD) {
            console.error('Miner reward amount is invalid.');
            return false;
          }
        } else {
          if (!Transaction.isValidTransaction(transaction)) {
            console.error('Invalid transaction.');
            return false;
          }
          const trueBalance = Wallet.calculateBalance({
            address: transaction.input.address,
            chain: this.chain,
          });
          if (transaction.input.amount !== trueBalance) {
            console.error('Invalid input amount!!');
            return false;
          }
          if (transactionSet.has(transaction)) {
            console.error('An identical transaction appears more than once in the block');
            return false;
          }
          transactionSet.add(transaction);
        }
      }
    }
    return true;
  }
}
module.exports = Blockchain;
