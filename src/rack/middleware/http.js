import { KinveyMiddleware } from '../middleware';

export class HttpMiddleware extends KinveyMiddleware {
  constructor(name = 'Kinvey Http Middleware') {
    super(name);
  }

  handle(request) {
    return super.handle(request).then(() => {
      const promise = new Promise((resolve, reject) => {
        reject(new Error('http middleware not installed'));
      });
      return promise;
    });
  }
}
