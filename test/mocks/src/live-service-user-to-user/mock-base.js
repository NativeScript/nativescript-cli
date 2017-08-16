import { randomString } from 'src/utils';

export class MockBase {
  static calledMethods = new Map();

  static resetCalledMethods() {
    MockBase.calledMethods = new Map();
  }

  static methodWasCalled(mockId, methodName) {
    return !!MockBase.calledMethods[mockId] && !!MockBase.calledMethods[mockId][methodName];
  }

  mockId;

  constructor(mockId) {
    this.mockId = mockId || randomString();
  }

  setCalledMethod(methodName) {
    const dict = MockBase.calledMethods[this.mockId];
    if (!MockBase.calledMethods[this.mockId]) {
      MockBase.calledMethods[this.mockId] = {};
    }
    MockBase.calledMethods[this.mockId][methodName] = true;
  }
}
