import { Client } from './client';
import { Acl } from './acl';
import { Metadata } from './metadata';
import { KinveyError, NotFoundError, ActiveUserError } from './errors';
import { MobileIdentityConnect } from './mic';
import { AuthType, RequestMethod, KinveyRequestConfig } from './requests/request';
import { DataStore, NetworkStore } from './datastore';
import { NetworkRequest } from './requests/network';
import { Promise } from 'es6-promise';
import { Facebook, Google, Kinvey, LinkedIn, Windows } from './social';
import { setActiveUser, setActiveSocialIdentity } from './utils/storage';
import regeneratorRuntime from 'regenerator-runtime'; // eslint-disable-line no-unused-vars
import url from 'url';
import assign from 'lodash/assign';
import result from 'lodash/result';
import isArray from 'lodash/isArray';
import isString from 'lodash/isString';
const usersNamespace = process.env.KINVEY_USERS_NAMESPACE || 'user';
const rpcNamespace = process.env.KINVEY_RPC_NAMESPACE || 'rpc';
const idAttribute = process.env.KINVEY_ID_ATTRIBUTE || '_id';
const kmdAttribute = process.env.KINVEY_KMD_ATTRIBUTE || '_kmd';
const socialIdentityAttribute = process.env.KINVEY_SOCIAL_IDENTITY_ATTRIBUTE || '_socialIdentity';
const usernameAttribute = process.env.KINVEY_USERNAME_ATTRIBUTE || 'username';
const emailAttribute = process.env.KINVEY_EMAIL_ATTRIBUTE || 'email';

/**
 * @private
 * The UserStore class is used to find, save, update, remove, count and group users.
 */
export class UserStore extends NetworkStore {
  /**
   * The pathname for the store.
   *
   * @return  {string}   Pathname
   */
  get pathname() {
    return `/${usersNamespace}/${this.client.appKey}`;
  }

  /**
   * @private
   * @throws {KinveyError} Method is unsupported. Instead use User.signup() to create a user.
   */
  async create() {
    throw new KinveyError('Please use `User.signup()` to create a user.');
  }

  /**
   * Update a user.
   *
   * @param {Object} data Data for user to update.
   * @param {Object} [options={}] Options
   * @return {Promise<Object>} The updated user data.
   */
  async update(data, options = {}) {
    if (!data) {
      throw new KinveyError('No user was provided to be updated.');
    }

    if (isArray(data)) {
      throw new KinveyError('Only one user can be updated at one time.', data);
    }

    if (!data[idAttribute]) {
      throw new KinveyError('User must have an _id.');
    }

    if (options._identity) {
      const socialIdentity = data[socialIdentityAttribute];
      if (socialIdentity) {
        for (const [key] of socialIdentity) {
          if (socialIdentity[key] && options._identity !== key) {
            delete socialIdentity[key];
          }
        }
      }
    }

    return super.update(data, options);
  }

  /**
   * Check if a username already exists.
   *
   * @param {string} username Username
   * @param {Object} [options={}] Options
   * @return {boolean} True if the username already exists otherwise false.
   */
  async exists(username, options = {}) {
    const config = new KinveyRequestConfig({
      method: RequestMethod.POST,
      authType: AuthType.App,
      url: url.format({
        protocol: this.client.protocol,
        host: this.client.host,
        pathname: `/${rpcNamespace}/${this.client.appKey}/check-username-exists`
      }),
      properties: options.properties,
      data: { username: username },
      timeout: options.timeout,
      client: this.client
    });
    const request = new NetworkRequest(config);
    const response = await request.execute();
    const data = response.data || {};
    return data.usernameExists === true;
  }

  /**
   * Restore a user that has been suspended.
   *
   * @param {string} id Id of the user to restore.
   * @param {Object} [options={}] Options
   * @return {Promise<Object>} The response.
   */
  async restore(id, options = {}) {
    const config = new KinveyRequestConfig({
      method: RequestMethod.POST,
      authType: AuthType.Master,
      url: url.format({
        protocol: this.client.protocol,
        host: this.client.host,
        pathname: `${this.pathname}/${id}`
      }),
      properties: options.properties,
      timeout: options.timeout,
      client: this.client
    });
    const request = new NetworkRequest(config);
    const response = await request.execute();
    return response.data;
  }
}

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
    return this.data[idAttribute];
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
   * Set the metadata for the user.
   *
   * @param {Metadata|Object} metadata The metadata.
   */
  set metadata(metadata) {
    this.data[kmdAttribute] = result(metadata, 'toJSON', metadata);
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
   * Set the _kmd for the user.
   *
   * @param {Metadata|Object} metadata The metadata.
   */
  set _kmd(kmd) {
    this.metadata = kmd;
  }

  /**
   * The _socialIdentity for the user.
   *
   * @return {Object} _socialIdentity
   */
  get _socialIdentity() {
    return this.data[socialIdentityAttribute];
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
   * Set the auth token for the user.
   *
   * @param  {?string} authtoken Auth token
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
   */
  get username() {
    return this.data[usernameAttribute];
  }

  /**
   * The email for the user.
   *
   * @return {?string} Email
   */
  get email() {
    return this.data[emailAttribute];
  }

  /**
   * @private
   */
  get pathname() {
    return `/${usersNamespace}/${this.client.appKey}`;
  }

  /**
   * Checks if the user is the active user.
   *
   * @return {boolean} True the user is the active user otherwise false.
   */
  isActive() {
    const activeUser = User.getActiveUser(this.client);

    if (activeUser && activeUser[idAttribute] === this[idAttribute]) {
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
   * Gets the active user. You can optionally provide a client
   * to use to lookup the active user.
   *
   * @param {Client} [client=Client.sharedInstance()] Client to use to lookup active user.
   * @return {?User} The active user.
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
   * Login using a username or password.
   *
   * @param {string|Object} username Username or an object with username and password as properties.
   * @param {string} [password] Password
   * @param {Object} [options={}] Options
   * @return {Promise<User>} The user.
   */
  async login(username, password, options = {}) {
    const isActiveUser = this.isActive();
    if (isActiveUser) {
      return Promise.reject(new ActiveUserError('This user is already the active user.'));
    }

    const activeUser = User.getActiveUser(this.client);
    if (activeUser) {
      return Promise.reject(new ActiveUserError('An active user already exists. ' +
        'Please logout the active user before you login.'));
    }

    this.data = await Kinvey.login(username, password, options);
    setActiveUser(this.client, this.data);
    return User.getActiveUser(this.client);
  }

  /**
   * Login using a username or password.
   *
   * @param {string|Object} username Username or an object with username and password as properties.
   * @param {string} [password] Password
   * @param {Object} [options={}] Options
   * @return {Promise<User>} The user.
   */
  static login(usernameOrData, password, options) {
    const user = new User();
    return user.login(usernameOrData, password, options);
  }

  /**
   * Login using a social identity.
   *
   * @param {string} identity Social identity.
   * @param {Object} session Social identity session.
   * @param {Object} [options] Options
   * @return {Promise<User>} The user.
   */
  loginWithIdentity(identity, session, options) {
    const data = {};
    data[socialIdentityAttribute] = {};
    data[socialIdentityAttribute][identity] = session;
    return this.login(data, options);
  }

  /**
   * Login using Mobile Identity Connect.
   *
   * @param {string} redirectUri The redirect uri.
   * @param {AuthorizationGrant} [authorizationGrant=AuthoizationGrant.AuthorizationCodeLoginPage] MIC authorization grant to use.
   * @param {Object} [options] Options
   * @return {Promise<User>} The user.
   */
  loginWithMIC(redirectUri, authorizationGrant, options) {
    const mic = new MobileIdentityConnect(this.client);
    return mic.login(redirectUri, authorizationGrant, options).then(token => {
      options.redirectUri = redirectUri;
      options.micClient = result(mic.client, 'toJSON', mic.client);
      return this.connect(MobileIdentityConnect.identity, token, options);
    });
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
    const client = options.client || Client.sharedInstance();
    const user = new User();
    user.client = client;
    return user.loginWithMIC(redirectUri, authorizationGrant, options);
  }

  /**
   * Login using Facebook.
   *
   * @param  {Object}         [options={}]  Options
   * @return {Promise<User>}                The connected user.
   */
  async loginWithFacebook(options = {}) {
    const session = await Facebook.login(options);
    return this.connect(Facebook.identity, session, options);
  }

  static loginWithFacebook(options = {}) {
    const user = new User({});
    return user.loginWithFacebook(options);
  }

  /**
   * Login using Google.
   *
   * @param  {Object}         [options={}]  Options
   * @return {Promise<User>}                The connected user.
   */
  async loginWithGoogle(options = {}) {
    const session = await Google.login(options);
    return this.connect(Google.identity, session, options);
  }

  static loginWithGoogle(options = {}) {
    const user = new User({});
    return user.loginWithGoogle(options);
  }

  /**
   * Login using LinkedIn.
   *
   * @param  {Object}         [options={}]  Options
   * @return {Promise<User>}                The connected user.
   */
  async loginWithLinkedIn(options = {}) {
    const session = await LinkedIn.login(options);
    return this.connect(LinkedIn.identity, session, options);
  }

  static loginWithLinkedIn(options = {}) {
    const user = new User({});
    return user.loginWithLinkedIn(options);
  }

  /**
   * Login using Windows.
   *
   * @param  {Object}         [options={}]  Options
   * @return {Promise<User>}                The connected user.
   */
  async loginWithWindows(options = {}) {
    const session = await Windows.login(options);
    return this.connect(Windows.identity, session, options);
  }

  static loginWithWindows(options = {}) {
    const user = new User({});
    return user.loginWithWindows(options);
  }

  /**
   * @private
   * Connects the user with an identity.
   *
   * @param {SocialIdentity|string} identity Identity to connect the user.
   * @param {string} session Identity session.
   * @param  {Object} [options={}] Options
   * @return {Promise<User>} The user.
   */
  async connect(identity, session, options = {}) {
    const data = this.data;
    const socialIdentity = data[socialIdentityAttribute] || {};
    socialIdentity[identity] = session;
    data[socialIdentityAttribute] = socialIdentity;
    this.data = data;

    try {
      const isActive = this.isActive();

      if (isActive) {
        options._identity = identity;
        return this.update(data, options);
      }

      await this.login(data, null, options);

      setActiveSocialIdentity(this.client, {
        identity: identity,
        token: this[socialIdentityAttribute][identity],
        redirectUri: options.redirectUri,
        client: options.micClient
      });

      return this;
    } catch (error) {
      if (error instanceof NotFoundError) {
        await this.signup(data, options);
        return this.connect(identity, session, options);
      }

      throw error;
    }
  }

  /**
   * @private
   * Disconnects the user from an identity.
   *
   * @param {SocialIdentity|string} identity Identity used to connect the user.
   * @param  {Object} [options={}] Options
   * @return {Promise<User>} The user.
   */
  async disconnect(identity, options = {}) {
    const data = this.data;
    const socialIdentity = data[socialIdentityAttribute] || {};
    delete socialIdentity[identity];
    data[socialIdentityAttribute] = socialIdentity;
    this.data = data;

    if (!this[idAttribute]) {
      return this;
    }

    await this.update(data, options);
    const activeSocialIdentity = this.client.activeSocialIdentity;

    if (activeSocialIdentity.identity === identity) {
      setActiveSocialIdentity(this.client, null);
    }

    return this;
  }

  /**
   * Logout the active user.
   *
   * @param {Object} [options={}] Options
   * @return {Promise<User>} The user.
   */
  async logout() {
    try {
      // TODO: lookup social identity used to login and logout
    } catch (error) {
      // Just catch the error
    }

    setActiveUser(this.client, null);
    await DataStore.clearCache({ client: this.client });
    return this;
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
  async signup(data, options = {}) {
    options = assign({
      state: true
    }, options);

    if (options.state === true) {
      const activeUser = User.getActiveUser(this.client);
      if (activeUser) {
        throw new ActiveUserError('An active user already exists.'
          + ' Please logout the active user before you login.');
      }
    }

    if (data instanceof User) {
      data = data.data;
    }

    this.data = await Kinvey.signup(data, options);
    if (options.state === true) {
      setActiveUser(this.client, this.data);
    }
    return this;
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
  static signup(data, options) {
    const user = new User();
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
  signupWithIdentity(identity, session, options) {
    const data = {};
    data[socialIdentityAttribute] = {};
    data[socialIdentityAttribute][identity] = session;
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
  static signupWithIdentity(identity, session, options) {
    const user = new User();
    return user.signupWithIdentity(identity, session, options);
  }

  /**
   * Update the users data.
   *
   * @param {Object} data Data.
   * @param {Object} [options] Options
   * @return {Promise<User>} The user.
   */
  async update(data, options) {
    data = assign(this.data, data);
    const userStore = new UserStore();
    data = await userStore.update(data, options);
    this.data = data;

    if (this.isActive()) {
      setActiveUser(this.client, this.data);
    }

    return this;
  }

  /**
   * Retfresh the users data.
   *
   * @param {Object} [options={}] Options
   * @return {Promise<User>} The user.
   */
  async me(options = {}) {
    const config = new KinveyRequestConfig({
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
    const request = new NetworkRequest(config);
    const response = await request.execute();
    this.data = response.data;

    if (!this.authtoken) {
      const activeUser = User.getActiveUser(this.client);

      if (activeUser) {
        this.authtoken = activeUser.authtoken;
      }
    }

    setActiveUser(this.client, this.data);
    return this;
  }

  /**
   * Request an email to be sent to verify the users email.
   *
   * @param {Object} [options={}] Options
   * @return {Promise<Object>} The response.
   */
  async verifyEmail(options = {}) {
    const config = new KinveyRequestConfig({
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
    const request = new NetworkRequest(config);
    const { data } = await request.execute();
    return data;
  }

  /**
   * Request an email to be sent to recover a forgot username.
   *
   * @param {Object} [options={}] Options
   * @return {Promise<Object>} The response.
   */
  async forgotUsername(options = {}) {
    const config = new KinveyRequestConfig({
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
    const request = new NetworkRequest(config);
    const { data } = await request.execute();
    return data;
  }

  /**
   * Request an email to be sent to reset the users password.
   *
   * @param {Object} [options = {}] Options
   * @return {Promise<Object>} The response.
   */
  resetPassword(options = {}) {
    options.client = this.client;
    return User.resetPassword(this.username, options);
  }

  /**
   * Request an email to be sent to reset a users password.
   *
   * @param {string} username Username
   * @param {Object} [options={}] Options
   * @return {Promise<Object>} The response.
   */
  static async resetPassword(username, options = {}) {
    if (!username) {
      throw new KinveyError('A username was not provided.',
       'Please provide a username for the user that you would like to reset their password.');
    }

    if (!isString(username)) {
      throw new KinveyError('The provided username is not a string.');
    }

    const client = options.client || Client.sharedInstance();
    const config = new KinveyRequestConfig({
      method: RequestMethod.POST,
      authType: AuthType.App,
      url: url.format({
        protocol: client.protocol,
        host: client.host,
        pathname: `/${rpcNamespace}/${client.appKey}/${username}/user-password-reset-initiate`
      }),
      properties: options.properties,
      timeout: options.timeout,
      client: client
    });
    const request = new NetworkRequest(config);
    const { data } = await request.execute();
    return data;
  }

  /**
   * Check if a username already exists.
   *
   * @param {string} username Username
   * @param {Object} [options] Options
   * @return {boolean} True if the username already exists otherwise false.
   */
  static exists(username, options) {
    const store = new UserStore();
    return store.exists(username, options);
  }

  /**
   * Restore a user that has been suspended.
   *
   * @param {string} id Id of the user to restore.
   * @param {Object} [options] Options
   * @return {Promise<Object>} The response.
   */
  static restore(id, options) {
    const store = new UserStore();
    return store.restore(id, options);
  }
}
