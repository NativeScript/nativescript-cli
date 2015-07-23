class KinveyError extends Error {
  constructor(message = 'An error occurred.', debug = '') {
    super();
    Error.captureStackTrace(this, this.constructor);
    this.name = this.constructor.name;
    this.message = message;
    this.debug = debug;
  }
}

export default KinveyError;
