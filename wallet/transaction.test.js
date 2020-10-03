/* eslint-disable no-undef */
const Transaction = require('./transaction');
const Wallet = require('./index');
const { verifySignature } = require('../utils');
const { REWARD_INPUT, MINING_REWARD } = require('../config');

describe('Transaction', () => {
  let transaction;
  let senderWallet;
  let recipient;
  let amount;
  beforeEach(() => {
    senderWallet = new Wallet();
    recipient = 'recipient-public-key';
    amount = 50;
    transaction = new Transaction({ senderWallet, recipient, amount });
  });

  it('has a `id`', () => {
    expect(transaction).toHaveProperty('id');
  });

  describe('outputMap.', () => {
    it('has as `outputMap`.', () => {
      expect(transaction).toHaveProperty('outputMap');
    });
    it('outputs the amount to the recipient', () => {
      expect(transaction.outputMap[recipient]).toEqual(amount);
    });
    it('outputs the remaining balance for the `senderWallet`', () => {
      expect(transaction.outputMap[senderWallet.publicKey]).toEqual(senderWallet.balance - amount);
    });
  });

  describe('input', () => {
    it('has an `input`', () => {
      expect(transaction).toHaveProperty('input');
    });

    it('has a `timestamp` in the input', () => {
      expect(transaction.input).toHaveProperty('timestamp');
    });
    it('sets the `amount` to the `senderWallet`', () => {
      expect(transaction.input.amount).toEqual(senderWallet.balance);
    });
    it('sets the `address` to the `senderWallet` publicKey', () => {
      expect(transaction.input.address).toEqual(senderWallet.publicKey);
    });
    it('signs the input', () => {
      expect(
        verifySignature({
          publicKey: senderWallet.publicKey,
          data: transaction.outputMap,
          signature: transaction.input.signature,
          // eslint-disable-next-line comma-dangle
        })
      ).toBe(true);
    });
  });
  describe('validTransaction()', () => {
    let errorMock;

    beforeEach(() => {
      errorMock = jest.fn();
      global.console.error = errorMock;
    });
    describe('when the transaction is valid', () => {
      it('returns true', () => {
        expect(Transaction.isValidTransaction(transaction)).toBe(true);
      });
    });
    describe('when the transaction is invalid', () => {
      describe('and a transaction outputMap value is invalid', () => {
        it('return false and log an error', () => {
          transaction.outputMap[senderWallet.publicKey] = 99999999;
          expect(Transaction.isValidTransaction(transaction)).toBe(false);
          expect(errorMock).toHaveBeenCalled();
        });
      });
      describe('and the transaction input  signature is invalid', () => {
        it('return false', () => {
          transaction.input.signature = new Wallet().sign('data');
          expect(Transaction.isValidTransaction(transaction)).toBe(false);
          expect(errorMock).toHaveBeenCalled();
        });
      });
    });
  });
  describe('update()', () => {
    let originalSignature;
    let originalSenderOutput;
    let nextRecipient;
    let nextAmount;

    describe('and the amount is invalid', () => {
      it('throw an error', () => {
        // eslint-disable-next-line comma-dangle
        expect(() =>
          // eslint-disable-next-line implicit-arrow-linebreak
          transaction.update({ senderWallet, recipient: 'foo', amount: 99999999999 })).toThrow(
          // eslint-disable-next-line comma-dangle
          'Amount exceeds balance'
        );
      });
    });
    describe('and the amount is valid', () => {
      beforeEach(() => {
        originalSignature = transaction.input.signature;
        originalSenderOutput = transaction.outputMap[senderWallet.publicKey];
        nextRecipient = 'next-recipient';
        nextAmount = 50;

        transaction.update({ senderWallet, recipient: nextRecipient, amount: nextAmount });
      });
      it('outputs the amount to the next recipient', () => {
        expect(transaction.outputMap[nextRecipient]).toEqual(nextAmount);
      });
      it('subtracts the amount from the original `senderWallet`', () => {
        expect(transaction.outputMap[senderWallet.publicKey]).toEqual(
          // eslint-disable-next-line comma-dangle
          originalSenderOutput - nextAmount
        );
      });
      it('maintains a total output that matches the input amount', () => {
        expect(
          // eslint-disable-next-line comma-dangle
          Object.values(transaction.outputMap).reduce((total, outputAmount) => total + outputAmount)
        ).toEqual(transaction.input.amount);
      });
      it('re-sign the transaction', () => {
        expect(transaction.input.signature).not.toEqual(originalSignature);
      });
      describe('and another update for the same recipient', () => {
        let addedAmount;

        beforeEach(() => {
          addedAmount = 80;
          transaction.update({ senderWallet, amount: addedAmount, recipient: nextRecipient });
        });

        it('adds to the recipient amount', () => {
          expect(transaction.outputMap[nextRecipient]).toEqual(nextAmount + addedAmount);
        });
        it('subtracts the amount from the original sender output amount', () => {
          expect(transaction.outputMap[senderWallet.publicKey]).toEqual(
            // eslint-disable-next-line comma-dangle
            originalSenderOutput - nextAmount - addedAmount
          );
        });
      });
    });
  });
  describe('rewardTransaction()', () => {
    let rewardTransaction;
    let minerWallet;
    beforeEach(() => {
      minerWallet = new Wallet();
      rewardTransaction = Transaction.rewardTransaction({ minerWallet });
    });

    it('creates a transaction with the reward input', () => {
      expect(rewardTransaction.input).toEqual(REWARD_INPUT);
    });
    it('creates ones transaction for the miner with the `MINER_REWARD`', () => {
      expect(rewardTransaction.outputMap[minerWallet.publicKey]).toEqual(MINING_REWARD);
    });
  });
});
