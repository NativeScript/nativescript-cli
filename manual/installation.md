# Installation
The Kinvey JavaScript SDK can be installed using `npm`, `bower`, or downloading the SDK from the Kinvey CDN.

### 1. Install
Please use the section for the platform you will be using to develop your JavaScript app.

#### Angular
You can install the SDK using npm:

```bash
npm install kinvey-angular-sdk --save
```

or

```bash
bower install kinvey-angular-sdk --save
```

If you installed the SDK with npm, import the SDK into your main JavaScript file using `require`:

```javascript
require('kinvey-angular-sdk');
```

If you installed the SDK with bower, add a script tag to your main html file:

```html
<script src="bower_components/kinvey-angular-sdk/dist/kinvey-angular-sdk.min.js"></script>
```

#### Angular2
You can install the SDK using npm:

```bash
npm install kinvey-angular2-sdk --save
```

or

```bash
bower install kinvey-angular2-sdk --save
```

If you installed the SDK with npm, import the SDK into your main JavaScript file using `require`:

```javascript
require('kinvey-angular2-sdk');
```

If you installed the SDK with bower, add a script tag to your main html file:

```html
<script src="bower_components/kinvey-angular2-sdk/dist/kinvey-angular2-sdk.min.js"></script>
```

#### HTML5
You can install the SDK using npm:

```bash
npm install kinvey-html5-sdk --save
```

or

```bash
bower install kinvey-html5-sdk --save
```

If you installed the SDK with npm, import the SDK in your code using `require`:

```javascript
var Kinvey = require('kinvey-html5-sdk');
```

If you installed the SDK with bower, add a script tag to your main html file:

```html
<script src="bower_components/kinvey-html5-sdk/dist/kinvey-html5-sdk.min.js"></script>
```

#### NodeJS
You can install the SDK using npm:

```bash
npm install kinvey-html5-sdk --save
```

Once you installed the SDK with npm, import the SDK in your code using `require`:

```javascript
var Kinvey = require('kinvey-html5-sdk');
```

#### PhoneGap
TBD

### 2. Configure
Next, use `Kinvey.init` to configure your app. Replace `<appKey>` and `<appSecret>` with your apps app key and secret. You can find these for your app using the [Kinvey Console App](https://console.kinvey.com).

#### Angular Applications
```javascript
var app = angular.module('myApp', ['kinvey']);
app.config(['$kinveyProvider', function($kinveyProvider) {
  $kinveyProvider.init({
    appKey: '<appKey>',
    appSecret: '<appSecret>'
  });
}]);
```

#### All other JavaScript Applications
```javascript
Kinvey.init({
    appKey: '<appKey>',
    appSecret: '<appSecret>'
});
```

#### 3. Verify Set Up
You can use the following snippet to verify the app credentials were entered correctly. This function will contact the backend and verify that the SDK can communicate with your app.

#### Angular Applications
```javascript
var app = angular.module('myApp', ['kinvey']);
app.run(['$kinvey', function($kinvey) {
  var promise = $kinvey.ping();
  promise.then(function(response) {
      console.log('Kinvey Ping Success. Kinvey Service is alive, version: ' + response.version + ', response: ' + response.kinvey);
  }).catch(function(error) {
      console.log('Kinvey Ping Failed. Response: ' + error.message);
  });
}]);
```

#### All other JavaScript Applications
```javascript
var promise = Kinvey.ping();
promise.then(function(response) {
    console.log('Kinvey Ping Success. Kinvey Service is alive, version: ' + response.version + ', response: ' + response.kinvey);
}).catch(function(error) {
    console.log('Kinvey Ping Failed. Response: ' + error.message);
});
```
