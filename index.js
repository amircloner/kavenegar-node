'use strict';
// Backward compatibility entry: preserves previous require('kavenegar').KavenegarApi(options)
// while also allowing require('kavenegar') to directly return the factory

const fs = require('fs');
const path = require('path');

// Check if dist file exists, if not try to build it
const distPath = path.resolve(__dirname, 'dist', 'kavenegar.js');
if (!fs.existsSync(distPath)) {
  const { execSync } = require('child_process');
  try {
    console.log('Building TypeScript sources...');
    execSync('npx tsc', { cwd: __dirname, stdio: 'inherit' });
  } catch (error) {
    throw new Error('Failed to build TypeScript sources. Please run "npm install" to install dependencies and try again.');
  }
}

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
