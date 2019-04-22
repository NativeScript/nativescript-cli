# Kinvey NativeScript SDK

## Installation

From the command prompt go to your app's root folder and execute:

```bash
npm i kinvey-nativescript-sdk@next
```

## Usage

### Initialize SDK

We need to initialize the SDK before your app starts, so open `app.js` and add this before `application.start();`:

#### JavaScript
```js
import * as Kinvey from 'kinvey-nativescript-sdk';

Kinvey.init({
  appKey: '<yourAppKey>',
  appSecret: '<yourAppSecret>'
});
```

#### TypeScript
```js
import * as Kinvey from 'kinvey-nativescript-sdk';

Kinvey.init({
  appKey: '<yourAppKey>',
  appSecret: '<yourAppSecret>'
});
```

#### Angular
Import the `KinveyModule` in your `app.module.ts` like this to initialize the SDK:

```js
import { NgModule } from '@angular/core';
import { KinveyModule } from 'kinvey-nativescript-sdk/angular';

@NgModule({
  imports: [
    KinveyModule.init({
      appKey: '<yourAppKey>',
      appSecret: '<yourAppSecret>'
    })
  ]
})
export class AppModule { }
```

Then you can use dependency injection to inject a Kinvey service in your module like this:

```js
import { Component } from '@angular/core';
import { UserService } from 'kinvey-nativescript-sdk/angular`;

@Component()
export class AppComponent {
  constructor(private userService: UserService) {}

  async login() {
    try {
      const user = await this.userService.login('<username>', '<password>');
      console.log(user);
    } catch (error) {
      console.log(error);
    }
  }
}
```

The following services are available to use with dependency injection:

- `DataStoreService`
- `EndpointService`
- `FilesService`
- `PingService`
- `UserService`

## Build

If you would like to build the SDK yourself, clone the monorepo, then:
- `npm i`
- `npm run build`

You can then install the SDK build by running `npm i /<localpath>/packages/nativescript-sdk`
