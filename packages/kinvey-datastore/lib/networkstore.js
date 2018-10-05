"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createRequest = createRequest;
exports.NetworkStore = void 0;

var _kinveyObservable = require("kinvey-observable");

var _kinveyHttp = require("kinvey-http");

const NAMESPACE = 'appdata';

function createRequest(method, url, body) {
  return new _kinveyHttp.KinveyRequest({
    method,
    headers: {
      Authorization: _kinveyHttp.Auth.Session
    },
    url,
    body
  });
}

class NetworkStore {
  constructor(appKey, collectionName) {
    this.appKey = appKey;
    this.collectionName = collectionName;
  }

  get pathname() {
    return `/${NAMESPACE}/${this.appKey}/${this.collectionName}`;
  }

  find(query, rawResponse = false) {
    const stream = _kinveyObservable.KinveyObservable.create(async observer => {
      const url = (0, _kinveyHttp.formatKinveyBaasUrl)(this.pathname, query ? query.toQueryObject() : undefined);
      const request = createRequest(_kinveyHttp.RequestMethod.GET, url);

      try {
        const response = await request.execute();

        if (rawResponse === true) {
          observer.next(response);
        } else {
          observer.next(response.data);
        }

        observer.complete();
      } catch (error) {
        observer.error(error);
      }
    });

    return stream;
  }

  count(query, rawResponse = false) {
    const stream = _kinveyObservable.KinveyObservable.create(async observer => {
      const url = (0, _kinveyHttp.formatKinveyBaasUrl)(`${this.pathname}/_count`, query ? query.toQueryObject() : undefined);
      const request = createRequest(_kinveyHttp.RequestMethod.GET, url);

      try {
        const response = await request.execute();

        if (rawResponse === true) {
          observer.next(response);
        } else {
          observer.next(response.data);
        }

        observer.complete();
      } catch (error) {
        observer.error(error);
      }
    });

    return stream;
  }

  findById(id, rawResponse = false) {
    const stream = _kinveyObservable.KinveyObservable.create(async observer => {
      const url = (0, _kinveyHttp.formatKinveyBaasUrl)(`${this.pathname}/${id}`);
      const request = createRequest(_kinveyHttp.RequestMethod.GET, url);

      try {
        const response = await request.execute();

        if (rawResponse === true) {
          observer.next(response);
        } else {
          observer.next(response.data);
        }

        observer.complete();
      } catch (error) {
        observer.error(error);
      }
    });

    return stream;
  }

  async create(doc, rawResponse = false) {
    const url = (0, _kinveyHttp.formatKinveyBaasUrl)(this.pathname);
    const request = createRequest(_kinveyHttp.RequestMethod.POST, url, doc);
    const response = await request.execute();

    if (rawResponse === true) {
      return response;
    }

    return response.data;
  }

  async update(doc, rawResponse = false) {
    const url = (0, _kinveyHttp.formatKinveyBaasUrl)(`${this.pathname}/${doc._id}`);
    const request = createRequest(_kinveyHttp.RequestMethod.PUT, url, doc);
    const response = await request.execute();

    if (rawResponse === true) {
      return response;
    }

    return response.data;
  }

  save(doc, options) {
    if (doc._id) {
      return this.update(doc, options);
    }

    return this.create(doc, options);
  }

  async remove(query, rawResponse = false) {
    const url = (0, _kinveyHttp.formatKinveyBaasUrl)(this.pathname, query ? query.toQueryObject() : undefined);
    const request = createRequest(_kinveyHttp.RequestMethod.DELETE, url);
    const response = await request.execute();

    if (rawResponse === true) {
      return response;
    }

    return response.data;
  }

  async removeById(id, rawResponse = false) {
    const url = (0, _kinveyHttp.formatKinveyBaasUrl)(`${this.pathname}/${id}`);
    const request = createRequest(_kinveyHttp.RequestMethod.DELETE, url);
    const response = await request.execute();

    if (rawResponse === true) {
      return response;
    }

    return response.data;
  }

}

exports.NetworkStore = NetworkStore;