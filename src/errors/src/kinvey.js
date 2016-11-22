export default class KinveyError {
  constructor(name, message = 'An error occurred.', debug = '', code = -1) {
    const error = Error.call(this, message);
    this.name = name || this.constructor.name;
    this.message = error.message;
    this.stack = error.stack;
    this.debug = debug;
    this.code = code;
  }
}
