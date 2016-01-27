import Client from './client';
import Auth from './auth';
import { HttpMethod } from './enums';
import { KinveyError } from './errors';
import NetworkRequest from './requests/networkRequest';
import assign from 'lodash/object/assign';
import isString from 'lodash/lang/isString';
const rpcNamespace = process.env.KINVEY_RPC_NAMESPACE || 'rpc';

/**
 * Executes a custom command.
 *
 * @example
 * var command = new Kinvey.Command('myCustomEndpoint');
 */
export default class Command {
  /**
   * Creates a new instance of the Command class.
   *
   * @param   {string}    endpoint    The endpoint
   *
   * @throws  {KinveyError}   If an endpoint is not provided.
   * @throws  {KinveyError}   If the endpoint provided is not a string.
   */
  constructor(endpoint) {
    if (!endpoint) {
      throw new KinveyError('An endpoint is required.');
    }

    if (!isString(endpoint)) {
      throw new KinveyError('Endpoint must be a string.');
    }

    /**
     * @type {string}
     */
    this.endpoint = endpoint;

    /**
     * @type {Client}
     */
    this.client = Client.sharedInstance();
  }

  /**
   * The pathname for the command.
   *
   * @param   {Client}   [client]     Client
   * @return  {string}                Pathname
   */
  getPathname(client) {
    client = client || this.client;
    return `/${rpcNamespace}/${client.appKey}/custom/${this.endpoint}`;
  }

  /**
   * Execute the custom command. A promise will be returned that will be resolved
   * with the result of the command or rejected with an error.
   *
   * @param  {Object}           [args]                            Command arguments
   * @param  {Object}           [options]                         Options
   * @param   {Client}          [options.client]                  Client to use.
   * @param   {Properties}      [options.properties]              Custom properties to send with
   *                                                              the request.
   * @param   {Number}          [options.timeout]                 Timeout for the request.
   * @return  {Promise}                                           Promise
   */
  execute(args, options = {}) {
    options = assign({
      client: this.client,
      properties: null,
      timeout: undefined,
      handler() {}
    }, options);

    const request = new NetworkRequest({
      method: HttpMethod.POST,
      client: options.client,
      properties: options.properties,
      auth: Auth.default,
      pathname: this.getPathname(options.client),
      data: args,
      timeout: options.timeout
    });
    const promise = request.execute().then(response => {
      if (response.isSuccess()) {
        return response.data;
      }

      throw response.error;
    });
    return promise;
  }
}
