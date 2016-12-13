import KinveyError from './kinvey';

export default class MobileIdentityConnectError extends KinveyError {
  constructor(message = 'An error has occurred with Mobile Identity Connect.', debug, code) {
    super('MobileIdentityConnectError', message, debug, code);
  }
}
