# Kinvey NativeScript Angular SDK

## Installation

From the command prompt go to your app's root folder and execute:

```bash
npm i kinvey-nativescript-angular-sdk@next kinvey-nativescript-sdk@next @angular/core@7.2.10 events@3.0.0 js-base64@2.5.1 lodash@4.17.11 loglevel@1.6.1 loglevel-plugin-prefix@0.8.4 nativescript-secure-storage@2.4.0 nativescript-sqlite@2.3.3 nativescript-urlhandler@1.2.3 p-queue@4.0.0 pubnub@git+https://github.com/thomasconner/javascript.git#develop rxjs@6.4.0 sift@7.0.1 tns-core-modules@5.2.2 tslib@1.9.3 url@0.11.0 url-join@4.0.0
```

## Usage

### Config

Open `src/package.json` and add this:

```json
{
  "pluginsData": {
    "kinvey-nativescript-sdk": {
      "config": {
        "appKey": "<yourAppKey>",
        "appSecret": "<yourAppSecret>",
        "redirectUri": "<micRedirectUri>" // Optional
      }
    }
  }
}
```

### Initialize SDK

Open `app.module.ts` and add this:

```js
const { KinveyModule } = require('kinvey-nativescript-angular-sdk');

@NgModule({
  imports: [
    KinveyModule.init()
  ]
})
export class AppModule { }
```

## Build

If you would like to build the SDK yourself, clone the monorepo, then:
- `npm i`
- `npm run build`

You can then install the SDK build by running `npm i /<localpath>/packages/nativescript-angular-sdk`
