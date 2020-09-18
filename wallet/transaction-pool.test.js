/* eslint-disable no-undef */
const TransactionPool = require('./transaction-pool');
const Transaction = require('./transaction');
const Wallet = require('./index');

describe('TransactionPool', () => {
  let transactionPool;
  let transaction;
  let senderWallet;

  beforeEach(() => {
    transactionPool = new TransactionPool();
    senderWallet = new Wallet();
    transaction = new Transaction({
      senderWallet,
      recipient: 'fake-recipient',
      amount: 50,
    });
  });

  describe('setTransaction()', () => {
    it('adds a transaction', () => {
      transactionPool.setTransaction(transaction);
      expect(transactionPool.transactionMap[transaction.id]).toEqual(transaction);
    });
  });
  describe('existingTransaction()', () => {
    it('returns an existing transaction given an input address', () => {
      transactionPool.setTransaction(transaction);
      expect(transactionPool.existingTransaction({ inputAddress: senderWallet.publicKey })).toEqual(
        // eslint-disable-next-line comma-dangle
        transaction
      );
    });
  });
});
