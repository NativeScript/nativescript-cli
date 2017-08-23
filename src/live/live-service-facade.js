import Client from '../client';
import { Stream } from './user-to-user';
import { getLiveService } from './live-service';

function _getLiveService() {
  const client = Client.sharedInstance();
  return getLiveService(client);
}

/**
 * Attaches a handler for connection status updates
 * @param {function} func
 */
function onConnectionStatusUpdates(func) {
  _getLiveService().onConnectionStatusUpdates(func);
}

/**
 * Removes a handler for connection status updates.
 * If no handler is specified, removes all handlers
 * @param {function} [func]
 */
function offConnectionStatusUpdates(func) {
  _getLiveService().offConnectionStatusUpdates(func);
}

/**
 * Unsubscribes from all channels and channel groups
 */
function unsubscribeFromAll() {
  _getLiveService().unsubscribeFromAll();
}

/**
 * Checks whether live service is ready to subscribe or publish messages
 */
function isInitialized() {
  return _getLiveService().isInitialized();
}

export const LiveServiceFacade = {
  Stream,
  onConnectionStatusUpdates,
  offConnectionStatusUpdates,
  unsubscribeFromAll,
  isInitialized
};
