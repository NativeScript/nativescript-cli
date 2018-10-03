"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.use = use;
exports.open = open;

/**
 * @private
 */
let popup = {
  open() {
    throw new Error('You must override the default popup.');
  }

};
/**
 * @private
 */

function use(customPopup) {
  popup = customPopup;
}

function open(url) {
  return popup.open(url);
}