import Promise from 'es6-promise';
import assign from 'lodash/assign';
import isString from 'lodash/isString';
import isObject from 'lodash/isObject';
import isEmpty from 'lodash/isEmpty';
import url from 'url';
import { Client } from '../client';
import { AuthType, RequestMethod, KinveyRequest } from '../request';
import { KinveyError, NotFoundError, ActiveUserError } from '../errors';
import { DataStore } from '../datastore';
import { MobileIdentityConnect } from '../identity';
import { Log } from '../log';
import { isDefined } from '../utils';
import { Acl } from '../acl';
import { Metadata } from '../metadata';
import { getLiveService } from '../live';
import { UserStore } from './userstore';

/**
 * The User class is used to represent a single user on the Kinvey platform.
 * Use the user class to manage the active user lifecycle and perform user operations.
 */
export class User {
  /**
   * Create a new instance of a User.
   *
   * @param {Object} [data={}] Data for the user.
   * @param {Object} [options={}] Options.
   * @return {User} User
   */
  constructor(data = {}, options = {}) {
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
    this.client = options.client || Client.sharedInstance();
  }

  /**
   * The _id for the user.
   *
   * @return {?string} _id
   */
  get _id() {
    return this.data._id;
  }

  /**
   * The _acl for the user.
   *
   * @return {Acl} _acl
   */
  get _acl() {
    return new Acl(this.data);
  }

  /**
   * The metadata for the user.
   *
   * @return {Metadata} metadata
   */
  get metadata() {
    return new Metadata(this.data);
  }

  /**
   * The _kmd for the user.
   *
   * @return {Metadata} _kmd
   */
  get _kmd() {
    return this.metadata;
  }

  /**
   * The _socialIdentity for the user.
   *
   * @return {Object} _socialIdentity
   */
  get _socialIdentity() {
    return this.data._socialIdentity;
  }

  /**
   * The auth token for the user.
   *
   * @return {?string} Auth token
   */
  get authtoken() {
    return this.metadata.authtoken;
  }

  /**
   * The username for the user.
   *
   * @return {?string} Username
   */
  get username() {
    return this.data.username;
  }

  /**
   * The email for the user.
   *
   * @return {?string} Email
   */
  get email() {
    return this.data.email;
  }

  /**
   * @private
   */
  get pathname() {
    return `/user/${this.client.appKey}`;
  }

  /**
   * Checks if the user is the active user.
   *
   * @return {boolean} True the user is the active user otherwise false.
   */
  isActive() {
    const activeUser = User.getActiveUser(this.client);

    if (isDefined(activeUser) && activeUser._id === this._id) {
      return true;
    }

    return false;
  }

  /**
   * Checks if the users email is verfified.
   *
   * @return {boolean} True if the users email is verified otherwise false.
   */
  isEmailVerified() {
    const status = this.metadata.emailVerification;
    return status === 'confirmed';
  }

  /**
   * Login using a username or password.
   *
   * @param {string|Object} username Username or an object with username and password as properties.
   * @param {string} [password] Password
   * @param {Object} [options={}] Options
   * @return {Promise<User>} The user.
   */
  login(username, password, options = {}) {
    let credentials = username;
    const isActive = this.isActive();
    const activeUser = User.getActiveUser(this.client);

    if (isActive === true) {
      return Promise.reject(new ActiveUserError('This user is already the active user.'));
    }

    if (isDefined(activeUser)) {
      return Promise.reject(
        new ActiveUserError('An active user already exists. Please logout the active user before you login.')
      );
    }

    if (isObject(credentials)) {
      options = password || {};
    } else {
      credentials = {
        username: username,
        password: password
      };
    }

    if (isDefined(credentials.username)) {
      credentials.username = String(credentials.username).trim();
    }

    if (isDefined(credentials.password)) {
      credentials.password = String(credentials.password).trim();
    }

    if ((!isDefined(credentials.username)
      || credentials.username === ''
      || !isDefined(credentials.password)
      || credentials.password === ''
    ) && !isDefined(credentials._socialIdentity)) {
      return Promise.reject(
        new KinveyError('Username and/or password missing. Please provide both a username and password to login.')
      );
    }

    const request = new KinveyRequest({
      method: RequestMethod.POST,
      authType: AuthType.App,
      url: url.format({
        protocol: this.client.apiProtocol,
        host: this.client.apiHost,
        pathname: `${this.pathname}/login`
      }),
      body: credentials,
      properties: options.properties,
      timeout: options.timeout,
      client: this.client
    });

    return request.execute()
      .then(response => response.data)
      .then((data) => {
        if (isDefined(credentials._socialIdentity) && isDefined(data._socialIdentity)) {
          const identities = Object.keys(data._socialIdentity);
          identities.forEach((identity) => {
            data._socialIdentity[identity] = assign(
              {},
              credentials._socialIdentity[identity],
              data._socialIdentity[identity]
            );
          });
          data._socialIdentity = assign({}, credentials._socialIdentity, data._socialIdentity);
        }

        // Remove sensitive data
        delete data.password;

        // Store the active user
        return this.client.setActiveUser(data);
      })
      .then((data) => {
        this.data = data;
        return this;
      });
  }

  /**
   * Login using a username or password.
   *
   * @param {string|Object} username Username or an object with username and password as properties.
   * @param {string} [password] Password
   * @param {Object} [options={}] Options
   * @return {Promise<User>} The user.
   */
  static login(username, password, options = {}) {
    const user = new this({}, options);
    return user.login(username, password, options);
  }

  /**
   * Login using Mobile Identity Connect.
   *
   * @param {string} redirectUri The redirect uri.
   * @param {AuthorizationGrant} [authorizationGrant=AuthoizationGrant.AuthorizationCodeLoginPage] MIC authorization grant to use.
   * @param {Object} [options] Options
   * @return {Promise<User>} The user.
   */
  loginWithMIC(redirectUri, authorizationGrant, options = {}) {
    const isActive = this.isActive();
    const activeUser = User.getActiveUser(this.client);

    if (isActive) {
      return Promise.reject(new ActiveUserError('This user is already the active user.'));
    }

    if (isDefined(activeUser)) {
      return Promise.reject(new ActiveUserError('An active user already exists. Please logout the active user before you login.'));
    }

    const mic = new MobileIdentityConnect({ client: this.client });
    return mic.login(redirectUri, authorizationGrant, options)
      .then(session => this.connectIdentity(MobileIdentityConnect.identity, session, options));
  }

  /**
   * Login using Mobile Identity Connect.
   *
   * @param {string} redirectUri The redirect uri.
   * @param {AuthorizationGrant} [authorizationGrant=AuthoizationGrant.AuthorizationCodeLoginPage] MIC authorization grant to use.
   * @param {Object} [options] Options
   * @return {Promise<User>} The user.
   */
  static loginWithMIC(redirectUri, authorizationGrant, options = {}) {
    const user = new this({}, options);
    return user.loginWithMIC(redirectUri, authorizationGrant, options);
  }

  /**
   * Connect a social identity.
   *
   * @param {string} identity Social identity.
   * @param {Object} session Social identity session.
   * @param {Object} [options] Options
   * @return {Promise<User>} The user.
   */
  connectIdentity(identity, session, options = {}) {
    const isActive = this.isActive();
    const data = {};
    const socialIdentity = data._socialIdentity || {};
    socialIdentity[identity] = session;
    data._socialIdentity = socialIdentity;

    if (isActive) {
      return this.update(data, options);
    }

    return this.login(data, options)
      .catch((error) => {
        if (error instanceof NotFoundError) {
          return this.signup(data, options)
            .then(() => this.connectIdentity(identity, session, options));
        }

        throw error;
      });
  }

  /**
   * Connect a social identity.
   *
   * @param {string} identity Social identity.
   * @param {Object} session Social identity session.
   * @param {Object} [options] Options
   * @return {Promise<User>} The user.
   */
  static connectIdentity(identity, session, options = {}) {
    const user = new this({}, options);
    return user.connectIdentity(identity, session, options);
  }

  /**
   * @private
   * Disconnects the user from  an identity.
   *
   * @param {SocialIdentity|string} identity Identity used to connect the user.
   * @param  {Object} [options] Options
   * @return {Promise<User>} The user.
   */
  disconnectIdentity(identity, options = {}) {
    let promise = Promise.resolve();

    if (identity === MobileIdentityConnect.identity) {
      promise = MobileIdentityConnect.logout(this, options);
    }

    return promise
      .catch((error) => {
        Log.error(error);
      })
      .then(() => {
        const data = this.data;
        const socialIdentity = data._socialIdentity || {};
        delete socialIdentity[identity];
        data._socialIdentity = socialIdentity;
        this.data = data;

        if (!this._id) {
          return this;
        }

        return this.update(data, options);
      })
      .then(() => this);
  }

  /**
   * Logout the active user.
   *
   * @param {Object} [options={}] Options
   * @return {Promise<User>} The user.
   */
  logout(options = {}) {
    // Logout from  Kinvey
    const request = new KinveyRequest({
      method: RequestMethod.POST,
      authType: AuthType.Session,
      url: url.format({
        protocol: this.client.apiProtocol,
        host: this.client.apiHost,
        pathname: `${this.pathname}/_logout`
      }),
      properties: options.properties,
      timeout: options.timeout,
      client: this.client
    });

    return this.unregisterFromLiveService()
      .then(() => request.execute())
      .catch((error) => {
        Log.error(error);
        return null;
      })
      .then(() => {
        return this.client.setActiveUser(null);
      })
      .catch((error) => {
        Log.error(error);
        return null;
      })
      .then(() => DataStore.clearCache({ client: this.client }))
      .catch((error) => {
        Log.error(error);
        return null;
      })
      .then(() => this);
  }

  /**
   * Logout the active user.
   *
   * @param {Object} [options={}] Options
   * @return {Promise<User>} The user.
   */
  static logout(options = {}) {
    const activeUser = User.getActiveUser(options.client);

    if (isDefined(activeUser)) {
      return activeUser.logout(options);
    }

    return Promise.resolve(null);
  }

  /**
   * Sign up a user with Kinvey.
   *
   * @param {?User|?Object} data Users data.
   * @param {Object} [options] Options
   * @param {boolean} [options.state=true] If set to true, the user will be set as the active user after successfully
   *                                       being signed up.
   * @return {Promise<User>} The user.
   */
  signup(data, options = {}) {
    const activeUser = User.getActiveUser(this.client);
    options = assign({
      state: true
    }, options);

    if (options.state === true && isDefined(activeUser)) {
      throw new ActiveUserError('An active user already exists. Please logout the active user before you login.');
    }

    if (data instanceof User) {
      data = data.data;
    }

    // Merge the data
    data = assign(this.data, data);

    const request = new KinveyRequest({
      method: RequestMethod.POST,
      authType: AuthType.App,
      url: url.format({
        protocol: this.client.apiProtocol,
        host: this.client.apiHost,
        pathname: this.pathname
      }),
      body: isEmpty(data) ? null : data,
      properties: options.properties,
      timeout: options.timeout,
      client: this.client
    });

    return request.execute()
      .then(response => response.data)
      .then((data) => {
        if (options.state === true) {
          return this.client.setActiveUser(data);
        }

        return data;
      })
      .then((data) => {
        this.data = data;
        return this;
      });
  }

  /**
   * Sign up a user with Kinvey.
   *
   * @param {User|Object} data Users data.
   * @param {Object} [options] Options
   * @param {boolean} [options.state=true] If set to true, the user will be set as the active user after successfully
   *                                       being signed up.
   * @return {Promise<User>} The user.
   */
  static signup(data, options = {}) {
    const user = new this({}, options);
    return user.signup(data, options);
  }

  /**
   * Sign up a user with Kinvey using an identity.
   *
   * @param {SocialIdentity|string} identity The identity.
   * @param {Object} session Identity session
   * @param {Object} [options] Options
   * @param {boolean} [options.state=true] If set to true, the user will be set as the active user after successfully
   *                                       being signed up.
   * @return {Promise<User>} The user.
   */
  signupWithIdentity(identity, session, options = {}) {
    const data = {};
    data._socialIdentity = {};
    data._socialIdentity[identity] = session;
    return this.signup(data, options);
  }

  /**
   * Sign up a user with Kinvey using an identity.
   *
   * @param {SocialIdentity|string} identity The identity.
   * @param {Object} session Identity session
   * @param {Object} [options] Options
   * @param {boolean} [options.state=true] If set to true, the user will be set as the active user after successfully
   *                                       being signed up.
   * @return {Promise<User>} The user.
   */
  static signupWithIdentity(identity, session, options = {}) {
    const user = new this({}, options);
    return user.signupWithIdentity(identity, session, options);
  }

  /**
   * Update the users data.
   *
   * @param {Object} data Data.
   * @param {Object} [options] Options
   * @return {Promise<User>} The user.
   */
  update(data, options = {}) {
    data = assign(this.data, data);
    const store = new UserStore();
    return store.update(data, options)
      .then((data) => {
        if (this.isActive()) {
          return this.client.setActiveUser(data);
        }

        return data;
      })
      .then((data) => {
        this.data = data;
        return this;
      });
  }

  /**
   * Update the active user.
   *
   * @param {Object} data Data.
   * @param {Object} [options] Options
   * @return {Promise<User>} The user.
   */
  static update(data, options = {}) {
    const activeUser = User.getActiveUser(options.client);

    if (isDefined(activeUser)) {
      return activeUser.update(data, options);
    }

    return Promise.resolve(null);
  }

  /**
   * Retfresh the users data.
   *
   * @param {Object} [options={}] Options
   * @return {Promise<User>} The user.
   */
  me(options = {}) {
    const request = new KinveyRequest({
      method: RequestMethod.GET,
      authType: AuthType.Session,
      url: url.format({
        protocol: this.client.apiProtocol,
        host: this.client.apiHost,
        pathname: `${this.pathname}/_me`
      }),
      properties: options.properties,
      timeout: options.timeout
    });

    return request.execute()
      .then(response => response.data)
      .then((data) => {
        // Merge returned data
        data = assign(this.data, data);

        // Remove sensitive data
        delete data.password;

        // Store the active user
        if (this.isActive()) {
          return this.client.setActiveUser(data);
        }

        return data;
      })
      .then((data) => {
        this.data = data;
        return this;
      });
  }

  /**
   * @returns {Promise}
   */
  static registerForLiveService() {
    const activeUser = User.getActiveUser();

    if (activeUser) {
      return activeUser.registerForLiveService();
    }

    return Promise.reject(new ActiveUserError('There is no active user'));
  }

  /**
   * @returns {Promise}
   */
  static unregisterFromLiveService() {
    const activeUser = User.getActiveUser();

    if (activeUser) {
      return activeUser.unregisterFromLiveService();
    }

    return Promise.reject(new ActiveUserError('There is no active user'));
  }

  registerForLiveService() {
    const liveService = getLiveService(this.client);
    let promise = Promise.resolve();
    if (!liveService.isInitialized()) {
      promise = liveService.fullInitialization(this);
    }
    return promise;
  }

  unregisterFromLiveService() {
    const liveService = getLiveService(this.client);
    let promise = Promise.resolve();
    if (liveService.isInitialized()) {
      promise = liveService.fullUninitialization();
    }
    return promise;
  }

  /**
   * Refresh the active user.
   *
   * @param {Object} [options={}] Options
   * @return {Promise<User>} The user.
   */
  static me(options = {}) {
    const activeUser = User.getActiveUser(options.client);

    if (activeUser) {
      return activeUser.me(options);
    }

    return Promise.resolve(null);
  }

  /**
   * Gets the active user. You can optionally provide a client
   * to use to lookup the active user.
   *
   * @param {Client} [client=Client.sharedInstance()] Client to use to lookup active user.
   * @return {?User} The active user.
   */
  static getActiveUser(client = Client.sharedInstance()) {
    const data = client.getActiveUser();

    if (isDefined(data)) {
      return new this(data, { client: client });
    }

    return null;
  }

  /**
   * Request an email to be sent to verify the users email.
   *
   * @param {string} username Username
   * @param {Object} [options={}] Options
   * @return {Promise<Object>} The response.
   */
  static verifyEmail(username, options = {}) {
    if (!username) {
      return Promise.reject(
        new KinveyError('A username was not provided.',
          'Please provide a username for the user that you would like to verify their email.')
      );
    }

    if (!isString(username)) {
      return Promise.reject(new KinveyError('The provided username is not a string.'));
    }

    const client = options.client || Client.sharedInstance();
    const request = new KinveyRequest({
      method: RequestMethod.POST,
      authType: AuthType.App,
      url: url.format({
        protocol: client.apiProtocol,
        host: client.apiHost,
        pathname: `/rpc/${client.appKey}/${username}/user-email-verification-initiate`
      }),
      properties: options.properties,
      timeout: options.timeout,
      client: client
    });
    return request.execute()
      .then(response => response.data);
  }

  /**
   * Request an email to be sent to recover a forgot username.
   *
   * @param {string} email Email
   * @param {Object} [options={}] Options
   * @return {Promise<Object>} The response.
   */
  static forgotUsername(email, options = {}) {
    if (!email) {
      return Promise.reject(
        new KinveyError('An email was not provided.',
          'Please provide an email for the user that you would like to retrieve their username.')
      );
    }

    if (!isString(email)) {
      return Promise.reject(new KinveyError('The provided email is not a string.'));
    }

    const client = options.client || Client.sharedInstance();
    const request = new KinveyRequest({
      method: RequestMethod.POST,
      authType: AuthType.App,
      url: url.format({
        protocol: client.apiProtocol,
        host: client.apiHost,
        pathname: `/rpc/${client.appKey}/user-forgot-username`
      }),
      properties: options.properties,
      data: { email: email },
      timeout: options.timeout,
      client: client
    });
    return request.execute()
      .then(response => response.data);
  }

  /**
   * Request an email to be sent to reset a users password.
   *
   * @param {string} username Username
   * @param {Object} [options={}] Options
   * @return {Promise<Object>} The response.
   */
  static resetPassword(username, options = {}) {
    if (!username) {
      return Promise.reject(
        new KinveyError('A username was not provided.',
          'Please provide a username for the user that you would like to verify their email.')
      );
    }

    if (!isString(username)) {
      return Promise.reject(new KinveyError('The provided username is not a string.'));
    }

    const client = options.client || Client.sharedInstance();
    const request = new KinveyRequest({
      method: RequestMethod.POST,
      authType: AuthType.App,
      url: url.format({
        protocol: client.apiProtocol,
        host: client.apiHost,
        pathname: `/rpc/${client.appKey}/${username}/user-password-reset-initiate`
      }),
      properties: options.properties,
      timeout: options.timeout,
      client: client
    });
    return request.execute()
      .then(response => response.data);
  }

  /**
   * Lookup users.
   *
   * @param {Query} [query] Query used to filter entities.
   * @param {Object} [options] Options
   * @return {Observable} Observable.
   */
  static lookup(query, options = {}) {
    const store = new UserStore();
    return store.lookup(query, options);
  }

  /**
   * Check if a username already exists.
   *
   * @param {string} username Username
   * @param {Object} [options] Options
   * @return {boolean} True if the username already exists otherwise false.
   */
  static exists(username, options = {}) {
    const store = new UserStore();
    return store.exists(username, options);
  }

  /**
   * Remove a user.
   *
   * @param   {string}  id               Id of the user to remove.
   * @param   {Object}  [options]        Options
   * @param   {boolean} [options.hard=false]   Boolean indicating whether user should be permanently removed from  the backend (defaults to false).
   * @return  {Promise}
   */
  static remove(id, options = {}) {
    const store = new UserStore();
    return store.removeById(id, options);
  }

  /**
   * Restore a user that has been suspended.
   *
   * @throw {KinveyError} Unsupported method.
   */
  static restore() {
    return Promise.reject(new KinveyError('This function requires a master secret to be provided for your application.'
      + ' We strongly advise not to do this.'));
  }
}
