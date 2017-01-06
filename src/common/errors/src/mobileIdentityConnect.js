import BaseError from './base';

export default class MobileIdentityConnectError extends BaseError {
  constructor(message = 'An error has occurred with Mobile Identity Connect.', debug, code) {
    super('MobileIdentityConnectError', message, debug, code);
  }
}
