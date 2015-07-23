class KinveyError extends Error {
  constructor(msg = '') {
    super(msg);
    Error.captureStackTrace(this, this.constructor);
  }
}

export default KinveyError;
