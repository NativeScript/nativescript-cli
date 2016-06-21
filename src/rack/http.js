import { KinveyMiddleware } from './middleware';

export class HttpMiddleware extends KinveyMiddleware {
  constructor(name = 'Kinvey Http Middleware') {
    super(name);
  }

  async handle() {
    throw new Error('http middleware not installed');
  }
}
