import { Client } from '../client';
import { getLiveService } from './live-service';

function _getLiveService() {
  const client = Client.sharedInstance();
  return getLiveService(client);
}

/**
 * Attaches a handler for connection status updates
 * @param {function} func
 */
export function onConnectionStatusUpdates(func) {
  _getLiveService().onConnectionStatusUpdates(func);
}

/**
 * Removes a handler for connection status updates.
 * If no handler is specified, removes all handlers
 * @param {function} [func]
 */
export function offConnectionStatusUpdates(func) {
  _getLiveService().offConnectionStatusUpdates(func);
}

/**
 * Checks whether live service is ready to subscribe or publish messages
 */
export function isInitialized() {
  return _getLiveService().isInitialized();
}
