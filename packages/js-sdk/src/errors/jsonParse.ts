import { KinveyError } from './kinvey';

export class JSONParseError extends KinveyError {
  constructor(message = 'Unable to parse the JSON in the request.', debug?: string) {
    super(message, debug);
    this.name = 'JSONParseError';
  }
}
