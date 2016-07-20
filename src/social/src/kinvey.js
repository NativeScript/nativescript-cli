import { Social, SocialIdentity } from './social';
import { KinveyError } from '../../errors';
import { NetworkRequest } from '../../requests/network';
import { AuthType, RequestMethod, KinveyRequestConfig } from '../../requests/request';
import regeneratorRuntime from 'regenerator-runtime'; // eslint-disable-line no-unused-vars
import url from 'url';
import isObject from 'lodash/isObject';
const usersNamespace = process.env.KINVEY_USERS_NAMESPACE || 'user';
const socialIdentityAttribute = process.env.KINVEY_SOCIAL_IDENTITY_ATTRIBUTE || '_socialIdentity';

export class Kinvey extends Social {
  static get identity() {
    return SocialIdentity.Kinvey;
  }

  isSupported() {
    return true;
  }

  async login(credentials, password, options = {}) {
    if (!isObject(credentials)) {
      credentials = {
        username: credentials,
        password: password
      };
    }

    if (!credentials[socialIdentityAttribute]) {
      if (credentials.username) {
        credentials.username = String(credentials.username).trim();
      }

      if (credentials.password) {
        credentials.password = String(credentials.password).trim();
      }
    }

    if ((!credentials.username || credentials.username === '' || !credentials.password || credentials.password === '')
      && !credentials[socialIdentityAttribute]) {
      return Promise.reject(new KinveyError('Username and/or password missing. ' +
        'Please provide both a username and password to login.'));
    }

    const config = new KinveyRequestConfig({
      method: RequestMethod.POST,
      authType: AuthType.App,
      url: url.format({
        protocol: this.client.apiProtocol,
        host: this.client.apiHost,
        pathname: `/${usersNamespace}/${this.client.appKey}`
      }),
      body: credentials,
      properties: options.properties,
      timeout: options.timeout,
      client: this.client
    });
    const request = new NetworkRequest(config);
    request.automaticallyRefreshAuthToken = false;
    const { data } = await request.execute();
    return data;
  }

  logout(options = {}) {
    const config = new KinveyRequestConfig({
      method: RequestMethod.POST,
      authType: AuthType.Session,
      url: url.format({
        protocol: this.client.apiProtocol,
        host: this.client.apiHost,
        pathname: `/${usersNamespace}/${this.client.appKey}/_logout`
      }),
      properties: options.properties,
      timeout: options.timeout,
      client: this.client
    });
    const request = new NetworkRequest(config, {
      automaticallyRefreshAuthToken: false
    });
    return request.execute();
  }

  async signup(data, options = {}) {
    const config = new KinveyRequestConfig({
      method: RequestMethod.POST,
      authType: AuthType.App,
      url: url.format({
        protocol: this.client.protocol,
        host: this.client.host,
        pathname: `/${usersNamespace}/${this.client.appKey}`
      }),
      body: data,
      properties: options.properties,
      timeout: options.timeout,
      client: this.client
    });
    const request = new NetworkRequest(config);
    const response = await request.execute();
    return response.data;
  }

  static signup(data, options) {
    const kinvey = new Kinvey();
    return kinvey.signup(data, options);
  }
}
