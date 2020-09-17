const crypto = require('crypto');

const cryptoHash = (...inputs) => {
  const hash = crypto.createHash('sha256');
  hash.update(
    inputs
      .map((input) => JSON.stringify(input))
      .sort()
      // eslint-disable-next-line comma-dangle
      .join(' ')
  );
  return hash.digest('hex');
};

module.exports = cryptoHash;
