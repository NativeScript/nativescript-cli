import CoreObject from './object';

class Error extends CoreObject {
  constructor(name = 'Error', msg = '') {
    super();

    this.name = name;
    this.message = msg;
    this.stack = (new Error()).stack;
  }

  static entityNotFound() {
    const error = new Error('EntityNotFound');
    return error;
  }
}

export default Error;
