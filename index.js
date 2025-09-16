'use strict';
// Backward compatibility entry: preserves previous require('kavenegar').KavenegarApi(options)
// while also allowing require('kavenegar') to directly return the factory
const lib = require('./dist/kavenegar.js');

// Factory function for backward compatibility (without 'new')
function KavenegarApiFactory(options) {
  return new lib.KavenegarApi(options);
}

module.exports = {
  ...lib,
  KavenegarApi: KavenegarApiFactory,
  KavenegarApiClass: lib.KavenegarApi,
  default: KavenegarApiFactory
};
