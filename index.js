const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const Blockchain = require('./blockchain');
const PubSub = require('./app/pubsub');

const app = express();
const blockchain = new Blockchain();
const pubsub = new PubSub({ blockchain });

const ROOT_NODE_ADDRESS = 'http://localhost:3000';

app.use(bodyParser.json());

app.get('/api/blocks', (req, res) => {
  res.json(blockchain.chain);
});

app.post('/api/mine', (req, res) => {
  const { data } = req.body;
  blockchain.addBlock({ data });
  pubsub.broadcastChain();
  res.redirect('/api/blocks');
});

const syncChain = () => {
  request({ url: `${ROOT_NODE_ADDRESS}/api/blocks` }, (error, response, body) => {
    if (!error && response.statusCode === 200) {
      const rootChain = JSON.parse(body);
      blockchain.replaceChain(rootChain);
    }
  });
};

if (process.env.GENERATE_PEER_PORT === 'true') {
  process.env.PORT = 3000 + Math.ceil(Math.random() * 1000);
}

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log('Server is running at port ', port);
  if (port !== 3000) {
    syncChain();
  }
});
