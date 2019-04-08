// export default class BaseError extends Error {
//   constructor(message = 'An error occurred.', debug?: string, code?: number, kinveyRequestId?: string, ...args) {
//     // Pass remaining arguments (including vendor specific ones) to parent constructor
//     super(...args);

//     // Maintains proper stack trace for where our error was thrown (only available on V8)
//     if (Error.captureStackTrace) {
//       Error.captureStackTrace(this, BaseError);
//     }

//     // Custom debugging information
//     this.name = 'BaseError';
//     this.message = message;
//     this.debug = debug;
//     this.code = code;
//     this.kinveyRequestId = kinveyRequestId;
//   }
// }

export class BaseError extends Error {
  constructor(message = 'An error occurred.') {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = 'BaseError';
  }
}
