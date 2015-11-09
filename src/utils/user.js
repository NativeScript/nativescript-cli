const Client = require('../core/client');
const Request = require('../core/request').Request;
const DataPolicy = require('../core/enums/dataPolicy');
const HttpMethod = require('../core/enums/httpMethod');
const result = require('lodash/object/result');
const appdataNamespace = process.env.KINVEY_DATASTORE_NAMESPACE || 'appdata';
const activeUserCollection = 'activeUser';

function getActiveUser(client = Client.sharedInstance()) {
  const request = new Request({
    method: HttpMethod.GET,
    path: `/${appdataNamespace}/${client.appId}/${activeUserCollection}`,
    client: client,
    dataPolicy: DataPolicy.LocalOnly
  });

  const promise = request.execute().then(response => {
    const data = response.data;

    if (data.length === 0) {
      return null;
    }

    return data[0];
  });

  return promise;
}

function setActiveUser(user, client = Client.sharedInstance()) {
  const promise = getActiveUser().then(activeUser => {
    if (activeUser) {
      const request = new Request({
        method: HttpMethod.DELETE,
        path: `/${appdataNamespace}/${client.appId}/${activeUserCollection}/${activeUser._id}`,
        client: client,
        dataPolicy: DataPolicy.LocalOnly
      });
      return request.execute();
    }
  }).then(() => {
    if (user) {
      const request = new Request({
        method: HttpMethod.POST,
        path: `/${appdataNamespace}/${client.appId}/${activeUserCollection}`,
        client: client,
        dataPolicy: DataPolicy.LocalOnly,
        data: result(user, 'toJSON', user)
      });
      return request.execute();
    }
  });

  return promise;
}

module.exports = {
  getActiveUser: getActiveUser,
  setActiveUser: setActiveUser
};
