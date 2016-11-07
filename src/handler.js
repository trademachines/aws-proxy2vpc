'use strict';

const request = require('request');

const buildHttpRequest = (cfg, event) => {
  const path  = event.path;
  const alias = event.requestContext.stage;
  const url   = !!cfg[alias] ? cfg[alias].host : null;

  if (!url) {
    throw new Error(`Cant find url for alias ${alias}`);
  }

  const options = {
    method: event.httpMethod,
    headers: event.headers,
    qs: event.queryStringParameters || {},
  };

  return {
    url: `${url}${path}`,
    options: options,
  };
};

module.exports = (err, cfg, event, context) => {
  if (err) {
    return context.fail(err);
  }

  const req = buildHttpRequest(cfg, event);
  request(req.url, req.options, (err, response, body) => {
    if (err) {
      return context.fail(err);
    }

    context.succeed({
      statusCode: response.statusCode,
      headers: response.headers,
      body: body,
    });
  });
};

module.exports.buildHttpRequest = buildHttpRequest;
