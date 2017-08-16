import { MockBase } from './mock-base';

export class PubNubClientMock extends MockBase {
  config;
  subObj;
  listeners = [];

  constructor(config, mockId) {
    super(mockId);
    this.config = config;
  }

  addListener(listener) {
    this.setCalledMethod('addListener');
    this.listeners.push(listener);
  }

  subscribe(subObj) {
    this.setCalledMethod('subscribe');
    this.subObj = subObj;
  }

  unsubscribeAll() {
    this.setCalledMethod('unsubscribeAll');
  }
}
