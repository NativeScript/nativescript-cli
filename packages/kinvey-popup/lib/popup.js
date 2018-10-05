"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.register = register;
exports.open = open;
let popup = {
  open() {
    throw new Error('You must override the default popup.');
  }

};

function register(customPopup) {
  if (customPopup) {
    popup = customPopup;
  }
}

function open(url) {
  return popup.open(url);
}