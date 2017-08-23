import expect from 'expect';
import PubNub from 'pubnub';

import Kinvey from '../../src';
import { PubNubListener } from '../../src/live';

import { mockRequiresIn } from '../mocks';

const liveServiceMock = {
  registerUser: () => { },
  initialize: () => { },
  uninitialize: () => { },
  unregisterUser: () => { },
  onConnectionStatusUpdates: () => { },
  offConnectionStatusUpdates: () => { },
  unsubscribeFromAll: () => { },
  isInitialized: () => { }
};

const pathToFacade = '../../src/live/live-service-facade';
const requireMocks = { './live-service': { getLiveService: () => liveServiceMock } };

describe('LiveServiceFacade', () => {
  let LiveServiceFacade;

  beforeEach(() => {
    // avoid LiveService singleton state
    LiveServiceFacade = mockRequiresIn(__dirname, pathToFacade, requireMocks, 'LiveServiceFacade');
  });

  afterEach(() => {
    expect.restoreSpies();
  });

  it('should have only user-facing LiveService methods', () => {
    const expectedMethods = [
      'Stream',
      'onConnectionStatusUpdates',
      'offConnectionStatusUpdates',
      'unsubscribeFromAll',
      'isInitialized'
    ];
    expect(LiveServiceFacade).toContainKeys(expectedMethods);
    expect(Object.keys(LiveServiceFacade).length).toBe(expectedMethods.length);
  });

  describe('onConnectionStatusUpdates', () => {
    it('should call LiveService\'s onConnectionStatusUpdates() method with the passed function', () => {
      const spy = expect.spyOn(liveServiceMock, 'onConnectionStatusUpdates');
      const handler = () => { };
      LiveServiceFacade.onConnectionStatusUpdates(handler);
      expect(spy).toHaveBeenCalledWith(handler);
    });
  });

  describe('offConnectionStatusUpdates', () => {
    it('should call LiveService\'s offConnectionStatusUpdates() method with the passed function', () => {
      const spy = expect.spyOn(liveServiceMock, 'offConnectionStatusUpdates');
      const handler = () => { };
      LiveServiceFacade.offConnectionStatusUpdates(handler);
      expect(spy).toHaveBeenCalledWith(handler);
    });
  });

  describe('unsubscribeFromAll', () => {
    it('should call LiveService\'s unsubscribeFromAll() method', () => {
      const spy = expect.spyOn(liveServiceMock, 'unsubscribeFromAll');
      LiveServiceFacade.unsubscribeFromAll();
      expect(spy).toHaveBeenCalled();
      expect(spy.calls.length).toBe(1);
      expect(spy.calls[0].arguments.length).toBe(0);
    });
  });

  describe('isInitialized', () => {
    it('should call LiveService\'s isInitialized() method', () => {
      const spy = expect.spyOn(liveServiceMock, 'isInitialized');
      LiveServiceFacade.isInitialized();
      expect(spy).toHaveBeenCalled();
      expect(spy.calls.length).toBe(1);
      expect(spy.calls[0].arguments.length).toBe(0);
    });
  });
});
