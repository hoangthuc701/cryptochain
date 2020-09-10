/* eslint-disable no-undef */
const HexToBinary = require('hex-to-binary');
const Block = require('./block');
const cryptoHash = require('./crypto-hash');
const { GENESIS_DATA, MINE_RATE } = require('./config');

describe('Block', () => {
  const timestamp = 2000;
  const lastHash = 'foo-hash';
  const hash = 'bar-hash';
  const data = 'Hoang Thuc';
  const nonce = 1;
  const difficulty = 1;
  const block = new Block({
    timestamp,
    lastHash,
    hash,
    data,
    nonce,
    difficulty,
  });

  it('has a timestamp, lastHash, hash, data, nonce and difficulty property', () => {
    expect(block.timestamp).toEqual(timestamp);
    expect(block.lastHash).toEqual(lastHash);
    expect(block.hash).toEqual(hash);
    expect(block.data).toEqual(data);
    expect(block.nonce).toEqual(nonce);
    expect(block.difficulty).toEqual(difficulty);
  });

  describe('genesis()', () => {
    const genesisBlock = Block.genesis();

    it('returns a Block instance', () => {
      expect(genesisBlock instanceof Block).toEqual(true);
    });

    it('return the genesis data', () => {
      expect(genesisBlock).toEqual(GENESIS_DATA);
    });
  });

  describe('mineBlock()', () => {
    const lastBlock = Block.genesis();
    // eslint-disable-next-line no-shadow
    const data = 'mined data';
    const mineBlock = Block.mineBlock({ lastBlock, data });

    it('returns a Block instance', () => {
      expect(mineBlock instanceof Block).toEqual(true);
    });

    it('sets the `lastHash` to be the `hash` of the lastBlock. ', () => {
      expect(mineBlock.lastHash).toEqual(lastBlock.hash);
    });

    it('sets the `data`', () => {
      expect(mineBlock.data).toEqual(data);
    });

    it('sets the `timestamp`', () => {
      expect(mineBlock.timestamp).not.toEqual(undefined);
    });

    it('creates a SHA-256 `hash` based on the proper inputs ', () => {
      expect(mineBlock.hash).toEqual(
        // eslint-disable-next-line comma-dangle
        cryptoHash(mineBlock.timestamp, mineBlock.nonce, mineBlock.difficulty, lastBlock.hash, data)
      );
    });

    it('sets a `hash` that matches the difficulty criteria ', () => {
      expect(HexToBinary(mineBlock.hash).substring(0, mineBlock.difficulty)).toEqual(
        // eslint-disable-next-line comma-dangle
        '0'.repeat(mineBlock.difficulty)
      );
    });

    it('adjusts the difficulty', () => {
      const possibleResults = [lastBlock.difficulty + 1, lastBlock.difficulty - 1];
      expect(possibleResults.includes(mineBlock.difficulty)).toBe(true);
    });
  });

  describe('adjustDifficulty()', () => {
    it('raises the difficulty for a quickly mined block', () => {
      expect(
        Block.adjustDifficulty({
          originalBlock: block,
          timestamp: block.timestamp + MINE_RATE - 100,
          // eslint-disable-next-line comma-dangle
        })
      ).toEqual(block.difficulty + 1);
    });

    it('lower the difficulty for a quickly mined block', () => {
      expect(
        Block.adjustDifficulty({
          originalBlock: block,
          timestamp: block.timestamp + MINE_RATE + 100,
          // eslint-disable-next-line comma-dangle
        })
      ).toEqual(block.difficulty - 1);
    });
    it('has a lower limit of 1', () => {
      block.difficulty = -1;
      expect(Block.adjustDifficulty({ originalBlock: block })).toEqual(1);
    });
  });
});
