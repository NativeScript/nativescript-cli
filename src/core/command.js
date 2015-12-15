const Client = require('./client');
const Auth = require('./auth');
const DataPolicy = require('./enums').DataPolicy;
const HttpMethod = require('./enums').HttpMethod;
const Request = require('./request').Request;
const assign = require('lodash/object/assign');
const rpcNamespace = process.env.KINVEY_RPC_NAMESPACE || 'rpc';

class Command {
  constructor(id, options = {}) {
    options = assign({
      auth: Auth.default,
      client: Client.sharedInstance()
    }, options);

    this.id = id;
    this.auth = options.auth;
    this.client = options.client;
  }

  getPathname(client) {
    client = client || this.client;
    return `/${rpcNamespace}/${client.appId}/custom/${this.id}`;
  }

  execute(args, options = {}) {
    options = assign({
      auth: this.auth,
      client: this.client
    }, options);

    const request = new Request({
      dataPolicy: DataPolicy.ForceNetwork,
      auth: options.auth,
      client: options.client,
      method: HttpMethod.POST,
      pathname: this.getPathname(options.client),
      data: args
    });
    const promise = request.execute();
    return promise;
  }
}

module.exports = Command;
