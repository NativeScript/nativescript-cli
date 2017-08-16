import { MockBase } from './mock-base';

export class PubNubListenerMock extends MockBase {
  removeAllListeners() {
    this.setCalledMethod('removeAllListeners');
  }

  on() {
    this.setCalledMethod('on');
  }

  removeListener() {
    this.setCalledMethod('removeListener');
  }

  removeAllListeners() {
    this.setCalledMethod('removeAllListeners');
  }
}
