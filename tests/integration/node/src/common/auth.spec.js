"use strict";

require("core-js/modules/es.object.to-string");

require("core-js/modules/es.promise");

require("regenerator-runtime/runtime");

var _chai = require("chai");

var _SDK__ = require("kinvey-node-sdk");

var _utils = require("../utils");

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

before(function () {
  return (0, _SDK__.init)({
    appKey: process.env.APP_KEY,
    appSecret: process.env.APP_SECRET,
    masterSecret: process.env.MASTER_SECRET
  });
});
describe('Auth', function () {
  describe('login()', function () {
    it('should login',
    /*#__PURE__*/
    _asyncToGenerator(
    /*#__PURE__*/
    regeneratorRuntime.mark(function _callee() {
      var username, password, user;
      return regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              username = (0, _utils.randomString)();
              password = (0, _utils.randomString)();
              _context.next = 4;
              return _SDK__.User.signup({
                username: username,
                password: password
              }, {
                state: false
              });

            case 4:
              _context.next = 6;
              return _SDK__.User.login(username, password);

            case 6:
              user = _context.sent;
              (0, _chai.expect)(user.username).to.equal(username);
              _context.next = 10;
              return _SDK__.User.remove(user._id, {
                hard: true
              });

            case 10:
            case "end":
              return _context.stop();
          }
        }
      }, _callee);
    })));
    it('should login by providing credentials as an object',
    /*#__PURE__*/
    _asyncToGenerator(
    /*#__PURE__*/
    regeneratorRuntime.mark(function _callee2() {
      var username, password, user;
      return regeneratorRuntime.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              username = (0, _utils.randomString)();
              password = (0, _utils.randomString)();
              _context2.next = 4;
              return _SDK__.User.signup({
                username: username,
                password: password
              }, {
                state: false
              });

            case 4:
              _context2.next = 6;
              return _SDK__.User.login({
                username: username,
                password: password
              });

            case 6:
              user = _context2.sent;
              (0, _chai.expect)(user.username).to.equal(username);
              _context2.next = 10;
              return _SDK__.User.remove(user._id, {
                hard: true
              });

            case 10:
            case "end":
              return _context2.stop();
          }
        }
      }, _callee2);
    })));
  });
  describe('logout()', function () {
    it('should logout',
    /*#__PURE__*/
    _asyncToGenerator(
    /*#__PURE__*/
    regeneratorRuntime.mark(function _callee3() {
      var username, password, user;
      return regeneratorRuntime.wrap(function _callee3$(_context3) {
        while (1) {
          switch (_context3.prev = _context3.next) {
            case 0:
              username = (0, _utils.randomString)();
              password = (0, _utils.randomString)();
              _context3.next = 4;
              return _SDK__.User.signup({
                username: username,
                password: password
              });

            case 4:
              user = _context3.sent;
              _context3.next = 7;
              return _SDK__.User.logout();

            case 7:
              (0, _chai.expect)(_SDK__.User.getActiveUser()).to.be["null"];
              _context3.next = 10;
              return _SDK__.User.login({
                username: username,
                password: password
              });

            case 10:
              _context3.next = 12;
              return _SDK__.User.remove(user._id, {
                hard: true
              });

            case 12:
            case "end":
              return _context3.stop();
          }
        }
      }, _callee3);
    })));
    it('should logout when there is not an active user',
    /*#__PURE__*/
    _asyncToGenerator(
    /*#__PURE__*/
    regeneratorRuntime.mark(function _callee4() {
      return regeneratorRuntime.wrap(function _callee4$(_context4) {
        while (1) {
          switch (_context4.prev = _context4.next) {
            case 0:
              (0, _chai.expect)(_SDK__.User.getActiveUser()).to.be["null"];
              _context4.next = 3;
              return _SDK__.User.logout();

            case 3:
              (0, _chai.expect)(_SDK__.User.getActiveUser()).to.be["null"];

            case 4:
            case "end":
              return _context4.stop();
          }
        }
      }, _callee4);
    })));
  });
  describe('signup()', function () {
    it('should signup and set the user as the active user',
    /*#__PURE__*/
    _asyncToGenerator(
    /*#__PURE__*/
    regeneratorRuntime.mark(function _callee5() {
      var username, password, user;
      return regeneratorRuntime.wrap(function _callee5$(_context5) {
        while (1) {
          switch (_context5.prev = _context5.next) {
            case 0:
              username = (0, _utils.randomString)();
              password = (0, _utils.randomString)();
              _context5.next = 4;
              return _SDK__.User.signup({
                username: username,
                password: password
              });

            case 4:
              user = _context5.sent;
              (0, _chai.expect)(_SDK__.User.getActiveUser()).to.deep.equal(user);
              _context5.next = 8;
              return _SDK__.User.remove(user._id, {
                hard: true
              });

            case 8:
            case "end":
              return _context5.stop();
          }
        }
      }, _callee5);
    })));
    it('should signup with additional properties',
    /*#__PURE__*/
    _asyncToGenerator(
    /*#__PURE__*/
    regeneratorRuntime.mark(function _callee6() {
      var username, password, name, user;
      return regeneratorRuntime.wrap(function _callee6$(_context6) {
        while (1) {
          switch (_context6.prev = _context6.next) {
            case 0:
              username = (0, _utils.randomString)();
              password = (0, _utils.randomString)();
              name = (0, _utils.randomString)();
              _context6.next = 5;
              return _SDK__.User.signup({
                username: username,
                password: password,
                name: name
              });

            case 5:
              user = _context6.sent;
              (0, _chai.expect)(user.data).to.have.property('name', name);
              _context6.next = 9;
              return _SDK__.User.remove(user._id, {
                hard: true
              });

            case 9:
            case "end":
              return _context6.stop();
          }
        }
      }, _callee6);
    })));
    it('should signup and not set the user as the active user if options.state is false',
    /*#__PURE__*/
    _asyncToGenerator(
    /*#__PURE__*/
    regeneratorRuntime.mark(function _callee7() {
      var username, password, user;
      return regeneratorRuntime.wrap(function _callee7$(_context7) {
        while (1) {
          switch (_context7.prev = _context7.next) {
            case 0:
              username = (0, _utils.randomString)();
              password = (0, _utils.randomString)();
              _context7.next = 4;
              return _SDK__.User.signup({
                username: username,
                password: password
              }, {
                state: false
              });

            case 4:
              user = _context7.sent;
              (0, _chai.expect)(_SDK__.User.getActiveUser()).to.be["null"];
              _context7.next = 8;
              return _SDK__.User.login({
                username: username,
                password: password
              });

            case 8:
              _context7.next = 10;
              return _SDK__.User.remove(user._id, {
                hard: true
              });

            case 10:
            case "end":
              return _context7.stop();
          }
        }
      }, _callee7);
    })));
    it('should signup and not set the user as the active user if options.state is false',
    /*#__PURE__*/
    _asyncToGenerator(
    /*#__PURE__*/
    regeneratorRuntime.mark(function _callee8() {
      var user;
      return regeneratorRuntime.wrap(function _callee8$(_context8) {
        while (1) {
          switch (_context8.prev = _context8.next) {
            case 0:
              _context8.next = 2;
              return _SDK__.User.signup();

            case 2:
              user = _context8.sent;
              (0, _chai.expect)(_SDK__.User.getActiveUser()).to.deep.equal(user);
              _context8.next = 6;
              return _SDK__.User.remove(user._id, {
                hard: true
              });

            case 6:
            case "end":
              return _context8.stop();
          }
        }
      }, _callee8);
    })));
  });
});