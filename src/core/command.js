const Client = require('./client');
const Auth = require('./auth');
const DataPolicy = require('./enums').DataPolicy;
const HttpMethod = require('./enums').HttpMethod;
const Request = require('../request').Request;
const assign = require('lodash/object/assign');
const rpcNamespace = process.env.KINVEY_RPC_NAMESPACE || 'rpc';

class Command {
  execute(id, args, options = {}) {
    options = assign({
      auth: Auth.default,
      client: Client.sharedInstance()
    }, options);

    const request = new Request({
      dataPolicy: DataPolicy.ForceNetwork,
      auth: options.auth,
      client: options.client,
      method: HttpMethod.POST,
      pathname: `/${rpcNamespace}/${options.client.appId}/custom/${id}`,
      data: args
    });
    const promise = request.execute();
    return promise;
  }
}

module.exports = Command;
