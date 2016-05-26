/* eslint-disable no-underscore-dangle */
import Client from './client';
import { Query } from './query';
import { Acl } from './acl';
import { Metadata } from './metadata';
import { KinveyError, NotFoundError, ActiveUserError } from './errors';
import { MobileIdentityConnect, SocialIdentity } from './mic';
import { AuthType, RequestMethod, KinveyRequestConfig } from './requests/request';
import { DataStore, DataStoreType } from './datastore';
import { NetworkRequest } from './requests/network';
import { setActiveUser, setActiveSocialIdentity } from './utils/storage';
import url from 'url';
import assign from 'lodash/assign';
import result from 'lodash/result';
import isObject from 'lodash/isObject';
const appdataNamespace = process.env.KINVEY_DATASTORE_NAMESPACE || 'appdata';
const usersNamespace = process.env.KINVEY_USERS_NAMESPACE || 'user';
const rpcNamespace = process.env.KINVEY_RPC_NAMESPACE || 'rpc';
const idAttribute = process.env.KINVEY_ID_ATTRIBUTE || '_id';
const kmdAttribute = process.env.KINVEY_KMD_ATTRIBUTE || '_kmd';
const socialIdentityAttribute = process.env.KINVEY_SOCIAL_IDENTITY_ATTRIBUTE || '_socialIdentity';
const usernameAttribute = process.env.KINVEY_USERNAME_ATTRIBUTE || 'username';
const emailAttribute = process.env.KINVEY_EMAIL_ATTRIBUTE || 'email';
const supportedIdentities = ['facebook', 'google', 'linkedIn'];
let hello;

if (typeof window !== 'undefined') {
  hello = require('hellojs'); // eslint-disable-line global-require
}

/**
 * The User class is used to represent a single user on the Kinvey platform.
 * Use the user class to manage the active user lifecycle and perform user operations.
 */
export class User {
  /**
   * Create a new instance of a User.
   *
   * @param  {Object}   [data={}]    Data for the user.
   * @return {User}                  User
   *
   * @example
   * var user = new User();
   */
  constructor(data = {}) {
    /**
     * The users data.
     *
     * @type {Object}
     */
    this.data = data;

    /**
     * @private
     * The client used by this user.
     *
     * @type {Client}
     */
    this.client = Client.sharedInstance();
  }

  /**
   * The _id for the user.
   *
   * @return {?string} _id
   *
   * @example
   * var _id = user._id;
   */
  get _id() {
    return this.data[idAttribute];
  }

  /**
   * The _acl for the user.
   *
   * @return {Acl} _acl
   *
   * @example
   * var _acl = user._acl;
   */
  get _acl() {
    return new Acl(this.data);
  }

  /**
   * The metadata for the user.
   *
   * @return {Metadata} metadata
   *
   * @example
   * var metadata = user.metadata;
   */
  get metadata() {
    return new Metadata(this.data);
  }

  set metadata(metadata) {
    this.data[kmdAttribute] = result(metadata, 'toJSON', metadata);
  }

  /**
   * The _kmd for the user.
   *
   * @return {Metadata} _kmd
   *
   * @example
   * var _kmd = user._kmd;
   */
  get _kmd() {
    return this.metadata;
  }

  set _kmd(kmd) {
    this.metadata = kmd;
  }

  get _socialIdentity() {
    return this.data[socialIdentityAttribute];
  }

  /**
   * The auth token for the user.
   *
   * @return {?string} Auth token
   *
   * @example
   * var authtoken = user.authtoken;
   */
  get authtoken() {
    return this.metadata.authtoken;
  }

  /**
   * Set the auth token for the user.
   *
   * @param  {?string} authtoken Auth token
   *
   * @example
   * user.authtoken = 'authtoken';
   */
  set authtoken(authtoken) {
    const metadata = this.metadata;
    metadata.authtoken = authtoken;
    this.metadata = metadata;
  }

  /**
   * The username for the user.
   *
   * @return {?string} Username
   *
   * @example
   * var username = user.username;
   */
  get username() {
    return this.data[usernameAttribute];
  }

  /**
   * The email for the user.
   *
   * @return {?string} Email
   *
   * @example
   * var email = user.email;
   */
  get email() {
    return this.data[emailAttribute];
  }

  get pathname() {
    return `/${usersNamespace}/${this.client.appKey}`;
  }

  /**
   * Gets the active user. You can optionally provide a client
   * to use to lookup the active user.
   *
   * @param  {Client}           [client=Client.sharedInstance()]   Client to use to set the active user.
   * @return {Promise<User>}                                       The active user on the client. The
   *                                                               active user could be null if one does
   *                                                               not exist.
   *
   * @example
   * var _id = user._id;
   */
  static getActiveUser(client = Client.sharedInstance()) {
    const data = client.activeUser;
    let user = null;

    if (data) {
      user = new User(data);
      user.client = client;
    }

    return user;
  }

  /**
   * Checks if this user is the active user.
   *
   * @return {Promise<Boolean>} True or false if this user is the active user.
   *
   * @example
   * var promise = user.isActiveUser();
   * promise.then(function(isActiveUser) {
   *   ...
   * }).catch(function(error) {
   *   ...
   * });
   */
  isActive() {
    const activeUser = User.getActiveUser(this.client);

    if (activeUser && activeUser[idAttribute] === this[idAttribute]) {
      return true;
    }

    return false;
  }

  static login(usernameOrData, password, options) {
    const user = new User();
    return user.login(usernameOrData, password, options);
  }

  static loginWithIdentity(identity, tokens, options) {
    const user = new User();
    return user.loginWithIdentity(identity, tokens, options);
  }

  /**
   * Login using a username or password.
   *
   * @param  {string|Object}      usernameOrData    Username or an object with username
   *                                                and password properties.
   * @param  {string}             [password]        Users password.
   * @param  {Object}             [options={}]      Options
   * @return {Promise<User>}                        The logged in user.
   *
   * @example
   * var promise = user.login('username', 'password');
   * promise.then(function(user) {
   *   ...
   * }).catch(function(error) {
   *   ...
   * });
   */
  login(usernameOrData, password, options = {}) {
    if (!isObject(usernameOrData)) {
      usernameOrData = {
        username: usernameOrData,
        password: password
      };
    }

    if (!usernameOrData[socialIdentityAttribute]) {
      if (usernameOrData.username) {
        usernameOrData.username = String(usernameOrData.username).trim();
      }

      if (usernameOrData.password) {
        usernameOrData.password = String(usernameOrData.password).trim();
      }
    }

    const isActiveUser = this.isActive();
    if (isActiveUser) {
      return Promise.reject(new ActiveUserError('This user is already the active user.'));
    }

    const activeUser = User.getActiveUser(this.client);
    if (activeUser) {
      return Promise.reject(new ActiveUserError('An active user already exists. ' +
        'Please logout the active user before you login.'));
    }

    if ((!usernameOrData.username || usernameOrData.username === ''
      || !usernameOrData.password || usernameOrData.password === '')
      && !usernameOrData[socialIdentityAttribute]) {
      return Promise.reject(new KinveyError('Username and/or password missing. ' +
        'Please provide both a username and password to login.'));
    }

    const config = new KinveyRequestConfig({
      method: RequestMethod.POST,
      authType: AuthType.App,
      url: url.format({
        protocol: this.client.protocol,
        host: this.client.host,
        pathname: `${this.pathname}/login`
      }),
      body: usernameOrData,
      properties: options.properties,
      timeout: options.timeout
    });
    const request = new NetworkRequest(config);
    request.automaticallyRefreshAuthToken = false;
    const promise = request.execute().then(response => {
      this.data = response.data;
      setActiveUser(this.client, this.data);
      return User.getActiveUser(this.client);
    });

    return promise;
  }

  loginWithIdentity(identity, token, options) {
    const data = {};
    data[socialIdentityAttribute] = {};
    data[socialIdentityAttribute][identity] = token;
    return this.login(data, options);
  }

  static loginWithMIC(redirectUri, authorizationGrant, options) {
    const user = new User();
    return user.loginWithMIC(redirectUri, authorizationGrant, options);
  }

  /* eslint-disable max-len */
  /**
   * Login using Mobile Identity Connect.
   *
   * @param  {string}                 redirectUri                                                         The redirect uri used
   *                                                                                                      for MIC logins.
   * @param  {AuthorizationGrant}     [authorizationGrant=AuthoizationGrant.AuthorizationCodeLoginPage]   MIC authorization grant to use.
   * @param  {Object}                 [options={}]                                                        Options
   * @return {Promise<User>}                                                                              The logged in user.
   *
   * @example
   * var promise = user.loginWithMIC('http://example.com');
   * promise.then(function(user) {
   *   ...
   * }).catch(function(error) {
   *   ...
   * });
   */
  /* eslint-enable max-len */
  loginWithMIC(redirectUri, authorizationGrant, options = {}) {
    const mic = new MobileIdentityConnect(this.client);
    return mic.login(redirectUri, authorizationGrant, options).then(token => {
      options.redirectUri = redirectUri;
      options.micClient = result(mic.client, 'toJSON', mic.client);
      return this.connect(MobileIdentityConnect.identity, token, options);
    });
  }

  /**
   * Logout the user. If the user was the active user then the active user will be set to null.
   *
   * @param  {Object}         [options={}]    Options
   * @return {Promise<User>}                  The logged out user.
   *
   * @example
   * var promise = user.logout();
   * promise.then(function(user) {
   *   ...
   * }).catch(function(error) {
   *   ...
   * });
   */
  logout(options = {}) {
    const isActive = this.isActive();

    if (!isActive) {
      return Promise.resolve();
    }

    const request = new NetworkRequest({
      method: RequestMethod.POST,
      authType: AuthType.Session,
      url: url.format({
        protocol: this.client.protocol,
        host: this.client.host,
        pathname: `/${usersNamespace}/${this.client.appKey}/_logout`
      }),
      properties: options.properties,
      timeout: options.timeout
    });
    request.automaticallyRefreshAuthToken = false;

    const promise = request.execute()
      .catch(() => null)
      .then(() => {
        const isActive = this.isActive();
        if (isActive) {
          setActiveUser(this.client, null);
        }

        return null;
      })
      .then(() => DataStore.clear({ client: this.client }))
      .then(() => this);

    return promise;
  }

  /**
   * @private
   * Returns true or false if identity connect is supported.
   *
   * @return {Boolean}  True or false if identity connect is supported.
   *
   * @example
   * var isIdentitySupported = user.isIdentitySupported('identity');
   */
  static isIdentitySupported(identity) {
    return typeof hello !== 'undefined' && supportedIdentities.indexOf(identity) !== -1;
  }

  /**
   * Connect using Facebook.
   *
   * @param  {Object}         [options={}]  Options
   * @return {Promise<User>}                The connected user.
   *
   * @example
   * var promise = user.connectWithFacebook();
   * promise.then(function(user) {
   *   ...
   * }).catch(function(error) {
   *   ...
   * });
   */
  static connectWithFacebook(options = {}) {
    return User.connectWithIdentity(SocialIdentity.Facebook, options);
  }

  /**
   * Connect using Google.
   *
   * @param  {Object}         [options={}]  Options
   * @return {Promise<User>}                The connected user.
   *
   * @example
   * var promise = user.connectWithGoogle();
   * promise.then(function(user) {
   *   ...
   * }).catch(function(error) {
   *   ...
   * });
   */
  static connectWithGoogle(options = {}) {
    return User.connectWithIdentity(SocialIdentity.Google, options);
  }

  /**
   * Connect using LinkedIn.
   *
   * @param  {Object}         [options={}]  Options
   * @return {Promise<User>}                The connected user.
   *
   * @example
   * var promise = user.connectWithLinkedIn();
   * promise.then(function(user) {
   *   ...
   * }).catch(function(error) {
   *   ...
   * });
   */
  static connectWithLinkedIn(options = {}) {
    return User.connectWithIdentity(SocialIdentity.LinkedIn, options);
  }

  static connectWithIdentity(identity, options) {
    const user = new User();
    return user.connectWithIdentity(identity, options);
  }

  /* eslint-disable max-len */
  /**
   * Connect using an identity (Facebook, Google, LinkedIn etc.).
   *
   * @param  {SocialIdentity|string}         identity                                Identity used to connect the user.
   * @param  {Object}                        [options={}]                            Options
   * @param  {string}                        [options.collectionName='Identities']   Collection name to use to lookup credentials
   *                                                                                 for the identity.
   * @return {Promise<User>}                                                         The connected user.
   *
   * @example
   * var promise = user.connectWithIdentity(SocialIdentity.Facebook);
   * promise.then(function(user) {
   *   ...
   * }).catch(function(error) {
   *   ...
   * });
   */
  /* eslint-enable max-len */
  connectWithIdentity(identity, options = {}) {
    options = assign({
      collectionName: 'identities'
    }, options);

    let promise = Promise.resolve().then(() => {
      if (!identity) {
        throw new KinveyError('An identity is required to connect the user.');
      }

      if (!User.isIdentitySupported(identity)) {
        throw new KinveyError(`Identity ${identity} is not supported on this platform.`);
      }

      const query = new Query().equalTo('identity', identity);
      const request = new NetworkRequest({
        method: RequestMethod.GET,
        authType: AuthType.None,
        url: url.format({
          protocol: this.client.protocol,
          host: this.client.host,
          pathname: `/${appdataNamespace}/${this.client.appKey}/${options.collectionName}`
        }),
        query: query,
        properties: options.properties,
        timeout: options.timeout
      });
      return request.execute();
    });

    promise = promise
      .then(response => {
        if (response.data.length === 1) {
          const helloSettings = {};
          helloSettings[identity] = response.data[0].key || response.data[0].appId || response.data[0].clientId;
          hello.init(helloSettings);
          return hello(identity).login();
        }

        throw new KinveyError('Unsupported identity.');
      })
      .then(() => {
        const authResponse = hello(identity).getAuthResponse();
        return this.connect(identity, authResponse, options);
      });

    return promise;
  }

  /**
   * @private
   *
   * Connects with the provided accessToken and identity.
   *
   * @param  {SocialIdentity|string}         identity      Identity used to connect the user.
   * @param  {string}                        accessToken   Access token for the identity.
   * @param  {number}                        [expiresIn]   Time in seconds for how long the access token is valid.
   * @param  {Object}                        [options={}]  Options
   * @return {Promise<User>}                               The connected user.
   *
   * @example
   * var token = {
   *   access_token: 'access_token',
   *   refresh_token: 'refresh_token',
   *   expires_in: 3600
   * };
   * var promise = user.connect(SocialIdentity.Facebook, token);
   * promise.then(function(user) {
   *   ...
   * }).catch(function(error) {
   *   ...
   * });
   */
  connect(identity, token, options = {}) {
    const data = this.data;
    const socialIdentity = data[socialIdentityAttribute] || {};
    socialIdentity[identity] = token;
    data[socialIdentityAttribute] = socialIdentity;
    this.data = data;

    const promise = Promise.resolve()
      .then(() => {
        const isActive = this.isActive();

        if (isActive) {
          options._identity = identity;
          return this.update(data, options);
        }

        return this.login(data, null, options);
      })
      .catch(err => {
        if (err instanceof NotFoundError) {
          return this.signup(data, options).then(() => this.connect(identity, token, options));
        }

        throw err;
      })
      .then(() => {
        setActiveSocialIdentity(this.client, {
          identity: identity,
          token: this[socialIdentityAttribute][identity],
          redirectUri: options.redirectUri,
          client: options.micClient
        });
        return this;
      });

    return promise;
  }

  disconnect(identity, options = {}) {
    const data = this.data;
    const socialIdentity = data[socialIdentityAttribute] || {};
    delete socialIdentity[identity];
    data[socialIdentityAttribute] = socialIdentity;
    this.data = data;

    const promise = Promise.resolve().then(() => {
      if (!this[idAttribute]) {
        return this;
      }

      return this.update(data, options);
    }).then(() => {
      const activeSocialIdentity = this.client.activeSocialIdentity;

      if (activeSocialIdentity.identity === identity) {
        setActiveSocialIdentity(this.client, null);
      }

      return this;
    });

    return promise;
  }

  static signup(data, options) {
    const user = new User();
    return user.signup(data, options);
  }

  static signupWithIdentity(identity, tokens, options) {
    const user = new User();
    return user.signupWithIdentity(identity, tokens, options);
  }

  /**
   * Sign up. If options.state is set to true then the user
   * will be set as the active user after succesfully signing up the
   * user.
   *
   * @param  {User|Object}    data                    Users data.
   * @param  {Object}         [options={}]            Options
   * @param  {Boolean}        [options.state=true]    If set to true, the user will be
   *                                                  set as the active user after successfully
   *                                                  being signed up.
   * @return {Promise<User>}                          The signed up user.
   *
   * @example
   * var promise = user.signup({
   *   username: 'admin',
   *   password: 'admin'
   * });
   * promise.then(function(user) {
   *   ...
   * }).catch(function(error) {
   *   ...
   * });
   */
  signup(data, options = {}) {
    options = assign({
      state: true
    }, options);

    const promise = Promise.resolve()
      .then(() => {
        if (options.state === true) {
          const activeUser = User.getActiveUser(this.client);
          if (activeUser) {
            throw new ActiveUserError('An active user already exists. ' +
              'Please logout the active user before you login.');
          }
        }
      })
      .then(() => {
        const request = new NetworkRequest({
          method: RequestMethod.POST,
          authType: AuthType.App,
          url: url.format({
            protocol: this.client.protocol,
            host: this.client.host,
            pathname: `/${usersNamespace}/${this.client.appKey}`
          }),
          data: result(data, 'toJSON', data),
          properties: options.properties,
          timeout: options.timeout
        });
        return request.execute();
      })
      .then(response => {
        this.data = response.data;

        if (options.state === true) {
          setActiveUser(this.client, this.data);
        }

        return this;
      });

    return promise;
  }

  signupWithIdentity(identity, tokens, options) {
    const data = {};
    data[socialIdentityAttribute] = {};
    data[socialIdentityAttribute][identity] = tokens;
    return this.signup(data, options);
  }

  update(data, options) {
    const userStore = DataStore.getInstance(null, DataStoreType.User);
    return userStore.save(data, options).then(data => {
      this.data = data;

      if (this.isActive()) {
        setActiveUser(this.client, this.data);
      }

      return this;
    });
  }

  me(options = {}) {
    const request = new NetworkRequest({
      method: RequestMethod.GET,
      authType: AuthType.Session,
      url: url.format({
        protocol: this.client.protocol,
        host: this.client.host,
        pathname: `/${usersNamespace}/${this.client.appKey}/_me`
      }),
      properties: options.properties,
      timeout: options.timeout
    });

    const promise = request.execute().then(response => {
      this.data = response.data;

      if (!this.authtoken) {
        const activeUser = User.getActiveUser(this.client);

        if (activeUser) {
          this.authtoken = activeUser.authtoken;
        }
      }

      setActiveUser(this.client, this.data);
      return this;
    });

    return promise;
  }

  verifyEmail(options = {}) {
    const request = new NetworkRequest({
      method: RequestMethod.POST,
      authType: AuthType.App,
      url: url.format({
        protocol: this.client.protocol,
        host: this.client.host,
        pathname: `/${rpcNamespace}/${this.client.appKey}/${this.username}/user-email-verification-initiate`
      }),
      properties: options.properties,
      timeout: options.timeout,
      client: this.client
    });

    const promise = request.execute().then(response => response.data);
    return promise;
  }

  forgotUsername(options = {}) {
    const request = new NetworkRequest({
      method: RequestMethod.POST,
      authType: AuthType.App,
      url: url.format({
        protocol: this.client.protocol,
        host: this.client.host,
        pathname: `/${rpcNamespace}/${this.client.appKey}/user-forgot-username`
      }),
      properties: options.properties,
      data: { email: this.email },
      timeout: options.timeout,
      client: this.client
    });

    const promise = request.execute().then(response => response.data);
    return promise;
  }

  resetPassword(options = {}) {
    const request = new NetworkRequest({
      method: RequestMethod.POST,
      authType: AuthType.App,
      url: url.format({
        protocol: this.client.protocol,
        host: this.client.host,
        pathname: `/${rpcNamespace}/${this.client.appKey}/${this.username}/user-password-reset-initiate`
      }),
      properties: options.properties,
      timeout: options.timeout,
      client: this.client
    });

    const promise = request.execute().then(response => response.data);
    return promise;
  }

  // refreshAuthToken(options = {}) {
  //   const socialIdentity = this.data[socialIdentityAttribute];
  //   const identity = socialIdentity.activeIdentity;
  //   const token = socialIdentity[identity];
  //   let promise;

  //   switch (identity) {
  //     case MobileIdentityConnect.identity:
  //       const mic = new MobileIdentityConnect(this.client);
  //       promise = mic.refresh(token, options);
  //       break;
  //     default:
  //       promise = Promise.reject(new KinveyError(`Unable to refresh the auth token because ` +
  //         `the ${identity} identity is not supported.`));
  //   }

  //   return promise.then(token => {
  //     return this.connect(identity, token, options);
  //   });
  // }

  toJSON() {
    return this.data;
  }
}
