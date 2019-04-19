# Kinvey NativeScript SDK

## Installation

From the command prompt go to your app's root folder and execute:

```bash
npm i kinvey-nativescript-sdk@next events@3.0.0 js-base64@2.5.1 lodash@4.17.11 loglevel@1.6.1 loglevel-plugin-prefix@0.8.4 nativescript-secure-storage@2.4.0 nativescript-sqlite@2.3.3 nativescript-urlhandler@1.2.3 p-queue@4.0.0 pubnub@git+https://github.com/thomasconner/javascript.git#develop rxjs@6.4.0 sift@7.0.1 tns-core-modules@5.2.2 tslib@1.9.3 url@0.11.0 url-join@4.0.0
```

## Usage

### Initialize SDK

We need to initialize the SDK before your app starts, so open `app.js` and add this before `application.start();`:

#### JavaScript
```js
var Kinvey = require('kinvey-nativescript-sdk');

Kinvey.init({
  appKey: '<yourAppKey>',
  appSecret: '<yourAppSecret>'
});
```

#### TypeScript
```js
const Kinvey = require('kinvey-nativescript-sdk');

Kinvey.init({
  appKey: '<yourAppKey>',
  appSecret: '<yourAppSecret>'
});
```

#### Angular
Please take a look at our `kinvey-nativescript-angular-sdk`.

## Build

If you would like to build the SDK yourself, clone the monorepo, then:
- `npm i`
- `npm run build`

You can then install the SDK build by running `npm i /<localpath>/packages/nativescript-sdk`
