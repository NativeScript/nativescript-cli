import expect from 'expect';

import { PubNubListener } from '../../../src/live';

describe('PubNubListener', function () {
  /** @type {PubNubListener} */
  let listener;
  const channelName = 'someChannel';
  // operations are synchronous, so no need to wait for 2s
  this.timeout(500);

  beforeEach(() => {
    listener = new PubNubListener();
  });

  describe('message', () => {
    it('should emit a message event based on the message\'s channel', (done) => {
      const mockMessage = { channel: channelName, message: { test: 1 } };
      listener.on(channelName, (m) => {
        expect(m).toBe(mockMessage.message);
        done();
      });
      listener.message(mockMessage);
    });
  });

  describe('status', () => {
    it('should emit a status event based on the status\'s channel', (done) => {
      const mockStatus = { affectedChannels: [channelName], category: 'test' };
      listener.on(`${PubNubListener.statusPrefix}${channelName}`, (status) => {
        expect(status).toBe(mockStatus);
        done();
      });
      listener.status(mockStatus);
    });

    it('should emit a status event based on the status\'s channel group', (done) => {
      const mockStatus = { affectedChannelGroups: [channelName], category: 'test' };
      listener.on(`${PubNubListener.statusPrefix}${channelName}`, (status) => {
        expect(status).toBe(mockStatus);
        done();
      });
      listener.status(mockStatus);
    });
  });

  describe('unclassified events', () => {
    it('should be emitted when status message does not affect any channels or channel groups', (done) => {
      const mockStatus = { category: 'test' };
      listener.on(PubNubListener.unclassifiedEvents, (status) => {
        expect(status).toBe(mockStatus);
        done();
      });
      listener.status(mockStatus);
    });
  });
});
