const uuid = require('uuid').v1;
const { verifySignature } = require('../utils');
const { MINING_REWARD, REWARD_INPUT } = require('../config');

class Transaction {
  // eslint-disable-next-line object-curly-newline
  constructor({ senderWallet, recipient, amount, outputMap, input }) {
    this.id = uuid();
    this.outputMap = outputMap || this.createOutputMap({ senderWallet, recipient, amount });
    this.input = input || this.createInput({ senderWallet, outputMap: this.outputMap });
  }

  // eslint-disable-next-line class-methods-use-this
  createOutputMap({ senderWallet, recipient, amount }) {
    const outputMap = {};
    outputMap[recipient] = amount;
    outputMap[senderWallet.publicKey] = senderWallet.balance - amount;
    return outputMap;
  }

  // eslint-disable-next-line class-methods-use-this
  createInput({ senderWallet, outputMap }) {
    const timestamp = Date.now();
    return {
      timestamp,
      amount: senderWallet.balance,
      address: senderWallet.publicKey,
      signature: senderWallet.sign(outputMap),
    };
  }

  static isValidTransaction(transaction) {
    const {
      input: { address, amount, signature },
      outputMap,
    } = transaction;
    const outputTotal = Object.values(outputMap).reduce(
      // eslint-disable-next-line comma-dangle
      (total, outputAmount) => total + outputAmount
    );
    if (amount !== outputTotal) {
      console.error(`Invalid transaction from ${address}`);
      return false;
    }
    if (!verifySignature({ publicKey: address, data: outputMap, signature })) {
      console.error(`Invalid signature from ${address}`);
      return false;
    }
    return true;
  }

  static rewardTransaction({ minerWallet }) {
    return new this({ input: REWARD_INPUT, outputMap: { [minerWallet.publicKey]: MINING_REWARD } });
  }

  update({ senderWallet, recipient, amount }) {
    if (amount > this.outputMap[senderWallet.publicKey]) {
      throw new Error('Amount exceeds balance');
    }
    if (!this.outputMap[recipient]) {
      this.outputMap[recipient] = amount;
    } else {
      this.outputMap[recipient] += amount;
    }
    this.outputMap[senderWallet.publicKey] -= amount;
    this.input = this.createInput({ senderWallet, outputMap: this.outputMap });
  }
}
module.exports = Transaction;
