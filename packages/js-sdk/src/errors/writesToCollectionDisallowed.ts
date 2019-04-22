import { KinveyError } from './kinvey';

export class WritesToCollectionDisallowedError extends KinveyError {
  constructor(message = 'This collection is configured to disallow any modifications to an existing entity or creation of new entities.', debug?: string) {
    super(message, debug);
    this.name = 'WritesToCollectionDisallowedError';
  }
}
