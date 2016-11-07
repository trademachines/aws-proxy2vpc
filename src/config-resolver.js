'use strict';

const async         = require('neo-async');
const _             = require('lodash');
const encodingRegex = /^ENC\[([^,]+),(.*)\]$/;

let cachedConfig;

const resolve = (kms, cfg, cb) => {
  let matches;

  switch (true) {
    case _.isArray(cfg):
      async.map(cfg, _.partial(resolve, kms), cb);
      break;
    case _.isObject(cfg):
      async.mapValues(cfg, (v, k, cb) => resolve(kms, v, cb), cb);
      break;
    case _.isString(cfg) && (null != (matches = cfg.match(encodingRegex))):
      // don't distinguish by type, we assume its KMS
      // const type    = matches[ 1 ];
      const params = {
        CiphertextBlob: new Buffer(matches[2], 'base64'),
      };

      kms.decrypt(params, (err, data) => {
        if (err) {
          return cb(err);
        }

        return cb(null, data.Plaintext.toString('ascii'));
      });
      break;
    default:
      cb(null, cfg);
  }
};

module.exports = (config, kms, callback) => {
  return (ev, ctx, cb) => {
    if (cachedConfig) {
      return callback(null, cachedConfig, ev, ctx, cb);
    }

    config.getConfig(ctx, (err, cfg) => {
      if (err) {
        return callback(err, null, ev, ctx, cb);
      }

      resolve(kms, cfg, (err, c) => {
        if (!err) {
          cachedConfig = c;
        }

        callback(err, c, ev, ctx, cb);
      });
    });
  };
};

module.exports.reset   = () => {
  cachedConfig = null;
};
module.exports.resolve = resolve;
