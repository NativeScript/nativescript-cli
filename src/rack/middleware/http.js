import Middleware from './middleware';
import Http from 'superagent';
import HttpMethod from '../../core/enums/httpMethod';
import KinveyError from '../../core/errors';
import Promise from 'bluebird';

export default class HttpMiddleware extends Middleware {
  constructor() {
    super('Kinvey Http Middleware');
  }

  handle(req) {
    return new Promise((resolve, reject) => {
      const method = req.method;
      const path = req.path;
      const data = req.data;
      let httpRequest;

      // Create the http request
      switch (method) {
      case HttpMethod.GET:
        httpRequest = Http.get(path);
        break;
      case HttpMethod.POST:
        httpRequest = Http.post(path).send(data);
        break;
      case HttpMethod.PUT:
        httpRequest = Http.put(path).send(data);
        break;
      case HttpMethod.DELETE:
        httpRequest = Http.del(path);
        break;
      default:
        return rejct(new KinveyError('Invalid Http Method. GET, POST, PUT, and DELETE are allowed.'));
      }

      // Add other request info
      httpRequest.set(req.headers);
      httpRequest.query(req.query);
      httpRequest.query(req.flags);
      httpRequest.timeout(req.timeout);

      // Send the request
      httpRequest.end((err, res) => {
        if (err) {
          return reject(err);
        }

        console.log(res);
        req.response = res;
        resolve(req);
      });
    });
  }
}
