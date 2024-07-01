function deserialize(/** @type {string} */s) {
  // You MUST not pass untrusted input to this as deserialization is just a glorified eval().
  return new Function(`return (${s});`)();
}

module.exports = {
  serialize: require('serialize-javascript'),
  deserialize,
}
