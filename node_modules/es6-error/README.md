# es6-error

![npm version](https://badge.fury.io/js/es6-error.svg)
![build status](https://travis-ci.org/bjyoungblood/es6-error.svg?branch=master)

An easily-extendable error class for use with ES6 classes (or ES5, if you so
choose).

Tested in Node 4.0, Chrome, and Firefox.

## Why?

I made this because I wanted to be able to extend Error for inheritance and type
checking, but can never remember to add
`Error.captureStackTrace(this, this.constructor.name)` to the constructor or how
to get the proper name to print from `console.log`.

## ES6 Usage

```javascript

import ExtendableError from 'es6-error';

class MyError extends ExtendableError {
  // constructor is optional; you should omit it if you just want a custom error
  // type for inheritance and type checking
  constructor(message = 'Default message') {
    super(message);
  }
}

export default MyError;
```

## ES5 Usage

```javascript

var util = require('util');
var ExtendableError = require('es6-error');

function MyError(message) {
  message = message || 'Default message';
  ExtendableError.call(this, message);
}

util.inherits(MyError, ExtendableError);

module.exports = MyError;
```

#### Todo

- Better browser compatibility
- Browser tests
