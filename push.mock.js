import { Push } from './push';

class PushMock extends Push {
  isSupported() {
    return true;
  }
}

// Export
export { PushMock };
export default new PushMock();
