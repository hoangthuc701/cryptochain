const Block = require("./block");
const cryptoHash = require('./crypto-hash');
const { GENESIS_DATA } = require("./config");

describe("Block", () => {
  const timestamp = "d-date";
  const lastHash = "foo-hash";
  const hash = "bar-hash";
  const data = "Hoang Thuc";
  const block = new Block({ timestamp, lastHash, hash, data });

  it("has a timestamp, lastHash, hash and data property", () => {
    expect(block.timestamp).toEqual(timestamp);
    expect(block.lastHash).toEqual(lastHash);
    expect(block.hash).toEqual(hash);
    expect(block.data).toEqual(data);
  });

  describe("genesis()", () => {
    const genesisBlock = Block.genesis();

    it("returns a Block instance", () => {
      expect(genesisBlock instanceof Block).toEqual(true);
    });

    it("return the genesis data", () => {
      expect(genesisBlock).toEqual(GENESIS_DATA);
    });
  });

  describe('mineBlock()', ()=>{
    const lastBlock  = Block.genesis();
    const data = 'mined data';
    const mineBlock = Block.mineBlock({lastBlock,data});

    it('returns a Block instance', ()=>{
      expect(mineBlock instanceof Block).toEqual(true);
    })

    it('sets the `lastHash` to be the `hash` of the lastBlock. ', ()=>{
      expect(mineBlock.lastHash).toEqual(lastBlock.hash);
    })

    it('sets the `data`', ()=>{
      expect(mineBlock.data).toEqual(data);
    })

    it('sets the `timestamp`', ()=>{
      expect(mineBlock.timestamp).not.toEqual(undefined);
    })

    it('creates a SHA-256 `hash` based on the proper inputs ', ()=>{
      expect(mineBlock.hash).expect(cryptoHash(mineBlock.timestamp,lastBlock.hash, data));
    })

  })
});
