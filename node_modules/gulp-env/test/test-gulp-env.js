'use strict';

var env = require('../');
var expect = require('chai').expect;
var fs = require('fs');
var resolve = require('path').resolve;
var gulp = require('gulp');
var through2 = require('through2');

describe('gulp-env', function() {
  function prepVars() {
    delete process.env.STARK;
    delete process.env.BARATHEON;
    delete process.env.LANNISTER;
  }

  it('should exist', function() {
    expect(env).to.exist;
  });

  describe('reads properties from files', function() {
    beforeEach(prepVars);
    afterEach(prepVars);

    it('should add process.env vars from a local module', function() {
      expect(process.env.STARK).not.to.exist
      expect(process.env.BARATHEON).not.to.exist
      expect(process.env.LANNISTER).not.to.exist

      env({file: "test/mock-env-module"})

      expect(process.env.STARK).to.equal("direwolf");
      expect(process.env.BARATHEON).to.equal("stag");
      expect(process.env.LANNISTER).to.equal("lion");
    });

    it('should take the file as the sole argument as a string', function() {
      expect(process.env.STARK).not.to.exist
      expect(process.env.BARATHEON).not.to.exist
      expect(process.env.LANNISTER).not.to.exist

      env("test/mock-env-module")

      expect(process.env.STARK).to.equal("direwolf");
      expect(process.env.BARATHEON).to.equal("stag");
      expect(process.env.LANNISTER).to.equal("lion");
    });

    it('should add process.env vars from a local json file', function() {
      expect(process.env.STARK).not.to.exist
      expect(process.env.BARATHEON).not.to.exist
      expect(process.env.LANNISTER).not.to.exist

      env({file: "test/mock-env-json.json"})

      expect(process.env.STARK).to.equal("direwolf");
      expect(process.env.BARATHEON).to.equal("stag");
      expect(process.env.LANNISTER).to.equal("lion");
    });

    it('should add process.env vars from a local ini file', function() {
      expect(process.env.STARK).not.to.exist
      expect(process.env.BARATHEON).not.to.exist
      expect(process.env.LANNISTER).not.to.exist

      env({file: "test/mock-env-ini.ini"})

      expect(process.env.STARK).to.equal("direwolf");
      expect(process.env.BARATHEON).to.equal("stag");
      expect(process.env.LANNISTER).to.equal("lion");
    });

    it('should treat a file as a different type when given a type', function() {
      expect(process.env.STARK).not.to.exist
      expect(process.env.BARATHEON).not.to.exist
      expect(process.env.LANNISTER).not.to.exist

      env({file: "test/mock-env-json.txt", type: '.json'})

      expect(process.env.STARK).to.equal("direwolf");
      expect(process.env.BARATHEON).to.equal("stag");
      expect(process.env.LANNISTER).to.equal("lion");
    });

    it('should throw if the given type is unsupported', function() {
      expect(function() {
        env({file: "test/mock-env-json.txt", type: '.blarg'})
      }).to.throw();
    });

    it('should add a missing dot to the type if a type is given', function() {
      expect(process.env.STARK).not.to.exist
      expect(process.env.BARATHEON).not.to.exist
      expect(process.env.LANNISTER).not.to.exist

      env({file: "test/mock-env-json.txt", type: 'json'})

      expect(process.env.STARK).to.equal("direwolf");
      expect(process.env.BARATHEON).to.equal("stag");
      expect(process.env.LANNISTER).to.equal("lion");
    });

    it('should throw if the file doesn\'t exist', function() {
      expect(function() {
        env("test/mock-env-blarg")
      }).to.throw();
    });
  });

  describe('reads vars from vars object', function(){
    afterEach(function() {
      delete process.env.NED;
      delete process.env.ROBERT;
      delete process.env.TYWIN;
    });

    it('should add process.env vars from vars object', function() {
      expect(process.env.NED).not.to.exist
      expect(process.env.ROBERT).not.to.exist
      expect(process.env.TYWIN).not.to.exist

      env({vars: {
        NED: true,
        ROBERT: 'fat',
        TYWIN: 9001
      }})

      expect(process.env.NED).to.equal('true');
      expect(process.env.ROBERT).to.equal('fat');
      expect(process.env.TYWIN).to.equal('9001');
    });

    it('should add process.env vars in env.set', function() {
      expect(process.env.NED).not.to.exist
      expect(process.env.ROBERT).not.to.exist
      expect(process.env.TYWIN).not.to.exist

      env.set({
        NED: true,
        ROBERT: 'fat',
        TYWIN: 9001
      });

      expect(process.env.NED).to.equal('true');
      expect(process.env.ROBERT).to.equal('fat');
      expect(process.env.TYWIN).to.equal('9001');
    });
  });

  describe('reads properties from files and vars object', function() {
    beforeEach(prepVars);
    afterEach(prepVars);

    it('should overwrite files with inline-vars by default', function() {
      expect(process.env.STARK).not.to.exist

      env({
        file: "test/mock-env-json.json",
        vars: {
          STARK: "wolfenstein"
        }
      });

      expect(process.env.STARK).to.equal('wolfenstein')
      expect(process.env.BARATHEON).to.equal('stag')
      expect(process.env.LANNISTER).to.equal('lion')
    });
  });

  describe('calls and reads the result of handlers', function() {
    beforeEach(prepVars);
    afterEach(prepVars);

    it('should call the handler with exactly two arguments', function() {
      var called = false;
      var args;

      env({file: "test/mock-env-txt.txt", handler: function() {
        called = true;
        args = [].slice.call(arguments);
      }});

      expect(called).to.be.true
      expect(args).to.have.length(1);
    });

    it('should pass the contents first', function() {
      var expected = fs.readFileSync('test/mock-env-txt.txt', 'utf8');

      env({file: "test/mock-env-txt.txt", handler: function(found) {
        expect(found).to.equal(expected);
      }});
    });

    it('should not be called if the file doesn\'t exist', function() {
      var called = false;

      try {
        env({file: "test/mock-env-blarg", handler: function() {
          called = true
        }});
      } catch (e) {}

      expect(called).to.be.false
    });

    it('should add process.env vars from the result of a handler', function() {
      expect(process.env.STARK).not.to.exist
      expect(process.env.BARATHEON).not.to.exist
      expect(process.env.LANNISTER).not.to.exist

      env({file: "test/mock-env-txt.txt", handler: function() {
        return {
          STARK: "direwolf",
          BARATHEON: "stag",
          LANNISTER: "lion",
        };
      }});

      expect(process.env.STARK).to.equal("direwolf");
      expect(process.env.BARATHEON).to.equal("stag");
      expect(process.env.LANNISTER).to.equal("lion");
    });

    it('should be overwritten by inline-vars', function() {
      env({
        file: "test/mock-env-txt.txt",
        handler: function() {
          return {
            STARK: "foo",
            BARATHEON: "bar",
          };
        },
        vars: {STARK: "bar"}
      });

      expect(process.env.STARK).to.equal("bar");
      expect(process.env.BARATHEON).to.equal("bar");
    });

    it('should return a value that has own property `.restore`', function() {
      expect(env.set({})).to.have.ownProperty('restore');
    });

    it('should return a value with a `.restore` method', function() {
      expect(env.set({}).restore).to.be.a('function');
    });
  });

  describe('`.restore()` on return value', function() {
    beforeEach(prepVars);
    afterEach(prepVars);

    it('should be able to reset', function() {
      var envs = env.set({
        STARK: "direwolf",
        BARATHEON: "stag",
        LANNISTER: "lion",
      });
      expect(process.env.STARK).to.equal("direwolf");
      expect(process.env.BARATHEON).to.equal("stag");
      expect(process.env.LANNISTER).to.equal("lion");
      envs.restore();
      expect(process.env.STARK).to.not.exist;
      expect(process.env.BARATHEON).to.not.exist;
      expect(process.env.LANNISTER).to.not.exist;
    });

    it('should return true if any keys were restored', function() {
      process.env.STARK = "blarg";
      var envs = env.set({
        STARK: "direwolf",
      });
      var result = envs.restore();
      expect(process.env.STARK).to.equal("blarg");
      expect(result).to.be.true;
    });

    it('should return false if no keys were restored', function() {
      var envs = env.set({
        STARK: "direwolf",
      });
      var result = envs.restore();
      expect(process.env.STARK).to.not.exist;
      expect(result).to.be.false;
    });

    it('should not attempt to overwrite manually changed keys', function() {
      var envs = env.set({
        STARK: "direwolf",
        BARATHEON: "stag",
        LANNISTER: "lion",
      });
      expect(process.env.STARK).to.equal("direwolf");
      expect(process.env.BARATHEON).to.equal("stag");
      expect(process.env.LANNISTER).to.equal("lion");
      process.env.STARK = "nope";
      envs.restore();
      expect(process.env.STARK).to.equal("nope");
      expect(process.env.BARATHEON).to.not.exist;
      expect(process.env.LANNISTER).to.not.exist;
    });

    it('should be nestable in scope', function() {
      var envs = env.set({
        STARK: "direwolf",
        BARATHEON: "stag",
        LANNISTER: "lion",
      });

      expect(process.env.STARK).to.equal("direwolf");
      expect(process.env.BARATHEON).to.equal("stag");
      expect(process.env.LANNISTER).to.equal("lion");

      var next = env.set({
        STARK: "spam",
        BARATHEON: "nope",
        LANNISTER: "hello",
      });

      expect(process.env.STARK).to.equal("spam");
      expect(process.env.BARATHEON).to.equal("nope");
      expect(process.env.LANNISTER).to.equal("hello");

      next.restore();

      expect(process.env.STARK).to.equal("direwolf");
      expect(process.env.BARATHEON).to.equal("stag");
      expect(process.env.LANNISTER).to.equal("lion");

      envs.restore();

      expect(process.env.STARK).to.not.exist;
      expect(process.env.BARATHEON).to.not.exist;
      expect(process.env.LANNISTER).to.not.exist;
    });

    it('should not correct out-of-order restores', function() {
      var envs = env.set({
        STARK: "direwolf",
        BARATHEON: "stag",
        LANNISTER: "lion",
      });

      expect(process.env.STARK).to.equal("direwolf");
      expect(process.env.BARATHEON).to.equal("stag");
      expect(process.env.LANNISTER).to.equal("lion");

      var next = env.set({
        STARK: "spam",
        BARATHEON: "nope",
        LANNISTER: "hello",
      });

      expect(process.env.STARK).to.equal("spam");
      expect(process.env.BARATHEON).to.equal("nope");
      expect(process.env.LANNISTER).to.equal("hello");

      envs.restore();

      expect(process.env.STARK).to.equal("spam");
      expect(process.env.BARATHEON).to.equal("nope");
      expect(process.env.LANNISTER).to.equal("hello");
    });

    function testTruthy(item, string) {
      it('should ignore conflicts when passed a truthy argument (' + string +
          ')', function() {
        var envs = env.set({
          STARK: "direwolf",
          BARATHEON: "stag",
          LANNISTER: "lion",
        });
        expect(process.env.STARK).to.equal("direwolf");
        expect(process.env.BARATHEON).to.equal("stag");
        expect(process.env.LANNISTER).to.equal("lion");
        process.env.STARK = "nope";
        envs.restore(true);
        expect(process.env.STARK).to.not.exist;
        expect(process.env.BARATHEON).to.not.exist;
        expect(process.env.LANNISTER).to.not.exist;
      });
    }

    testTruthy(1, '1');
    testTruthy({}, '{}');
    testTruthy([], '[]');
    testTruthy(true, 'true');
  });

  describe('gulp plugin behavior', function() {
    beforeEach(prepVars);
    afterEach(prepVars);

    it('should work as a gulp plugin', function(done) {
      gulp.src('test/mock-env-json.txt')
        .pipe(env({
          vars: {
            STARK: "direwolf",
            BARATHEON: "stag",
            LANNISTER: "lion",
          },
        }))
        .on('end', done)
        .on('data', function() {})
        .on('error', done);
    });

    it('should work as a gulp plugin with `.set`', function(done) {
      gulp.src('test/mock-env-json.txt')
        .pipe(env.set({
          STARK: "direwolf",
          BARATHEON: "stag",
          LANNISTER: "lion",
        }))
        .on('end', done)
        .on('data', function() {})
        .on('error', done);
    });

    it('should return a value that has own property `.reset`', function() {
      expect(env.set({})).to.have.ownProperty('reset');
    });

    it('should return a value with a `.reset` read/write stream', function() {
      var reset = env.set({}).reset;
      expect(reset._read).to.be.a('function');
      expect(reset._write).to.be.a('function');
    });

    it('should be able to reset with `.reset`', function(done) {
      var envs = env.set({
        STARK: "direwolf",
        BARATHEON: "stag",
        LANNISTER: "lion",
      });
      gulp.src('test/mock-env-json.txt')
        .pipe(envs)
        .pipe(through2.obj(function(chunk, enc, callback) {
          // Pass through
          callback(null, chunk)
        }, function(callback) {
          try {
            expect(process.env.STARK).to.equal("direwolf");
            expect(process.env.BARATHEON).to.equal("stag");
            expect(process.env.LANNISTER).to.equal("lion");
          } catch (e) {
            return callback(e);
          }
          return callback();
        }))
        .pipe(envs.reset)
        .pipe(through2.obj(function(chunk, enc, callback) {
          // Pass through
          callback(null, chunk)
        }, function(callback) {
          try {
            expect(process.env.STARK).to.not.exist;
            expect(process.env.BARATHEON).to.not.exist;
            expect(process.env.LANNISTER).to.not.exist;
          } catch (e) {
            return callback(e);
          }
          return callback();
        }))
        .on('end', done)
        .on('data', function() {})
        .on('error', done);
    });

    it('should not resolve conflicting keys', function(done) {
      var envs = env.set({
        STARK: "direwolf",
        BARATHEON: "stag",
        LANNISTER: "lion",
      });
      gulp.src('test/mock-env-json.txt')
        .pipe(envs)
        .pipe(through2.obj(function(chunk, enc, callback) {
          // Pass through
          callback(null, chunk)
        }, function(callback) {
          try {
            expect(process.env.STARK).to.equal("direwolf");
            expect(process.env.BARATHEON).to.equal("stag");
            expect(process.env.LANNISTER).to.equal("lion");
          } catch (e) {
            return callback(e);
          }
          process.env.STARK = "blarg";
          return callback();
        }))
        .pipe(envs.reset)
        .pipe(through2.obj(function(chunk, enc, callback) {
          // Pass through
          callback(null, chunk)
        }, function(callback) {
          try {
            expect(process.env.STARK).to.equal("blarg");
            expect(process.env.BARATHEON).to.not.exist;
            expect(process.env.LANNISTER).to.not.exist;
          } catch (e) {
            return callback(e);
          }
          return callback();
        }))
        .on('end', done)
        .on('data', function() {})
        .on('error', done);
    });

    it('should ignore conflicts when passed as `.force`', function(done) {
      var envs = env.set({
        STARK: "direwolf",
        BARATHEON: "stag",
        LANNISTER: "lion",
      });
      gulp.src('test/mock-env-json.txt')
        .pipe(envs)
        .pipe(through2.obj(function(chunk, enc, callback) {
          // Pass through
          callback(null, chunk)
        }, function(callback) {
          try {
            expect(process.env.STARK).to.equal("direwolf");
            expect(process.env.BARATHEON).to.equal("stag");
            expect(process.env.LANNISTER).to.equal("lion");
          } catch (e) {
            return callback(e);
          }
          process.env.STARK = "blarg";
          return callback();
        }))
        .pipe(envs.reset.force)
        .pipe(through2.obj(function(chunk, enc, callback) {
          // Pass through
          callback(null, chunk)
        }, function(callback) {
          try {
            expect(process.env.STARK).to.not.exist;
            expect(process.env.BARATHEON).to.not.exist;
            expect(process.env.LANNISTER).to.not.exist;
          } catch (e) {
            return callback(e);
          }
          return callback();
        }))
        .on('end', done)
        .on('data', function() {})
        .on('error', done);
    });
  });
});
