const Promise = require('es6-promise');
const isString = require('lodash/isString');
const url = require('url');
const { KinveyError } = require('kinvey-errors');
const { Client } = require('kinvey-client');
const { RequestMethod, AuthType, KinveyRequest } = require('kinvey-request');

/**
 * Executes a custom endpoint on the Kinvey backend.
 */
exports.CustomEndpoint = class CustomEndpoint {
  constructor() {
    throw new KinveyError('Not allowed to create an instance of the `CustomEndpoint` class.',
      'Please use `CustomEndpoint.execute()` function.');
  }
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
  static execute(endpoint, args, options = {}) {
    const client = options.client || Client.sharedInstance();

    if (!endpoint) {
      return Promise.reject(new KinveyError('An endpoint argument is required.'));
    }

    if (!isString(endpoint)) {
      return Promise.reject(new KinveyError('The endpoint argument must be a string.'));
    }

    const request = new KinveyRequest({
      method: RequestMethod.POST,
      authType: AuthType.Default,
      url: url.format({
        protocol: client.apiProtocol,
        host: client.apiHost,
        pathname: `/rpc/${client.appKey}/custom/${endpoint}`
      }),
      properties: options.properties,
      body: args,
      timeout: options.timeout,
      client: client
    });
    return request.execute().then(response => response.data);
  }
}
