import KinveyError from './kinvey';

export default class JSONParseError extends KinveyError {
  constructor(message = 'Unable to parse the JSON in the request.', debug, code) {
    super('JSONParseError', message, debug, code);
  }
}
