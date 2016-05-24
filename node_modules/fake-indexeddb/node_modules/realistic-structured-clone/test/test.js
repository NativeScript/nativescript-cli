'use strict';

var assert = require('assert');
var structuredClone = require('..');

describe('Valid Input', function () {
    var confirmWorks = function (x) {
        if (x !== x) { // Special case for NaN
            assert(structuredClone(x) !== structuredClone(x));
        } else if (x instanceof RegExp) {
            var y = structuredClone(x);
            assert.equal(x.source, y.source);
            assert.equal(x.global, y.global);
            assert.equal(x.ignoreCase, y.ignoreCase);
            assert.equal(x.multiline, y.multiline);
        } else {
            assert.deepEqual(structuredClone(x), x);
        }
    };

    it('Primitive Types', function () {
        confirmWorks('string');
        confirmWorks(6);
        confirmWorks(NaN);
        confirmWorks(true);
        confirmWorks(undefined);
        confirmWorks(null);
    });

    it('Date', function () {
        confirmWorks(new Date());
        confirmWorks(new Date('2015-05-06T23:27:37.535Z'));
    });

    it('RegExp', function () {
        confirmWorks(new RegExp('ab+c', 'i'));
        confirmWorks(/ab+c/i);
    });

    it('Array', function () {
        confirmWorks([1, 2, 5, 3]);
        confirmWorks(['a', 'g', 2, true, null]);
    });

    it('Plain Object', function () {
        confirmWorks({
            a: 1,
            b: 2,
            c: true,
            d: undefined,
            e: 'f'
        });
    });

    it('Circular Reference', function () {
        var circular = [];
        circular.push(circular);

        // Can't use confirmWorks because deepEqual can't handle it
        var circular2 = structuredClone(circular);
        assert.equal(typeof circular, typeof circular2);
        assert.equal(circular.length, circular2.length);
        assert.equal(circular, circular[0]);
        assert.equal(circular2, circular2[0]);
    });

    it('Big Nested Thing', function () {
        confirmWorks({
            a: [1, 2, new Date()],
            b: {
                c: {
                    d: 1,
                    e: true,
                    f: [1, 'a', undefined, {g: 6, h: 10}]
                }
            }
        });
    });
});

describe('Invalid Input', function () {
    var confirmFails = function (x) {
        assert.throws(function () {
            structuredClone(x);
        });
    };

    it('Function', function () {
        confirmFails(function () {});
    });

    it('Error', function () {
        confirmFails(new Error());
    });
});
