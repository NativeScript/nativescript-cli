
var expect = require("chai").expect;
var arrayFind = require('../index');

var runTests = function () {

  describe('Array', function(){

      var list = [5, 10, 15, 20];

      describe('#find', function() {
        it('should have a length of 1', function() {
          expect(Array.prototype.find.length).to.equal(1);
        });

        it('should find item by predicate', function() {
          var result = list.find(function(item) { return item === 15; });
          expect(result).to.equal(15);
        });

        it('should return undefined when nothing matched', function() {
          var result = list.find(function(item) { return item === 'a'; });
          expect(result).to.equal(undefined);
        });

        it('should throw TypeError when function was not passed', function() {
          expect(function() { list.find(); }).to.throw(TypeError);
        });

        it('should receive all three parameters', function() {
          var index = list.find(function(value, index, arr) {
            expect(list[index]).to.equal(value);
            expect(list).to.eql(arr);
            return false;
          });
          expect(index).to.equal(undefined);
        });

        it('should work with the context argument', function() {
          var context = {};
          [1].find(function() { expect(this).to.equal(context); }, context);
        });

        it('should work with an array-like object', function() {
          var obj = { '0': 1, '1': 2, '2': 3, length: 3 };
          var found = Array.prototype.find.call(obj, function(item) { return item === 2; });
          expect(found).to.equal(2);
        });

        it('should work with an array-like object with negative length', function() {
          var obj = { '0': 1, '1': 2, '2': 3, length: -3 };
          var found = Array.prototype.find.call(obj, function(item) {
            throw new Error('should not reach here');
          });
          expect(found).to.equal(undefined);
        });

        it('should work with a sparse array', function() {
          var obj = [1, , undefined];
          expect(1 in obj).to.equal(false);
          var seen = [];
          var found = obj.find(function(item, idx) {
            seen.push([idx, item]);
            return false;
          });
          expect(found).to.equal(undefined);
          expect(seen).to.eql([[0, 1], [1, undefined], [2, undefined]]);
        });

        it('should work with a sparse array-like object', function() {
          var obj = { '0': 1, '2': undefined, length: 3.2 };
          var seen = [];
          var found = Array.prototype.find.call(obj, function(item, idx) {
            seen.push([idx, item]);
            return false;
          });
          expect(found).to.equal(undefined);
          expect(seen).to.eql([[0, 1], [1, undefined], [2, undefined]]);
        });
      });
  });
};


describe('clean Object.prototype', runTests);

describe('polluted Object.prototype', function() {
  Object.prototype[1] = 42;
  runTests();
  delete Object.prototype[1];
});