# Kinvey HTML5 SDK

## Installation

From the command prompt go to your app's root folder and execute:

```bash
npm i kinvey-html5-sdk@next
```

or if you would prefer you can just [download the latest bundle](https://download.kinvey.com/js/kinvey-html5-sdk-3.13.0-next.28.js) and include it in your application.

## Usage

### Initialize SDK

We need to initialize the SDK.

#### JavaScript with NPM
```js
import * as Kinvey from 'kinvey-html5-sdk';

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
