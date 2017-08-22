import Client from '../../../client';
import { getLiveService } from './live-service';

function _getLiveService() {
  const client = Client.sharedInstance();
  return getLiveService(client);
}

function onConnectionStatusUpdates(func) {
  _getLiveService().onConnectionStatusUpdates(func);
}

function offConnectionStatusUpdates(func) {
  _getLiveService().offConnectionStatusUpdates(func);
}

function unsubscribeFromAll() {
  _getLiveService().unsubscribeFromAll();
}

function isInitialized() {
  return _getLiveService().isInitialized();
}

export const LiveServiceFacade = {
  onConnectionStatusUpdates,
  offConnectionStatusUpdates,
  unsubscribeFromAll,
  isInitialized
};
