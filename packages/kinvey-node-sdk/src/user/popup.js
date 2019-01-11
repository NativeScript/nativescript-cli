"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = open;
var Popup = {
  open: function open() {
    throw new Error('NodeJS does not support the opening of popups.');
  }
};

function open(url) {
  return Popup.open(url);
}