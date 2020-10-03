/* eslint-disable no-undef */
const TransactionPool = require('./transaction-pool');
const Transaction = require('./transaction');
const Wallet = require('./index');
const Blockchain = require('../blockchain');

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
  describe('validTransactions()', () => {
    let validTransactions;
    let errorMock;

    beforeEach(() => {
      validTransactions = [];
      errorMock = jest.fn();
      global.console.error = errorMock;
      for (let i = 0; i < 10; i += 1) {
        transaction = new Transaction({
          senderWallet,
          recipient: 'any-recipient',
          amount: 1,
        });
        transactionPool.setTransaction(transaction);
        if (i % 3 === 0) {
          transaction.input.amount = 999999;
        } else if (i % 3 === 1) {
          transaction.input.signature = new Wallet().sign('foo');
        } else {
          validTransactions.push(transaction);
        }
      }
    });
    it('returns valid transaction', () => {
      expect(transactionPool.validTransactions()).toEqual(validTransactions);
    });
  });
  describe('clear()', () => {
    it('clears the transactions', () => {
      transactionPool.clear();
      expect(transactionPool.transactionMap).toEqual({});
    });
  });
  describe('clearBlockchainTransactions()', () => {
    it('clears the pool of any existing blockchain transactions', () => {
      const blockchain = new Blockchain();
      const expectTransactionMap = {};
      for (let i = 0; i < 6; i += 1) {
        transaction = new Transaction({
          recipient: 'foo',
          amount: 20,
          senderWallet,
        });
        transactionPool.setTransaction(transaction);
        if (i % 2 === 0) {
          blockchain.addBlock({ data: [transaction] });
        } else {
          expectTransactionMap[transaction.id] = transaction;
        }
      }
      transactionPool.clearBlockchainTransactions({ chain: blockchain.chain });
      expect(transactionPool.transactionMap).toEqual(expectTransactionMap);
    });
  });
});
