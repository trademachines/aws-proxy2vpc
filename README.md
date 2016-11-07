# AWS Proxy2Vpc

## Intention
Sometimes you dont want to put authentication into your component itself. When we encountered that problem
we just put an API Gateway in front it that is secured with an API Key. 

## Configuration
Is done via retrieving the configuration file from S3 by utilising [the aws-lambda-config package](https://www.npmjs.com/package/aws-lambda-config).
On top of that the config is cached for the lifetime of the Lambda function and you can insert a KMS
encrypted value for the token. This will be decrypted in-memory during runtime.

### Configuration example
```
{
  "stage": {
    "host": "http://some.other.domain.com/with/a/path"
  }
}
```

## Deployment
The Lambda can either be deployed manually by zipping the necessary code with

    zip -r aws-cloudwatch2loggly.zip index.js src/ node_modules/ > /dev/null

(don't forget to remove development dependencies) and uploading it to AWS or you utilise things
like Travis CI to do it for you.
