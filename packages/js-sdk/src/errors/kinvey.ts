export class KinveyError extends Error {
  constructor(message = 'An error occurred.') {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = 'KinveyError';
  }
}
