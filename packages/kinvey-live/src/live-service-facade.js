const { Client } = require('kinvey-client');
const { Stream } = require('./user-to-user');
const { getLiveService } = require('./live-service');

function _getLiveService() {
  const client = Client.sharedInstance();
  return getLiveService(client);
}

/**
 * Attaches a handler for connection status updates
 * @param {function} func
 */
exports.onConnectionStatusUpdates = function onConnectionStatusUpdates(func) {
  _getLiveService().onConnectionStatusUpdates(func);
}

/**
 * Removes a handler for connection status updates.
 * If no handler is specified, removes all handlers
 * @param {function} [func]
 */
exports.offConnectionStatusUpdates = function offConnectionStatusUpdates(func) {
  _getLiveService().offConnectionStatusUpdates(func);
}

/**
 * Checks whether live service is ready to subscribe or publish messages
 */
exports.isInitialized = function isInitialized() {
  return _getLiveService().isInitialized();
}

exports.Stream = Stream;
