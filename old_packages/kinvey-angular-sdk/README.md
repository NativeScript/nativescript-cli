# Overview

[Kinvey](http://www.kinvey.com) (pronounced Kin-vey, like convey) makes it ridiculously easy for developers to setup, use and operate a cloud backend for their mobile apps. They don't have to worry about connecting to various cloud services, setting up servers for their backend, or maintaining and scaling them.

## Getting Started

Install and save the Kinvey Angular SDK:

```javascript
npm install --save kinvey-angular-sdk
```

Import the Kinvey Angular SDK:

```javascript
require('kinvey-phonegap-sdk');
```

You will then need to inlcude `kinvey` as a dependency for your app.

```javascript
const app = angular.module('myApp', ['kinvey']);
app.run(['$kinvey'], function($kinvey) {
  // ...
});
```

## Browser and Mobile OS Compatibility

The Kinvey Angular SDK supports the following Browser and Mobile OS versions:

- Safari 10+
- Chrome 56+
- Firefox 50+
- IE 11
- Edge
- iOS Safari
- Android Chrome (Performance depends on device)
- iOS: 10.0+
- Android: 2.3.3+

## Documentation

For more detailed documentation, see [Kinvey DevCenter](http://devcenter.kinvey.com/angular).

## License

See [LICENSE](LICENSE) for details.
