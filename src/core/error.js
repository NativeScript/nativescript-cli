import CoreObject from './object';

class KinveyError extends CoreObject {
  constructor(name = 'Error', msg = '') {
    super();

    this.name = name;
    this.message = msg;
    this.stack = (new Error()).stack;
  }

  static entityNotFound() {
    let error = new KinveyError('EntityNotFound');
    return error;
  }
}

export default Error;
