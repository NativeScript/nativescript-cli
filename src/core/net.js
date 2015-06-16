import CoreObject from './object';
import Request from './request';
import HttpMethod from '../enums/httpMethod';

class Net extends CoreObject {
  static read(requestObj, options = {}) {
    let path = `/${requestObj.namespace}/${requestObj.appKey}/${requestObj.collection}`;
    let request = new Request(HttpMethod.GET, path, requestObj.query, requestObj.data);

    // Execute the request
    return request.execute(requestObj.auth, options);
  }
}

export default Net;
