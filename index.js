'use strict';
// Backward compatibility entry: preserves previous require('kavenegar').KavenegarApi(options)
// while also allowing require('kavenegar') to directly return the factory
const lib = require('./dist/kavenegar.js');

module.exports = {
  ...lib,
  KavenegarApi: lib.KavenegarApi || lib.default,
  default: lib.KavenegarApi || lib.default
};
