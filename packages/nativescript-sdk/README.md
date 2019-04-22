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
import { UserService } from 'kinvey-nativescript-sdk/angular';

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

#### Push

You will need to install `nativescript-plugin-firebase` and follow the instructions at https://github.com/EddyVerbruggen/nativescript-plugin-firebase#prerequisites on how to setup your app. Make sure to require the `nativescript-plugin-firebase` plugin in your `app.ts` file as shown in the [example app](https://github.com/EddyVerbruggen/nativescript-plugin-firebase/blob/master/demo-push/app/app.ts#L5).

You can then use the Push module to register the device running your app like this:

```js
import * as Push from 'kinvey-nativescript-sdk/push';

function receivedPushNotificaiton(message) {
  console.log("Title: " + message.title);
  console.log("Body: " + message.body);
  // if your server passed a custom property called 'foo', then do this:
  console.log("Value of 'foo': " + message.data.foo);
}

Push.register(receivedPushNotification)
  .then((deviceToken) => {
    console.log(`The device with device token ${deviceToken} is registered for push.`);
  })
  .catch((error) => {
    console.log(error);
  })
```

To unregister the device running your app do this:

```js
import * as Push from 'kinvey-nativescript-sdk/push';

Push.unregister()
  .then((deviceToken) => {
    console.log(`The device with device token ${deviceToken} has been unregistered for push.`);
  })
  .catch((error) => {
    console.log(error);
  })
```

##### Angular

You will need to import the `KinveyPushModule` in your `app.module.ts` like this:

```js
import { NgModule } from '@angular/core';
import { KinveyModule } from 'kinvey-nativescript-sdk/angular';
import { KinveyPushModule } from 'kinvey-nativescript-sdk/angular/push';

@NgModule({
  imports: [
    KinveyModule.init({
      appKey: '<yourAppKey>',
      appSecret: '<yourAppSecret>'
    }),
    KinveyPushModule
  ]
})
export class AppModule { }
```

Then you can use dependency injection to inject the `PushService` in your module like this:

```js
import { Component } from '@angular/core';
import { PushService } from 'kinvey-nativescript-sdk/angular/push';

@Component()
export class AppComponent {
  constructor(private pushService: PushService) {}

  receivedPushNotificaiton(message) {
    console.log("Title: " + message.title);
    console.log("Body: " + message.body);
    // if your server passed a custom property called 'foo', then do this:
    console.log("Value of 'foo': " + message.data.foo);
  }

  async registerForPush() {
    try {
      const deviceTokne = await this.pushService.register(this.receivedPushNotification);
      console.log(`The device with device token ${deviceToken} has been unregistered for push.`);
    } catch (error) {
      console.log(error);
    }
  }
}
```

## Build

If you would like to build the SDK yourself, clone the monorepo, then:
- `npm i`
- `npm run build`

You can then install the SDK build by running `npm i /<localpath>/packages/nativescript-sdk`
