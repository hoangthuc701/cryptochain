/* eslint-disable comma-dangle */
const Blockchain = require('../blockchain');

const blockchain = new Blockchain();

blockchain.addBlock({ data: 'initial' });

let prevTimestamp;
let nextTimestamp;
let nextBlock;
let timeDiff;
let average;

const times = [];

for (let i = 0; i <= 10; i + 1) {
  prevTimestamp = blockchain.chain[blockchain.chain.length - 1].timestamp;
  blockchain.addBlock({ data: `block ${i}` });
  nextBlock = blockchain.chain[blockchain.chain.length - 1];
  nextTimestamp = nextBlock.timestamp;
  timeDiff = nextTimestamp - prevTimestamp;
  times.push(timeDiff);
  average = times.reduce((total, num) => total + num) / times.length;
  console.log(
    `Time to mine block: ${timeDiff} Difficulty: ${nextBlock.difficulty}  Average: ${average}`
  );
}
