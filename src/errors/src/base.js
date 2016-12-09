import ExtendableError from 'es6-error';

export default class BaseError extends ExtendableError {
  constructor(name, message = 'An error occurred.', debug = '', code = -1) {
    super();
    this.name = name || this.constructor.name;
    this.message = message;
    this.debug = debug;
    this.code = code;
    this.stack = (new Error(message)).stack;
  }
}
