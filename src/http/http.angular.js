// import { Inject } from '@angular/core';
// import { HttpClient } from '@angular/common/http';

// class KinveyAngularHttp {
//   constructor(@Inject(HttpClient) http) {
//     this.http = http;
//   }

//   execute(request) {
//     return this.http
//       .request(request.method, request.url, {
//         headers: request.headers,
//         body: request.body
//       })
//       .toPromise()
//   }
// }

// export default async function http(request) {
//   let response;

//   try {
//     const kinveyAngularHttp = new KinveyAngularHttp();
//     response = await kinveyAngularHttp.execute(request);
//   } catch (error) {
//     if (error.response) {
//       // eslint-disable-next-line prefer-destructuring
//       response = error.response;
//     } else if (error.request) {
//       if (error.code === 'ESOCKETTIMEDOUT' || error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
//         throw new TimeoutError('The network request timed out.');
//       } else if (error.code === 'ENOENT') {
//         throw new NetworkConnectionError('You do not have a network connection.');
//       }

//       throw error;
//     } else {
//       throw error;
//     }
//   }

//   return { statusCode: response.status, headers: response.headers, data: response.data };
// }

import axios from 'axios';
import TimeoutError from '../errors/timeout';
import NetworkConnectionError from '../errors/networkConnection';

export default async function http(request) {
  let response;

  try {
    response = await axios({
      headers: request.headers,
      method: request.method,
      url: request.url,
      data: request.body,
      timeout: request.timeout
    });
  } catch (error) {
    if (error.response) {
      // eslint-disable-next-line prefer-destructuring
      response = error.response;
    } else if (error.request) {
      if (error.code === 'ESOCKETTIMEDOUT' || error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
        throw new TimeoutError('The network request timed out.');
      } else if (error.code === 'ENOENT') {
        throw new NetworkConnectionError('You do not have a network connection.');
      }

      throw error;
    } else {
      throw error;
    }
  }

  return { statusCode: response.status, headers: response.headers, data: response.data };
}
