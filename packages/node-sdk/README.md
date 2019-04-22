# Kinvey NodeJS SDK

## Installation

From the command prompt go to your app's root folder and execute:

```bash
npm i kinvey-node-sdk@next
```

## Usage

### Initialize SDK

We need to initialize the SDK.

#### JavaScript with NPM
```js
var Kinvey = require('kinvey-node-sdk');

Kinvey.init({
  appKey: '<yourAppKey>',
  appSecret: '<yourAppSecret>'
});
```

## Build

If you would like to build the SDK yourself, clone the monorepo, then:
- `npm i`
- `npm run build`

You can then install the SDK build by running `npm i /<localpath>/packages/node-sdk`
