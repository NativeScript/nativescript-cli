import Client from './client';
import { RequestMethod, AuthType } from './requests/request';
import { KinveyError } from './errors';
import { NetworkRequest } from './requests/network';
import url from 'url';
import assign from 'lodash/assign';
import isString from 'lodash/isString';
const rpcNamespace = process.env.KINVEY_RPC_NAMESPACE || 'rpc';

/**
 * Executes a custom command.
 */
export default class CustomEndpoint {
  /**
   * Execute a custom endpoint. A promise will be returned that will be resolved
   * with the result of the command or rejected with an error.
   *
   * @param   {String}          endpoint                          Endpoint to execute.
   * @param   {Object}          [args]                            Command arguments
   * @param   {Object}          [options={}]                      Options
   * @param   {Properties}      [options.properties]              Custom properties to send with
   *                                                              the request.
   * @param   {Number}          [options.timeout]                 Timeout for the request.
   * @return  {Promise}                                           Promise
   *
   * @example
   * var promise = CustomEndpoint.execute('myCustomEndpoint').then(function(data) {
   *   ...
   * }).catch(function(error) {
   *   ...
   * });
   */
  static async execute(endpoint, args, options = {}) {
    options = assign({
      client: Client.sharedInstance()
    }, options);

    if (!endpoint) {
      throw new KinveyError('An endpoint is required.');
    }

    if (!isString(endpoint)) {
      throw new KinveyError('The endpoint must be a string.');
    }

    const request = new NetworkRequest({
      method: RequestMethod.POST,
      authType: AuthType.Default,
      url: url.format({
        protocol: options.client.protocol,
        host: options.client.host,
        pathname: `/${rpcNamespace}/${options.client.appKey}/custom/${endpoint}`
      }),
      properties: options.properties,
      body: args,
      timeout: options.timeout,
      client: options.client
    });
    const response = await request.execute();
    return response.data;
  }
}
