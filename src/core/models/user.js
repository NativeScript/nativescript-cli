import { ActiveUserError, KinveyError } from '../errors';
import Model from './model';
import Client from '../client';
import NetworkRequest from '../requests/networkRequest';
import { NotFoundError } from '../errors';
import { HttpMethod, ReadPolicy as DataPolicy, WritePolicy } from '../enums';
import Query from '../query';
import Auth from '../auth';
import UserUtils from '../utils/user';
import MobileIdentityConnect from '../mic';
import hello from 'hellojs';
import isObject from 'lodash/lang/isObject';
import result from 'lodash/object/result';
import assign from 'lodash/object/assign';
const appdataNamespace = process.env.KINVEY_DATASTORE_NAMESPACE || 'appdata';
const usersNamespace = process.env.KINVEY_USERS_NAMESPACE || 'user';
const rpcNamespace = process.env.KINVEY_RPC_NAMESPACE || 'rpc';
const micAuthProvider = process.env.KINVEY_MIC_AUTH_PROVIDER || 'kinveyAuth';

export default class User extends Model {
  get authtoken() {
    return this.metadata.authtoken;
  }

  /**
   * The pathname for the users where requests will be sent.
   *
   * @return   {string}    Pathname
   */
  getPathname(client) {
    client = client || this.client;
    return `/${usersNamespace}/${client.appId}`;
  }

  /**
   * The pathname for the rpc where requests will be sent.
   *
   * @return   {string}    Pathname
   */
  getRpcPathname(client) {
    client = client || this.client;
    return `/${rpcNamespace}/${client.appId}`;
  }

  /**
   * Active user that is logged in.
   *
   * @return {Promise} Resolved with the active user if one exists, null otherwise.
   */
  static getActive(options = {}) {
    const promise = UserUtils.getActive(options).then(data => {
      if (data) {
        return new User(data, options);
      }

      return null;
    });

    return promise;
  }

  /**
   * Stores the active user that is logged in.
   *
   * @return {Promise} Resolved with the active user if one exists, null otherwise.
   */
  static setActive(user, options = {}) {
    if (user && !(user instanceof User)) {
      user = new User(result(user, 'toJSON', user), options);
    }

    const promise = UserUtils.setActive(user, options).then(data => {
      if (data) {
        return new User(data, options);
      }

      return null;
    });

    return promise;
  }

  /**
   * Checks if the user is active.
   *
   * @returns {Promise} Resolved with `true` if the user is active, `false` otherwise.
   */
  isActive(options = {}) {
    return User.getActive(options).then(user => {
      if (user) {
        return this.id === user.id;
      }

      return false;
    });
  }

  /**
   * Login a user. A promise will be returned that will be resolved with a
   * user or rejected with an error.
   *
   * @param   {string|Object} usernameOrData Username or login data
   * @param   {string} [password] Password
   * @param   {Options} [options] Options
   * @return  {Promise} Promise
   *
   * @example
   * Kinvey.User.login('admin', 'admin').then(function(user) {
   *   ...
   * }).catch(function(err) {
   *   ...
   * });
   */
  static login(usernameOrData, password, options = {}) {
    if (!isObject(usernameOrData)) {
      usernameOrData = {
        username: usernameOrData,
        password: password
      };
    }

    const user = new User(usernameOrData, options);
    return user.login();
  }

  static connect(user = {}, accessToken, expiresIn, authProvider, options = {}) {
    if (user && !(user instanceof User)) {
      user = new User(result(user, 'toJSON', user), options);
    }
    return user.connect(accessToken, expiresIn, authProvider, options);
  }

  static connectWithFacebook(options = {}) {
    options = assign({
      client: Client.sharedInstance(),
      auth: Auth.default,
      collectionName: 'SocialProviders',
      handler() {}
    }, options);

    const promise = Promise.resolve().then(() => {
      const query = new Query();
      query.equalTo('provider', 'facebook');
      const request = new NetworkRequest({
        method: HttpMethod.GET,
        client: options.client,
        properties: options.properties,
        auth: options.auth,
        pathname: `/${appdataNamespace}/${options.client.appKey}/${options.collectionName}`,
        query: query,
        timeout: options.timeout
      });
      return request.execute();
    }).then(response => {
      if (response.isSuccess()) {
        if (response.data.length === 1) {
          hello.init({
            facebook: response.data[0].appId
          });

          return hello('facebook').login().then(() => {
            const authResponse = hello('facebook').getAuthResponse();
            return authResponse;
          });
        }

        throw new Error('Unsupported social provider');
      }

      throw response.error;
    }).then(() => {
      const authResponse = hello('facebook').getAuthResponse();
      return authResponse;
    });

    return promise;
  }

  static connectWithGoogle(options = {}) {
    options = assign({
      client: Client.sharedInstance(),
      auth: Auth.default,
      collectionName: 'SocialProviders',
      handler() {}
    }, options);

    const promise = Promise.resolve().then(() => {
      const query = new Query();
      query.equalTo('provider', 'google');
      const request = new NetworkRequest({
        method: HttpMethod.GET,
        client: options.client,
        properties: options.properties,
        auth: options.auth,
        pathname: `/${appdataNamespace}/${options.client.appKey}/${options.collectionName}`,
        query: query,
        timeout: options.timeout
      });
      return request.execute();
    }).then(response => {
      if (response.isSuccess()) {
        if (response.data.length === 1) {
          hello.init({
            google: response.data[0].appId
          });

          return hello('google').login().then(() => {
            const authResponse = hello('google').getAuthResponse();
            return authResponse;
          });
        }

        throw new Error('Unsupported social provider');
      }

      throw response.error;
    }).then(() => {
      const authResponse = hello('google').getAuthResponse();
      return authResponse;
    });

    return promise;
  }

  static connectWithMIC(redirectUri, authorizationGrant, user, options = {}) {
    const mic = new MobileIdentityConnect();
    const promise = mic.login(redirectUri, authorizationGrant, options).then(token => {
      return User.connect(user, token.access_token, token.expires_in, micAuthProvider, options);
    });

    return promise;
  }

  login(options = {}) {
    options = assign({
      client: this.client
    }, options);

    const promise = User.getActive(options).then(activeUser => {
      if (activeUser) {
        throw new ActiveUserError('A user is already logged in.');
      }

      const username = this.get('username');
      const password = this.get('password');
      const _socialIdentity = this.get('_socialIdentity');
      if ((!username || username === '' || !password || password === '') && !_socialIdentity) {
        throw new KinveyError(
          'Username and/or password missing. Please provide both a username and password to login.'
        );
      }

      const request = new NetworkRequest({
        method: HttpMethod.POST,
        pathname: `${this.getPathname(this.client)}/login`,
        data: this.toJSON(),
        auth: Auth.app,
        client: options.client
      });
      return request.execute();
    }).then(response => {
      if (response && response.isSuccess()) {
        this.set(response.data, options);
        this.unset('password');
        return User.setActive(this, options);
      }

      return response;
    });

    return promise;
  }

  connect(accessToken, expiresIn, authProvider, options = {}) {
    const socialIdentity = {};
    socialIdentity[authProvider] = {
      access_token: accessToken,
      expires_in: expiresIn
    };
    this.set('_socialIdentity', socialIdentity);

    const promise = this.isActive().then(active => {
      if (active) {
        return this.update(options);
      }

      return this.login(options);
    }).catch(err => {
      if (err instanceof NotFoundError) {
        return this.signup(options).then(() => {
          return this.connect(accessToken, expiresIn, authProvider, options);
        });
      }

      throw err;
    });

    return promise;
  }

  /**
   * Logout the active user. A promise will be returned that will be resolved
   * with null or rejected with an error.
   *
   * @param {Object} [options] Options
   * @return  {Promise} Promise
   *
   * @example
   * var user = Kinvey.User.getActive();
   * user.logout().then(function() {
   *   ...
   * }).catch(function(err) {
   *   ...
   * });
   */
  logout(options = {}) {
    options = assign({
      client: this.client
    }, options);

    const promise = this.isActive(options).then(active => {
      if (!active) {
        return null;
      }

      const request = new NetworkRequest({
        method: HttpMethod.POST,
        pathname: `${this.getPathname(options.client)}/_logout`,
        writePolicy: WritePolicy.Network,
        auth: Auth.session,
        client: options.client
      });
      return request.execute();
    }).then(() => {
      return User.setActive(null, options.client);
    });

    return promise;
  }

  static signup(user, options = {}) {
    if (!user) {
      return Promise.reject(new Error('User is required.'));
    }

    if (!(user instanceof User)) {
      user = new User(result(user, 'toJSON', user), options);
    }

    return user.signup();
  }

  signup(options = {}) {
    options = assign({
      client: this.client,
      state: false
    }, options);

    options.writePolicy = WritePolicy.Network;
    options.auth = Auth.app;

    const promise = User.getActive(options).then(activeUser => {
      if (options.state && activeUser) {
        throw new ActiveUserError('A user is already logged in. Please logout before saving the new user.');
      }

      return super.create(user, options);
    }).then(user => {
      if (options.state) {
        return User.setActive(user, options.client);
      }

      return user;
    });

    return promise;
  }

  me(options = {}) {
    options = assign({
      client: this.client
    }, options);

    const promise = this.isActive(options).then(active => {
      if (!active) {
        throw new KinveyError('User is not active. Please login first.');
      }

      const request = new NetworkRequest({
        method: HttpMethod.GET,
        pathname: `${this.getPathname(options.client)}/_me`,
        dataPolicy: DataPolicy.NetworkOnly,
        auth: Auth.session,
        client: options.client
      });
      return request.execute();
    }).then(response => {
      const user = new User(response.data);

      if (!user.kmd.authtoken) {
        return User.getActive().then(activeUser => {
          const kmd = user.kmd;
          kmd.authtoken = activeUser.kmd.authtoken;
          user.kmd = kmd;
          return user;
        });
      }

      return user;
    }).then(user => {
      return User.setActive(user, options.client);
    });

    return promise;
  }

  verifyEmail(options = {}) {
    options = assign({
      client: this.client
    }, options);

    const request = new NetworkRequest({
      method: HttpMethod.POST,
      pathname: `${this.getRpcPathname(options.client)}/${this.get('username')}/user-email-verification-initiate`,
      writePolicy: WritePolicy.Network,
      auth: Auth.app,
      client: options.client
    });
    const promise = request.execute();
    return promise;
  }

  forgotUsername(options = {}) {
    options = assign({
      client: this.client
    }, options);

    const request = new NetworkRequest({
      method: HttpMethod.POST,
      pathname: `${this.getRpcPathname(options.client)}/user-forgot-username`,
      writePolicy: WritePolicy.Network,
      auth: Auth.app,
      client: options.client,
      data: { email: this.get('email') }
    });
    const promise = request.execute();
    return promise;
  }

  resetPassword(options = {}) {
    options = assign({
      client: this.client
    }, options);

    const request = new NetworkRequest({
      method: HttpMethod.POST,
      pathname: `${this.getRpcPathname(options.client)}/${this.get('username')}/user-password-reset-initiate`,
      writePolicy: WritePolicy.Network,
      auth: Auth.app,
      client: options.client
    });
    const promise = request.execute();
    return promise;
  }
}
