'use strict';

var expect = require('chai').expect;
var sinon = require('sinon');
var MemoryCache = require('../lib/memory-cache');

describe('MemoryCache', function () {
    var cache;

    beforeEach(function () {
        cache = new MemoryCache();
    });

    describe('#set/#get', function () {
        it('should set data by keys', function () {
            var data1 = {};
            var data2 = {};
            cache.set('key1', data1);
            cache.set('key2', data2);

            expect(cache.get('key1')).to.equal(data1);
            expect(cache.get('key2')).to.equal(data2);
        });

        it('should return undefiend for non-existed key', function () {
            expect(cache.get('key')).to.not.exist;
        });

        it('should set expiration for data', function () {
            var clock = sinon.useFakeTimers();

            cache.set('key', 1, 100);
            expect(cache.get('key')).to.equal(1);

            clock.tick(50 * 1000);
            expect(cache.get('key')).to.equal(1);

            clock.tick(100 * 1000);
            expect(cache.get('key')).to.not.exist;

            clock.restore();
        });

        describe('when expiration time is 0', function () {
            it('should not expire value', function () {
                var clock = sinon.useFakeTimers();

                cache.set('key', 'val', 0);
                expect(cache.get('key')).to.equal('val');

                clock.tick(0);
                expect(cache.get('key')).to.equal('val');

                clock.tick(100 * 1000);
                expect(cache.get('key')).to.equal('val');
            });
        });

        it('should update data and expiration', function () {
            var clock = sinon.useFakeTimers();

            cache.set('key', 1, 50);
            cache.set('key', 2, 100);

            clock.tick(50 * 1000);
            expect(cache.get('key')).to.equal(2);

            clock.tick(100 * 1000);
            expect(cache.get('key')).to.not.exist;

            clock.restore();
        });

        it('should remove previous expiration', function () {
            var clock = sinon.useFakeTimers();

            cache.set('key', 1, 1);
            cache.set('key', 2);

            clock.tick(1000);
            expect(cache.get('key')).to.equal(2);

            clock.restore();
        });

        it('should not see data from the other cache', function () {
            var otherCache = new MemoryCache();
            otherCache.set('key', 1);

            expect(cache.get('key')).to.not.exist;
        });

        it('should not search keys in Object.prototype', function () {
            expect(cache.get('hasOwnProperty')).to.not.exist;
        });
    });

    describe('#delete', function () {
        it('should delete data by key', function () {
            cache.set('key', 1);
            cache.delete('key');

            expect(cache.get('key')).to.not.exist;
        });

        it('should work properly with "hasOwnProperty" key', function () {
            cache.set('hasOwnProperty', 1, 1);
            cache.delete('hasOwnProperty');
            expect(cache.get('hasOwnProperty')).to.not.exist;
        });
    });

    describe('#clear', function () {
        it('should clear all data', function () {
            var clock = sinon.useFakeTimers();

            cache.set('key1', 1);
            cache.set('key2', 2, 100);

            cache.clear();
            expect(cache.get('key1')).to.not.exist;
            expect(cache.get('key2')).to.not.exist;

            // Should not throw error after expiration time.
            clock.tick(100 * 1000);

            clock.restore();
        });

        it('should work properly with "hasOwnProperty" key', function () {
            cache.set('hasOwnProperty', 1, 1);
            cache.clear();
            expect(cache.get('hasOwnProperty')).to.not.exist;
        });
    });
});
