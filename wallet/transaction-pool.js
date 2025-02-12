/* eslint-disable no-restricted-syntax */
const Transaction = require('./transaction');

class TransactionPool {
  constructor() {
    this.transactionMap = {};
  }

  clear() {
    this.transactionMap = {};
  }

  clearBlockchainTransactions({ chain }) {
    for (let i = 1; i < chain.length; i += 1) {
      const block = chain[i];
      for (const transaction of block.data) {
        if (this.transactionMap[transaction.id]) {
          delete this.transactionMap[transaction.id];
        }
      }
    }
  }

  setTransaction(transaction) {
    this.transactionMap[transaction.id] = transaction;
  }

  existingTransaction({ inputAddress }) {
    const transactions = Object.values(this.transactionMap);
    return transactions.find((transaction) => transaction.input.address === inputAddress);
  }

  setMap(transactionPoolMap) {
    this.transactionMap = transactionPoolMap;
  }

  validTransactions() {
    return Object.values(this.transactionMap).filter(
      // eslint-disable-next-line comma-dangle
      (transaction) => Transaction.isValidTransaction(transaction)
    );
  }
}
module.exports = TransactionPool;
