import { KinveyError } from './kinvey';

export class IndirectCollectionAccessDisallowedError extends KinveyError {
  constructor(message = 'Please use the appropriate API to access this collection for this app backend.') {
    super(message);
    this.name = 'IndirectCollectionAccessDisallowedError';
  }
}
