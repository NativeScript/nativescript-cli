export class PubNubClientMock {
  config;

  constructor(config) {
    this.config = config;
  }

  addListener() { }

  subscribe() { }

  publish() { }

  unsubscribeAll() { }
}
