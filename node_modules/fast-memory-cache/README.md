# fast-memory-cache [![Build Status](https://travis-ci.org/mdevils/fast-memory-cache.svg?branch=master)](https://travis-ci.org/mdevils/fast-memory-cache)

Simple in-memory cache implementation for Node.js

## Installation

```
npm install --save fast-memory-cache
```

## Usage example

```js
var MemoryCache = require('fast-memory-cache');

// Create cache
var cache = new MemoryCache();

// Get/set value
var val = cache.get('key'); // undefined
cache.set('key', 'value');
val = cache.get('key'); // 'value'

// Delete value
cache.delete('key');
val = cache.get('key'); // undefined

// Set value which will expire after 1 second
cache.set('key', 'new-value', 1);
setTimeout(function () {
    val = cache.get('key'); // undefined
}, 2000);
```

## Running tests

```
npm install
npm test
```
