'use strict';

const _              = require('lodash');
const configResolver = require('./config-resolver');

describe('resolve config', () => {
  const decrypted = {
    Plaintext: new Buffer('decrypted', 'ascii'),
  };
  let kms;
  let config;

  beforeEach(() => {
    configResolver.reset();
    config = {
      getConfig: _.noop,
    };
    kms    = {
      decrypt: (args, cb) => cb(null, decrypted),
    };
  });

  it('decrypts all encoded data', (done) => {
    const encryptedCfg = {
      one: '1',
      two: 2,
      three: 'ENC[KMS,encrypted]',
      four: ['ENC[KMS,encrypted]', ['ENC[KMS,encrypted]']],
      five: {
        nestedOne: 'ENC[KMS,encrypted]',
        nestedTwo: ['ENC[KMS,encrypted]'],
      },
      six: true,
    };
    spyOn(kms, 'decrypt').and.callThrough();

    configResolver.resolve(kms, encryptedCfg, (err, cfg) => {
      if (err) {
        return done.fail(err);
      }

      const expectedConfig = {
        one: '1',
        two: 2,
        three: 'decrypted',
        four: ['decrypted', ['decrypted']],
        five: {
          nestedOne: 'decrypted',
          nestedTwo: ['decrypted'],
        },
        six: true,
      };
      expect(cfg).toEqual(expectedConfig);
      expect(kms.decrypt).toHaveBeenCalledTimes(5);

      done();
    });
  });

  it('caches config and only resolve it once', (done) => {
    spyOn(config, 'getConfig').and.callFake((ctx, cb) => {
      cb(null, {some: 'thing'});
    });

    const resolver = configResolver(config, kms, _.after(2, () => {
      expect(config.getConfig).toHaveBeenCalledTimes(1);
      done();
    }));

    resolver({}, {}, _.noop);
    resolver({}, {}, _.noop);
  });
});

