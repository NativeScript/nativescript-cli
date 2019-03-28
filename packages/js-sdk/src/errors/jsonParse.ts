import { KinveyError } from './kinvey';

export class JSONParseError extends KinveyError {
  constructor(message = 'Unable to parse the JSON in the request.') {
    super(message);
    this.name = 'JSONParseError';
  }
}
