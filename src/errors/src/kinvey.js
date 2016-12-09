import BaseError from './base';

export default class KinveyError extends BaseError {
  constructor(message, debug, code) {
    super('KinveyError', message, debug, code);
  }
}
