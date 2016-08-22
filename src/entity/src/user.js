import { Client } from '../../client';
import { Acl } from './acl';
import { Metadata } from './metadata';
import { AuthType, RequestMethod, KinveyRequest } from '../../request';
import { KinveyError, NotFoundError, ActiveUserError } from '../../errors';
import { DataStore, UserStore } from '../../datastore';
import { Promise } from 'es6-promise';
import { Facebook, Google, LinkedIn, MobileIdentityConnect } from '../../social';
import { Log, setActiveUser, setIdentitySession } from '../../utils';
import regeneratorRuntime from 'regenerator-runtime'; // eslint-disable-line no-unused-vars
import url from 'url';
import assign from 'lodash/assign';
import result from 'lodash/result';
import isString from 'lodash/isString';
import isObject from 'lodash/isObject';
import isEmpty from 'lodash/isEmpty';
const usersNamespace = process.env.KINVEY_USERS_NAMESPACE || 'user';
const rpcNamespace = process.env.KINVEY_RPC_NAMESPACE || 'rpc';
const idAttribute = process.env.KINVEY_ID_ATTRIBUTE || '_id';
const kmdAttribute = process.env.KINVEY_KMD_ATTRIBUTE || '_kmd';
const socialIdentityAttribute = process.env.KINVEY_SOCIAL_IDENTITY_ATTRIBUTE || '_socialIdentity';
const usernameAttribute = process.env.KINVEY_USERNAME_ATTRIBUTE || 'username';
const emailAttribute = process.env.KINVEY_EMAIL_ATTRIBUTE || 'email';

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
      user = new this(data);
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

    let credentials = username;
    if (!isObject(credentials)) {
      credentials = {
        username: username,
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
    const { data } = await request.execute();
    this.data = data;
    setActiveUser(this.client, this.data);
    return this;
  }

  /**
   * Login using a username or password.
   *
   * @param {string|Object} username Username or an object with username and password as properties.
   * @param {string} [password] Password
   * @param {Object} [options={}] Options
   * @return {Promise<User>} The user.
   */
  static login(username, password, options) {
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
  async loginWithMIC(redirectUri, authorizationGrant, options = {}) {
    const isActiveUser = this.isActive();
    if (isActiveUser) {
      return Promise.reject(new ActiveUserError('This user is already the active user.'));
    }

    const activeUser = User.getActiveUser(this.client);
    if (activeUser) {
      return Promise.reject(new ActiveUserError('An active user already exists. ' +
        'Please logout the active user before you login.'));
    }

    const mic = new MobileIdentityConnect({ client: this.client });
    const session = await mic.login(redirectUri, authorizationGrant, options);
    return this.connectIdentity(MobileIdentityConnect.identity, session, options);
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
    user.client = options.client || Client.sharedInstance();
    return user.loginWithMIC(redirectUri, authorizationGrant, options);
  }

  /**
   * Connect an social identity.
   *
   * @param {string} identity Social identity.
   * @param {Object} session Social identity session.
   * @param {Object} [options] Options
   * @return {Promise<User>} The user.
   */
  async connectIdentity(identity, session, options) {
    const data = this.data;
    const socialIdentity = data[socialIdentityAttribute] || {};
    socialIdentity[identity] = session;
    data[socialIdentityAttribute] = socialIdentity;
    this.data = data;

    try {
      const isActive = this.isActive();

      if (isActive) {
        return this.update(data, options);
      }

      await this.login(data, null, options);
      setIdentitySession(this.client, identity, session);
      return this;
    } catch (error) {
      if (error instanceof NotFoundError) {
        await this.signup(data, options);
        return this.connectIdentity(identity, session, options);
      }

      throw error;
    }
  }

  /**
   * Connect an social identity.
   *
   * @deprecated Use connectIdentity().
   *
   * @param {string} identity Social identity.
   * @param {Object} session Social identity session.
   * @param {Object} [options] Options
   * @return {Promise<User>} The user.
   */
  async connectWithIdentity(identity, session, options) {
    return this.connectIdentity(identity, session, options);
  }

  /**
   * Connect a Facebook identity.
   *
   * @param  {Object}         [options]     Options
   * @return {Promise<User>}                The user.
   */
  async connectFacebook(clientId, options) {
    const facebook = new Facebook({ client: this.client });
    const session = await facebook.login(clientId, options);
    return this.connectIdentity(Facebook.identity, session, options);
  }

  /**
   * Connect a Facebook identity.
   *
   * @param  {Object}         [options]     Options
   * @return {Promise<User>}                The user.
   */
  static connectFacebook(clientId, options) {
    const user = new this({}, options);
    return user.connectFacebook(clientId, options);
  }

  /**
   * Diconnect a Facebook identity.
   *
   * @param  {Object}         [options]     Options
   * @return {Promise<User>}                The user.
   */
  async disconnectFacebook(options) {
    return this.disconnectIdentity(Facebook.identity, options);
  }

  /**
   * Connect a Google identity.
   *
   * @param  {Object}         [options]     Options
   * @return {Promise<User>}                The user.
   */
  async connectGoogle(clientId, options) {
    const google = new Google({ client: this.client });
    const session = await google.login(clientId, options);
    return this.connectIdentity(Google.identity, session, options);
  }

  /**
   * Connect a Google identity.
   *
   * @param  {Object}         [options]     Options
   * @return {Promise<User>}                The user.
   */
  static connectGoogle(clientId, options) {
    const user = new this({}, options);
    return user.connectGoogle(clientId, options);
  }

  /**
   * Diconnect a Google identity.
   *
   * @param  {Object}         [options]     Options
   * @return {Promise<User>}                The user.
   */
  async disconnectGoogle(options) {
    return this.disconnectIdentity(Google.identity, options);
  }

  /**
   * Connect a LinkedIn identity.
   *
   * @param  {Object}         [options]     Options
   * @return {Promise<User>}                The user.
   */
  async connectLinkedIn(clientId, options) {
    const linkedIn = new LinkedIn({ client: this.client });
    const session = await linkedIn.login(clientId, options);
    return this.connectIdentity(LinkedIn.identity, session, options);
  }

  /**
   * Connect a LinkedIn identity.
   *
   * @param  {Object}         [options]     Options
   * @return {Promise<User>}                The user.
   */
  static connectLinkedIn(clientId, options) {
    const user = new this({}, options);
    return user.connectLinkedIn(clientId, options);
  }

  /**
   * Diconnect a LinkedIn identity.
   *
   * @param  {Object}         [options]     Options
   * @return {Promise<User>}                The user.
   */
  async disconnectLinkedIn(options) {
    return this.disconnectIdentity(LinkedIn.identity, options);
  }

  /**
   * @private
   * Disconnects the user from an identity.
   *
   * @param {SocialIdentity|string} identity Identity used to connect the user.
   * @param  {Object} [options] Options
   * @return {Promise<User>} The user.
   */
  async disconnectIdentity(identity, options) {
    try {
      if (identity === Facebook.identity) {
        await Facebook.logout(this, options);
      } else if (identity === Google.identity) {
        await Google.logout(this, options);
      } else if (identity === LinkedIn.identity) {
        await LinkedIn.logout(this, options);
      } else if (identity === MobileIdentityConnect.identity) {
        await MobileIdentityConnect.logout(this, options);
      }

      setIdentitySession(this.client, identity, null);
    } catch (error) {
      Log.error(error);
    }

    const data = this.data;
    const socialIdentity = data[socialIdentityAttribute] || {};
    delete socialIdentity[identity];
    data[socialIdentityAttribute] = socialIdentity;
    this.data = data;

    if (!this[idAttribute]) {
      return this;
    }

    await this.update(data, options);
    return this;
  }

  /**
   * Logout the active user.
   *
   * @param {Object} [options={}] Options
   * @return {Promise<User>} The user.
   */
  async logout(options = {}) {
    // Logout from Kinvey
    try {
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
      await request.execute();
    } catch (error) {
      Log.error(error);
    }

    // Disconnect from connected identities
    try {
      const identities = Object.keys(this._socialIdentity || {});
      const promises = identities.map(identity => this.disconnectIdentity(identity, options));
      await Promise.all(promises);
    } catch (error) {
      Log.error(error);
    }

    setActiveUser(this.client, null);
    await DataStore.clearCache({ client: this.client });
    return this;
  }

  /**
   * Logout the active user.
   *
   * @param {Object} [options={}] Options
   * @return {Promise<User>} The user.
   */
  static async logout(options = {}) {
    const user = User.getActiveUser(options.client);

    if (user) {
      return user.logout(options);
    }

    return null;
  }

  /**
   * Sign up a user with Kinvey.
   *
   * @param {?User|?Object} user Users data.
   * @param {Object} [options] Options
   * @param {boolean} [options.state=true] If set to true, the user will be set as the active user after successfully
   *                                       being signed up.
   * @return {Promise<User>} The user.
   */
  async signup(user, options = {}) {
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

    if (user instanceof User) {
      user = user.data;
    }

    const request = new KinveyRequest({
      method: RequestMethod.POST,
      authType: AuthType.App,
      url: url.format({
        protocol: this.client.protocol,
        host: this.client.host,
        pathname: this.pathname
      }),
      body: isEmpty(user) ? null : user,
      properties: options.properties,
      timeout: options.timeout,
      client: this.client
    });
    const response = await request.execute();
    this.data = response.data;

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
  async update(data, options) {
    data = assign(this.data, data);
    const userStore = new UserStore();
    await userStore.update(data, options);

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
    const request = new KinveyRequest({
      method: RequestMethod.GET,
      authType: AuthType.Session,
      url: url.format({
        protocol: this.client.protocol,
        host: this.client.host,
        pathname: `${this.pathname}/_me`
      }),
      properties: options.properties,
      timeout: options.timeout
    });
    const { data } = await request.execute();
    this.data = data;

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
    const request = new KinveyRequest({
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
    const request = new KinveyRequest({
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
    const request = new KinveyRequest({
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
    const store = new UserStore(options);
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
    const store = new UserStore(options);
    return store.restore(id, options);
  }
}
