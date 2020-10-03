/* eslint-disable no-undef */
const Wallet = require('./index');
const Blockchain = require('../blockchain');
const Transaction = require('./transaction');
const { verifySignature } = require('../utils');
const { STARTING_BALANCE } = require('../config');

describe('Wallet', () => {
  let wallet;

  beforeEach(() => {
    wallet = new Wallet();
  });

  it('has a `balance`', () => {
    expect(wallet).toHaveProperty('balance');
  });
  it('has a `publicKey`', () => {
    expect(wallet).toHaveProperty('publicKey');
  });

  describe('signing data. ', () => {
    const data = 'Hoang Thuc';
    it('verifies a signature', () => {
      expect(
        // eslint-disable-next-line comma-dangle
        verifySignature({ publicKey: wallet.publicKey, data, signature: wallet.sign(data) })
      ).toBe(true);
    });

    it('does not verify an invalid signature', () => {
      expect(
        // eslint-disable-next-line comma-dangle
        verifySignature({ publicKey: wallet.publicKey, data, signature: new Wallet().sign(data) })
      ).toBe(false);
    });
  });
  describe('createTransaction()', () => {
    describe('and the amount exceed the balance', () => {
      it('throws an error', () => {
        expect(() => wallet.createTransaction({ amount: 9999999999999, recipient: 'foo' })).toThrow(
          // eslint-disable-next-line comma-dangle
          'Amount exceed balance'
        );
      });
    });
    describe('and the amount is valid', () => {
      let transaction;
      let amount;
      let recipient;

      beforeEach(() => {
        amount = 50;
        recipient = 'foo-recipient';
        transaction = wallet.createTransaction({ amount, recipient });
      });
      it('creates an instance of `transaction`', () => {
        expect(transaction instanceof Transaction).toBe(true);
      });
      it('matches the transaction input with the wallet', () => {
        expect(transaction.input.address).toEqual(wallet.publicKey);
      });
      it('outputs the amount the recipient.', () => {
        expect(transaction.outputMap[recipient]).toEqual(amount);
      });
    });
    describe('and a chain is passed', () => {
      it('calls `Wallet.calculateBalance()`', () => {
        const calculateBalanceMock = jest.fn();
        const originalCalculateBalance = Wallet.calculateBalance;
        Wallet.calculateBalance = calculateBalanceMock;
        wallet.createTransaction({
          amount: 20,
          recipient: 'foo',
          chain: new Blockchain().chain,
        });
        expect(calculateBalanceMock).toHaveBeenCalled();
        Wallet.calculateBalance = originalCalculateBalance;
      });
    });
  });
  describe('calculateBalance()', () => {
    let blockchain;

    beforeEach(() => {
      blockchain = new Blockchain();
    });

    describe('and there are no outputs for the wallet', () => {
      it('returns the `STARTING_BALANCE`', () => {
        expect(
          Wallet.calculateBalance({
            chain: blockchain.chain,
            address: wallet.publicKey,
            // eslint-disable-next-line comma-dangle
          })
        ).toEqual(STARTING_BALANCE);
      });
    });
    describe('and there are outputs for the wallet', () => {
      let transactionOne;
      let transactionTwo;

      beforeEach(() => {
        transactionOne = new Wallet().createTransaction({
          amount: 20,
          recipient: wallet.publicKey,
        });
        transactionTwo = new Wallet().createTransaction({
          amount: 60,
          recipient: wallet.publicKey,
        });
        blockchain.addBlock({ data: [transactionOne, transactionTwo] });
      });

      it('adds the sum of all outputs to the wallet balance', () => {
        expect(
          Wallet.calculateBalance({
            chain: blockchain.chain,
            address: wallet.publicKey,
            // eslint-disable-next-line comma-dangle
          })
        ).toEqual(
          STARTING_BALANCE
          + transactionOne.outputMap[wallet.publicKey]
          // eslint-disable-next-line comma-dangle
          + transactionTwo.outputMap[wallet.publicKey]
        );
      });
      describe('and the wallet has made a transaction', () => {
        let recentTransaction;

        beforeEach(() => {
          recentTransaction = wallet.createTransaction({
            amount: 10,
            recipient: 'foo-address',
          });
          blockchain.addBlock({ data: [recentTransaction] });
        });

        it('returns the output amount of recent transaction', () => {
          expect(
            Wallet.calculateBalance({
              chain: blockchain.chain,
              address: wallet.publicKey,
              // eslint-disable-next-line comma-dangle
            })
          ).toEqual(recentTransaction.outputMap[wallet.publicKey]);
        });

        describe('and there are outputs next to and after the recent transaction', () => {
          let sameBlockTransaction;
          let nextBlockTransaciton;

          beforeEach(() => {
            recentTransaction = wallet.createTransaction({
              recipient: 'later-foo-address',
              amount: 60,
            });
            sameBlockTransaction = Transaction.rewardTransaction({ minerWallet: wallet });
            blockchain.addBlock({ data: [recentTransaction, sameBlockTransaction] });
            nextBlockTransaciton = new Wallet().createTransaction({
              recipient: wallet.publicKey,
              amount: 75,
            });
            blockchain.addBlock({ data: [nextBlockTransaciton] });
          });

          it('includes the output amounts of in the returned balance', () => {
            expect(
              Wallet.calculateBalance({
                chain: blockchain.chain,
                address: wallet.publicKey,
                // eslint-disable-next-line comma-dangle
              })
            ).toEqual(
              // eslint-disable-next-line operator-linebreak
              recentTransaction.outputMap[wallet.publicKey] +
                // eslint-disable-next-line operator-linebreak
                sameBlockTransaction.outputMap[wallet.publicKey] +
                // eslint-disable-next-line comma-dangle
                nextBlockTransaciton.outputMap[wallet.publicKey]
            );
          });
        });
      });
    });
  });
});
