import Client from './client';
import Auth from './auth';
import { HttpMethod } from './enums';
import Request from './requests/networkRequest';
import assign from 'lodash/object/assign';
const rpcNamespace = process.env.KINVEY_RPC_NAMESPACE || 'rpc';

export default class Command {
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
