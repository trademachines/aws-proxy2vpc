'use strict';

const _       = require('lodash');
const nock    = require('nock');
const handler = require('./handler');
const url     = require('url');

nock.disableNetConnect();

describe('handle events', () => {
  const headers = {
    'Accept': '*/*',
    'Accept-Encoding': 'gzip, deflate',
    'cache-control': 'no-cache',
    'CloudFront-Forwarded-Proto': 'https',
    'CloudFront-Is-Desktop-Viewer': 'true',
    'CloudFront-Is-Mobile-Viewer': 'false',
    'CloudFront-Is-SmartTV-Viewer': 'false',
    'CloudFront-Is-Tablet-Viewer': 'false',
    'CloudFront-Viewer-Country': 'US',
    'Content-Type': 'application/json',
    'headerName': 'headerValue',
    'Host': 'gy415nuibc.execute-api.us-east-1.amazonaws.com',
    'Postman-Token': '9f583ef0-ed83-4a38-aef3-eb9ce3f7a57f',
    'User-Agent': 'PostmanRuntime/2.4.5',
    'Via': '1.1 d98420743a69852491bbdea73f7680bd.cloudfront.net (CloudFront)',
    'X-Amz-Cf-Id': 'pn-PWIJc6thYnZm5P0NMgOUglL1DYtl0gdeJky8tqsg8iS_sgsKD1A==',
    'X-Forwarded-For': '54.240.196.186, 54.182.214.83',
    'X-Forwarded-Port': '443',
    'X-Forwarded-Proto': 'https'
  };
  const event   = {
    'resource': '/{proxy+}',
    'path': '/hello/world',
    'httpMethod': 'POST',
    'headers': headers,
    'queryStringParameters': {
      'name': 'me'
    },
    'pathParameters': {
      'proxy': 'hello/world'
    },
    'stageVariables': {
      'stageVariableName': 'stageVariableValue'
    },
    'requestContext': {
      'accountId': '12345678912',
      'resourceId': 'roq9wj',
      'stage': 'testStage',
      'requestId': 'deef4878-7910-11e6-8f14-25afc3e9ae33',
      'identity': {
        'cognitoIdentityPoolId': null,
        'accountId': null,
        'cognitoIdentityId': null,
        'caller': null,
        'apiKey': null,
        'sourceIp': '192.168.196.186',
        'cognitoAuthenticationType': null,
        'cognitoAuthenticationProvider': null,
        'userArn': null,
        'userAgent': 'PostmanRuntime/2.4.5',
        'user': null
      },
      'resourcePath': '/{proxy+}',
      'httpMethod': 'POST',
      'apiId': 'gy415nuibc'
    },
    'body': '{\r\n\t\'a\': 1\r\n}'
  };
  const config  = {
    testStage: {
      host: 'http://foo.bar'
    }
  };

  describe('build http request', () => {
    it('uses host from config', () => {
      const request = handler.buildHttpRequest(config, event);

      expect(url.parse(request.url).hostname).toEqual('foo.bar');
    });

    it('appends path-alias to destination', () => {
      const request = handler.buildHttpRequest(config, event);

      expect(url.parse(request.url).pathname).toEqual('/hello/world');
    });

    it('uses request method from event', () => {
      const request = handler.buildHttpRequest(config, event);

      expect(request.options.method).toEqual('POST');
    });

    it('uses headers from event', () => {
      const request = handler.buildHttpRequest(config, event);

      expect(request.options.headers).toEqual(headers);
    });

    it('uses query string from event', () => {
      const request = handler.buildHttpRequest(config, event);

      expect(request.options.qs).toEqual({name: 'me'});
    });
  });

  describe('http requests', () => {
    let context = {};

    beforeEach(() => {
      context = {
        fail: _.noop,
        succeed: _.noop,
      };
    });

    it('succeeds context for successful requests', (done) => {
      const httpReq =
              nock(/.*/)
                .post(/.*/)
                .reply(502, 'something went wrong', headers);

      spyOn(context, 'succeed').and.callFake((response) => {
        expect(httpReq.isDone()).toBeTruthy();
        expect(response.statusCode).toBe(502);
        expect(response.body).toBe('something went wrong');

        done();
      });

      handler(null, config, event, context);
    });

    it('fails context for erroneous requests', (done) => {
      const httpReq =
              nock(/.*/)
                .post(/.*/)
                .replyWithError('something awful happened');

      spyOn(context, 'fail').and.callFake((err) => {
        expect(httpReq.isDone()).toBeTruthy();
        expect(err).toEqual(new Error('something awful happened'));

        done();
      });

      handler(null, config, event, context);
    });
  });
});
