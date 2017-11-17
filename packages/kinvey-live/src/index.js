const { LiveCollectionManager, getLiveCollectionManager } = require('./collection');
const { Stream, StreamACL } = require('./user-to-user');
const { isValidReceiver, isValidChannelName, getLiveService } = require('./live-service');
const { PubNubListener } = require('./pubnub-listener');
const { isInitialized, onConnectionStatusUpdates, offConnectionStatusUpdates } = require('./live-service-facade');

module.exports = {
  LiveCollectionManager: LiveCollectionManager,
  getLiveCollectionManager: getLiveCollectionManager,
  Stream: Stream,
  StreamACL: StreamACL,
  isValidReceiver: isValidReceiver,
  isValidChannelName: isValidChannelName,
  getLiveService: getLiveService,
  PubNubListener: PubNubListener,
  isInitialized: isInitialized,
  onConnectionStatusUpdates: onConnectionStatusUpdates,
  offConnectionStatusUpdates: offConnectionStatusUpdates
};
