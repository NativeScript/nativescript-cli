"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.register = register;

var _kinveySession = require("kinvey-session");

const sessionStore = {
  get(appKey) {
    const session = window.localStorage.getItem(appKey);

    if (session) {
      return JSON.parse(session);
    }

    return null;
  },

  set(appKey, session) {
    window.localStorage.setItem(appKey, JSON.stringify(session));
    return session;
  },

  remove(appKey) {
    window.localStorage.removeItem(appKey);
    return true;
  }

};

function register() {
  (0, _kinveySession.register)(sessionStore);
}