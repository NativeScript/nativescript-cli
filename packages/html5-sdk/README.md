# Kinvey HTML5 SDK

## Installation

From the command prompt go to your app's root folder and execute:

```bash
npm i kinvey-html5-sdk@next axios@0.18.0 events@3.0.0 js-base64@2.5.1 lodash@4.17.11 loglevel@1.6.1 loglevel-plugin-prefix@0.8.4 p-queue@4.0.0 pubnub@4.23.0 rxjs@6.4.0 sift@7.0.1 tslib@1.9.3 url@0.11.0 url-join@4.0.0
```

or if you would prefer you can just [download the latest bundle](https://download.kinvey.com/js/kinvey-html5-sdk-3.13.0-next.27.min.js) and include it in your application.

## Usage

### Initialize SDK

We need to initialize the SDK.

#### JavaScript with NPM
```js
var Kinvey = require('kinvey-nativescript-sdk');

Kinvey.init({
  appKey: '<yourAppKey>',
  appSecret: '<yourAppSecret>'
});
```

#### JavaScript with bundle
```js
window.Kinvey.init({
  appKey: '<yourAppKey>',
  appSecret: '<yourAppSecret>'
});
```

#### Angular
Please take a look at our `kinvey-angular-sdk`.

## Build

If you would like to build the SDK yourself, clone the monorepo, then:
- `npm i`
- `npm run build`

You can then install the SDK build by running `npm i /<localpath>/packages/html5-sdk`
