IndexedDB Polyfill
================================
#### Use a single offline storage API across all desktop and mobile browsers

[![Build Status](https://img.shields.io/travis/axemclion/IndexedDBShim.svg)](https://travis-ci.org/axemclion/IndexedDBShim)
[![Dependencies](https://img.shields.io/david/dev/axemclion/indexeddbshim.svg)](https://david-dm.org/axemclion/indexeddbshim)
[![npm](http://img.shields.io/npm/v/indexeddbshim.svg)](https://www.npmjs.com/package/indexeddbshim)
[![Bower](http://img.shields.io/bower/v/IndexedDBShim.svg)](http://bower.io/search/?q=IndexedDBShim)
[![License](https://img.shields.io/npm/l/indexeddbshim.svg)](LICENSE-APACHE)

|[Live Demo!](http://nparashuram.com/IndexedDBShim/tests/index.html?useShim=true)
|------------------------------------------------------------


Features
--------------------------
* Adds full IndexedDB support to any web browser that [supports WebSql](http://caniuse.com/#search=websql)
* Does nothing if the browser already [natively supports IndexedDB](http://caniuse.com/#search=indexeddb)
* Can _optionally replace_ native IndexedDB on browsers with [buggy implementations](http://www.raymondcamden.com/2014/9/25/IndexedDB-on-iOS-8--Broken-Bad)
* Can _optionally enhance_ native IndexedDB on browsers that are [missing certain features](http://codepen.io/cemerick/pen/Itymi)
* Works on __desktop__ and __mobile__ devices.
* Works on __Cordova__ and __PhoneGap__ via the [IndexedDB plug-in](http://plugins.cordova.io/#/package/com.msopentech.websql)
* This shim is basically an IndexedDB-to-WebSql adapter
* More details about the project at [gh-pages](http://nparashuram.com/IndexedDBShim)


Installation
--------------------------
You can download the [development](https://raw.githubusercontent.com/axemclion/IndexedDBShim/master/dist/indexeddbshim.js) or [production (minified)](https://raw.githubusercontent.com/axemclion/IndexedDBShim/master/dist/indexeddbshim.min.js) script, or install it using [NPM](https://docs.npmjs.com/getting-started/what-is-npm) or [Bower](http://bower.io/).

#### Node
````bash
npm install indexeddbshim
````

#### Bower
````bash
bower install IndexedDBShim
````


Using the polyfill
--------------------------
Add the script to your page

````html
<script src="dist/indexeddbshim.min.js"></script>
````

If the browser already natively supports IndexedDB, then the script won't do anything.  Otherwise, it'll add the [IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) to the browser.   Either way, you can use IndexedDB just like normal. [Here's an example](https://gist.github.com/BigstickCarpet/a0d6389a5d0e3a24814b)


Fixing Problems in Native IndexedDB
--------------------------
Even if a browser natively supports IndexedDB, you may still want to use this shim.  Some native IndexedDB implemenatations are [very buggy](http://www.raymondcamden.com/2014/9/25/IndexedDB-on-iOS-8--Broken-Bad).  Others are [missing certain features](http://codepen.io/cemerick/pen/Itymi).  There are also many minor inconsistencies between different browser implementations of IndexedDB, such as how errors are handled, how transaction timing works, how records are sorted, how cursors behave, etc.  Using this shim will ensure consistent behavior across all browsers.

To force IndexedDBShim to shim the browser's native IndexedDB, add this line to your script:

````javascript
window.shimIndexedDB.__useShim()
````

On browsers that support WebSQL, this line will _completely replace_ the native IndexedDB implementation with the IndexedDBShim-to-WebSQL implementation.

On browsers that _don't_ support WebSQL, but _do_ support IndexedDB, this line will patch many known problems and add missing features.  For example, on Internet Explorer, this will add support for compound keys.


Debugging
--------------------------
The IndexedDB polyfill has sourcemaps enabled, so the polyfill can be debugged even if the minified file is included. 

To print out detailed debug messages, add this line to your script:

````javascript
window.shimIndexedDB.__debug(true);
````


Known Issues
--------------------------
All code has bugs, and this project is no exception.  If you find a bug, please [let us know about it](https://github.com/axemclion/IndexedDBShim/issues).  Or better yet, [send us a fix](https://github.com/axemclion/IndexedDBShim/pulls)!   Please make sure someone else hasn't already reported the same bug though.

There are a few bugs that are outside of our power to fix.  Namely:

#### iOS
Due to a [bug in WebKit](https://bugs.webkit.org/show_bug.cgi?id=137034), the `window.indexedDB` property is read-only and cannot be overridden by IndexedDBShim.  There are two possible workarounds for this:

1. Use `window.shimIndexedDB` instead of `window.indexedDB` 
2. Create an `indexedDB` variable in your closure
By creating a variable named `indexedDB`, all the code within that closure will use the variable instead of the `window.indexedDB` property.  For example:

````javascript
(function() {
    // This works on all browsers, and only uses IndexedDBShim as a final fallback 
    var indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB || window.shimIndexedDB;

    // This code will use the native IndexedDB, if it exists, or the shim otherwise
    indexedDB.open("MyDatabase", 1);
})();
````

#### Windows Phone
IndexedDBShim works on Windows Phone via a Cordova/PhoneGap plug-in.  There are two plugins available: [cordova-plugin-indexedDB](https://github.com/MSOpenTech/cordova-plugin-indexedDB) and [cordova-plugin-indexeddb-async](https://github.com/ABB-Austin/cordova-plugin-indexeddb-async).  Both plug-ins rely on a WebSQL-to-SQLite adapter, but there are differences in their implementations.  Try them both and see which one works best for your app.


Building
--------------------------
To build the project locally on your computer:

1. __Clone this repo__<br>
`git clone https://github.com/axemclion/IndexedDBShim.git`

2. __Install dev dependencies__<br>
`npm install`

3. __Run the build script__<br>
`npm start`

4. __Done__<br>
The output files will be generated in the `dist` directory


Testing
--------------------------

#### Automated Unit Tests
Follow all of the steps above to build the project, then run `npm test` to run the unit tests.  The tests are run in [PhantomJS](http://phantomjs.org/), which is a headless WebKit browser.

#### Testing in a Browser
If you want to run the tests in a normal web browser. Then you'll need to spin-up a local web server and then open [`test/index.html`](https://github.com/axemclion/IndexedDBShim/blob/master/test/index.html) and/or [`tests/index.html`](https://github.com/axemclion/IndexedDBShim/blob/master/tests/index.html) in your browser.

#### Testing in a Cordova/PhoneGap app
If you want to run the tests in a Cordova or PhoneGap app, then you'll need to create a new Cordova/PhoneGap project, and add the [IndexedDB plug-in](http://plugins.cordova.io/#/package/com.msopentech.indexeddb).   Then copy the contents of our [`tests`](https://github.com/axemclion/IndexedDBShim/tree/master/tests) directory into your project's `www` directory.   Delete our [`index.html`](https://github.com/axemclion/IndexedDBShim/blob/master/tests/index.html) file and rename [`cordova.html`](https://github.com/axemclion/IndexedDBShim/blob/master/tests/cordova.html) to `index.html`.


Contributing
--------------------------
Pull requests or Bug reports welcome !!

