# Realistic Structured Clone [![Build Status](https://travis-ci.org/dumbmatter/realistic-structured-clone.svg?branch=master)](https://travis-ci.org/dumbmatter/realistic-structured-clone)

This is a pure JS implementation of the [structured clone algorithm](http://www.w3.org/TR/html5/infrastructure.html#internal-structured-cloning-algorithm) (or at least something pretty close to that).

Why do you want this? Well, you probably don't. If your goal is to just clone a JS object, you're better off with [lodash's _.cloneDeep](https://lodash.com/docs#cloneDeep) or [the popular `clone` module on npm](https://www.npmjs.com/package/clone).

Let's try again... why do you want this? If you are making an implementation of an API that explicitly uses the structured clone algorithm (such as [IndexedDB](https://github.com/dumbmatter/fakeIndexedDB)), then you want something that handles quirks and edge cases exactly like the structured clone algorithm. That's what `realistic-structured-clone` is for. It's not totally there (see below) but it's a decent start.

## Use

[Install through npm:](https://www.npmjs.com/package/realistic-structured-clone)

    $ npm install realistic-structured-clone

Then use it:

    // First load the module
    // (Use Browserify or something if you're targeting the web)
    var structuredClone = require('realistic-structured-clone');

    // Clone a variable (will throw a DataCloneError for invalid input)
    var clonedX = structuredClone(x);

## Alternatives

If you look around, you'll notice various modules calling themselves implementations of the structured clone algorithm, such as [the `structured-clone` package on npm](https://www.npmjs.com/package/structured-clone). But that package, like all the others I've seen, doesn't actually seem to be an attempt at implementing the structured clone algorithm. It's just some arbitrary type of clone. As I wrote above, this distinction only matters if you really care about the nuances of the structured clone algorithm, which you probably don't.

If you're working in the browser, you can do [something like this](https://twitter.com/TedMielczarek/status/591315580277391360) to do a real structured clone:

    function clone(x) {
        return new Promise(function (resolve, reject) {
            window.addEventListener('message', function(e) {
                resolve(e.data);
            });
            window.postMessage(x, "*");
        });
    }
    var x = {a:[1,2,3], b:{c:1}};
    clone(x).then(function(cloned) {
        console.log("x: %s", JSON.stringify(x));
        console.log("cloned: %s", JSON.stringify(cloned));
        console.log("x == cloned %s", x == cloned);
        console.log("x === cloned %s", x === cloned);
    });

However, that won't help you in Node.js/io.js. It's also asynchronous, which could be a problem. `realistic-structured-clone` is synchronous and works everywhere.

## Current State

[The spec](http://www.w3.org/html/wg/drafts/html/master/infrastructure.html#internal-structured-cloning-algorithm) says it's supposed to handle Blob, FileList, ImageData, ImageBitmap, ArrayBuffer, objects with [[DataView]] internal slots, Map, and Set objects. But none of that is implemented yet, so passing an object containing any of those types of objects will result in an erroneous `DataCloneError`.

All other data types should work like described in the spec. Check the tests if you don't believe me, and please create an issue if you find a problem.

## License

Apache 2.0
