const AWS            = require('aws-sdk');
const config         = require('aws-lambda-config');
const configResolver = require('./src/config-resolver');
const handler        = require('./src/handler');
const kms            = new AWS.KMS();

exports.handle = configResolver(config, kms, handler);
