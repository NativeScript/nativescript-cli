import CoreObject from './object';
<<<<<<< Updated upstream
import {isDefined} from './utils';
=======
import {isDefined} from '../utils';
>>>>>>> Stashed changes
import Query from './query';
import Request from './request';
import log from 'loglevel';
import HttpMethod from '../enums/httpMethod';
import AuthType from '../enums/authType';
import Kinvey from '../kinvey';
<<<<<<< Updated upstream
=======

>>>>>>> Stashed changes
// import isArray from 'lodash/lang/isArray';
// const objectIdPrefix = 'local_';

// function generateObjectId(prefix = '', length = 24) {
//   let chars = 'abcdef0123456789';
//   let objectId = '';

//   for (let i = 0, j = chars.length; i < length; i++) {
//     let pos = Math.floor(Math.random() * j);
//     objectId = objectId + chars.substring(pos, pos + 1);
//   }

//   return `${prefix}${objectId}`;
// }

class DataStore extends CoreObject {

  static find(collection, query, options = {}) {
<<<<<<< Updated upstream
    let kinvey = Kinvey.instance();

=======
>>>>>>> Stashed changes
    // Validate arguments
    if (isDefined(query) && !(query instanceof Query)) {
      return Promise.reject('query argument must be of type: Kinvey.Query.');
    }

    // Debug
    log.info('Retrieving documents by query.', arguments);

    // Create a request
<<<<<<< Updated upstream
    let request = new Request(HttpMethod.GET, `/appdata/${kinvey.appKey}/${collection}`, query);
=======
    const request = new Request(HttpMethod.GET, `/appdata/${Kinvey.appKey}/${collection}`, query);
>>>>>>> Stashed changes

    // Set the auth type
    request.authType = AuthType.Default;

    // Set the data policy
    if (isDefined(options.dataPolicy)) {
      request.dataPolicy = options.dataPolicy;
    }

    // Execute the request
<<<<<<< Updated upstream
    let promise = request.execute(options).then((response) => {
=======
    const promise = request.execute(options).then((response) => {
>>>>>>> Stashed changes
      // Return the data
      return response.data;
    });

    // Debug
    promise.then((docs) => {
      log.info('Retrieved the documents by query.', docs);
    }).catch((err) => {
      log.error('Failed to retrieve the documents by query.', err);
    });

    // Return the promise
    return promise;
  }
}

export default DataStore;
