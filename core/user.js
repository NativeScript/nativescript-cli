import Client from './client';
import Query from './query';
import Acl from './acl';
import Metadata from './metadata';
import { KinveyError, NotFoundError, ActiveUserError } from './errors';
import MobileIdentityConnect from './mic';
import { SocialIdentity, HttpMethod } from './enums';
import assign from 'lodash/assign';
import result from 'lodash/result';
import clone from 'lodash/clone';
import forEach from 'lodash/forEach';
import isObject from 'lodash/isObject';
const appdataNamespace = process.env.KINVEY_DATASTORE_NAMESPACE || 'appdata';
const usersNamespace = process.env.KINVEY_USERS_NAMESPACE || 'user';
const rpcNamespace = process.env.KINVEY_RPC_NAMESPACE || 'rpc';
const idAttribute = process.env.KINVEY_ID_ATTRIBUTE || '_id';
const kmdAttribute = process.env.KINVEY_KMD_ATTRIBUTE || '_kmd';
const socialIdentityAttribute = process.env.KINVEY_SOCIAL_IDENTITY_ATTRIBUTE || '_socialIdentity';
const usernameAttribute = process.env.KINVEY_USERNAME_ATTRIBUTE || 'username';
const emailAttribute = process.env.KINVEY_EMAIL_ATTRIBUTE || 'email';
let hello;

if (typeof window !== 'undefined') {
  hello = require('hellojs');
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
    const kmd = this._kmd;
    kmd.authtoken = authtoken;
    this.data[kmdAttribute] = kmd.toJSON();
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
    return client.getActiveUser().then(data => {
      let user = null;

      if (data) {
        user = new User(data);
        user.client = client;
      }

      return user;
    });
  }

  /**
   * Sets the active user. You can optionally provide a client to
   * set the active user on. Only one active user per client is
   * allowed.
   *
   * @param  {?(User|Object)}      [user]                               User to set as the active user.
   * @param  {Client}              [client=Client.sharedInstance()]     The client to use to set the active user on.
   * @return {Promise<User>}                                            The active user on the client. The active user
   *                                                                    could be null if one does not exist.
   *
   * @example
   * var user = new User();
   * var promise = User.setActiveUser(user);
   * promise.then(function(activeUser) {
   *   ...
   * }).catch(function(error) {
   *   ...
   * });
   */
  static setActiveUser(user, client = Client.sharedInstance()) {
    const data = result(user, 'toJSON', user);
    return client.setActiveUser(data).then(() => {
      return User.getActiveUser();
    });
  }

  /**
   * Set this user as the active user.
   *
   * @return {Promise<User>}  The active user.
   *
   * @example
   * var promise = user.setAsActiveUser();
   * promise.then(function(activeUser) {
   *   ...
   * }).catch(function(error) {
   *   ...
   * });
   */
  setAsActiveUser() {
    return User.setActiveUser(this, this.client);
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
  isActiveUser() {
    return this.client.getActiveUser().then(activeUser => {
      if (activeUser && activeUser[idAttribute] === this._id) {
        return true;
      }

      return false;
    });
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

    if (!usernameOrData._socialIdentity) {
      if (usernameOrData.username) {
        usernameOrData.username = String(usernameOrData.username).trim();
      }

      if (usernameOrData.password) {
        usernameOrData.password = String(usernameOrData.password).trim();
      }
    }

    const promise = this.isActiveUser().then(isActiveUser => {
      if (isActiveUser) {
        throw new ActiveUserError('This user is already the active user.');
      }

      return this.client.getActiveUser();
    }).then(activeUser => {
      if (activeUser) {
        throw new ActiveUserError('An active user already exists. ' +
          'Please call logout the active user before you login.');
      }

      const { username, password, _socialIdentity } = usernameOrData;

      if ((!username || username === '' || !password || password === '') && !_socialIdentity) {
        throw new KinveyError('Username and/or password missing. ' +
          'Please provide both a username and password to login.');
      }

      return this.client.executeNetworkRequest({
        method: HttpMethod.POST,
        pathname: `/${usersNamespace}/${this.client.appKey}/login`,
        data: usernameOrData,
        auth: this.client.appAuth(),
        properties: options.properties,
        timeout: options.timeout
      });
    }).then(response => {
      return this.client.setActiveUser(response.data).then(() => {
        this.data = response.data;
        return this;
      });
    });

    return promise;
  }

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
  loginWithMIC(redirectUri, authorizationGrant, options = {}) {
    return MobileIdentityConnect.login(redirectUri, authorizationGrant, options).then(token => {
      return this.connect(MobileIdentityConnect.identity, token.access_token, token.expires_in, options);
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
    return this.client.executeNetworkRequest({
      method: HttpMethod.POST,
      pathname: `/${usersNamespace}/${this.client.appKey}/_logout`,
      auth: this.client.sessionAuth(),
      properties: options.properties,
      timeout: options.timeout
    }).then(() => {
      return this.isActiveUser();
    }).catch(() => {
      return this.isActiveUser();
    }).then(isActiveUser => {
      if (isActiveUser) {
        return this.client.setActiveUser(null);
      }
    }).then(() => {
      return this;
    });
  }

  /**
   * @private
   * Returns true or false if identity connect is supported.
   *
   * @return {Boolean}  True or false if identity connect is supported.
   *
   * @example
   * var isIdentityConnectSupported = user.isIdentityConnectSupported();
   */
  isIdentityConnectSupported() {
    return hello ? true : false;
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
  connectWithFacebook(options = {}) {
    return this.connectWithIdentity(SocialIdentity.Facebook, options);
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
  connectWithGoogle(options = {}) {
    return this.connectWithIdentity(SocialIdentity.Google, options);
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
  connectWithLinkedIn(options = {}) {
    return this.connectWithIdentity(SocialIdentity.LinkedIn, options);
  }

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
  connectWithIdentity(identity, options = {}) {
    if (!identity) {
      return Promise.reject(new KinveyError('An identity is required to connect the user.'));
    }

    if (this.isIdentityConnectSupported()) {
      return Promise.reject(new KinveyError(`Unable to connect to identity ${identity} on this platform.`));
    }

    options = assign({
      collectionName: 'Identities'
    }, options);

    const promise = Promise.resolve().then(() => {
      const query = new Query().equalTo('identity', identity);
      return this.client.executeNetworkRequest({
        method: HttpMethod.GET,
        pathname: `/${appdataNamespace}/${this.client.appKey}/${options.collectionName}`,
        auth: this.client.defaultAuth(),
        query: query,
        properties: options.properties,
        timeout: options.timeout
      });
    }).then(response => {
      if (response.data.length === 1) {
        const helloSettings = {};
        helloSettings[identity] = response.data[0].key || response.data[0].appId || response.data[0].clientId;
        hello.init(helloSettings);
        return hello(identity).login();
      }

      throw new KinveyError('Unsupported identity.');
    }).then(() => {
      const authResponse = hello(identity).getAuthResponse();
      return this.connect(identity, authResponse.access_token, authResponse.expires_in, options);
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
   * var promise = user.connect(SocialIdentity.Facebook, 'facebook-access-token');
   * promise.then(function(user) {
   *   ...
   * }).catch(function(error) {
   *   ...
   * });
   */
  connect(identity, accessToken, expiresIn, options = {}) {
    options = assign({
      create: true
    }, options);

    const user = {};
    user[socialIdentityAttribute] = {};
    user[socialIdentityAttribute][identity] = {
      access_token: accessToken,
      expires_in: expiresIn
    };

    const promise = this.client.getActiveUser().then(activeUser => {
      if (activeUser) {
        activeUser[socialIdentityAttribute] = user[socialIdentityAttribute];
        options._identity = identity;
        return this.update(activeUser, options);
      }

      return this.login(user, null, options);
    }).catch(err => {
      if (options.create && err instanceof NotFoundError) {
        return this.signup(user, options).then(() => {
          return this.connect(identity, accessToken, expiresIn, options);
        });
      }
    });

    return promise;
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

    const promise = Promise.resolve().then(() => {
      if (options.state === true) {
        return this.client.getActiveUser().then(activeUser => {
          if (activeUser) {
            throw new ActiveUserError('An active user already exists. ' +
              'Please call logout the active user before you login.');
          }
        });
      }
    }).then(() => {
      return this.client.executeNetworkRequest({
        method: HttpMethod.POST,
        pathname: `/${usersNamespace}/${this.client.appKey}`,
        auth: this.client.appAuth(),
        data: result(data, 'toJSON', data),
        properties: options.properties,
        timeout: options.timeout
      });
    }).then(response => {
      this.data = response.data;

      if (options.state === true) {
        return this.client.setActiveUser(this.data).then(() => {
          return this;
        });
      }

      return this;
    });

    return promise;
  }

  update(data, options = {}) {
    const tokens = [];

    const promise = Promise.resolve().then(() => {
      if (!data[idAttribute]) {
        throw new KinveyError('data argument must contain an _id');
      }

      if (data[socialIdentityAttribute]) {
        for (const identity in data[socialIdentityAttribute]) {
          if (data[socialIdentityAttribute].hasOwnProperty(identity)) {
            if (data[socialIdentityAttribute][identity] && options._identity !== identity) {
              tokens.push({
                identity: identity,
                access_token: data[socialIdentityAttribute][identity].access_token,
                access_token_secret: data[socialIdentityAttribute][identity].access_token_secret
              });
              delete data[socialIdentityAttribute][identity].access_token;
              delete data[socialIdentityAttribute][identity].access_token_secret;
            }
          }
        }
      }

      return this.client.executeNetworkRequest({
        method: HttpMethod.PUT,
        pathname: `/${usersNamespace}/${this.client.appKey}/${data[idAttribute]}`,
        auth: this.client.sessionAuth(),
        data: data,
        properties: options.properties,
        timeout: options.timeout
      });
    }).then(response => {
      const data = response.data;

      forEach(tokens, token => {
        const identity = token.identity;

        if (data[socialIdentityAttribute] && data[socialIdentityAttribute][identity]) {
          data[socialIdentityAttribute][identity].access_token = token.access_token;
          data[socialIdentityAttribute][identity].access_token_secret = token.access_token_secret;
        }
      });

      return this.client.getActiveUser().then(activeUser => {
        this.data = data;

        if (activeUser && data[idAttribute] === activeUser[idAttribute]) {
          return this.client.setActiveUser(data).then(() => {
            return this;
          });
        }

        return this;
      });
    });

    return promise;
  }

  me(options) {
    const promise = Promise.resolve().then(() => {
      return this.client.executeNetworkRequest({
        method: HttpMethod.GET,
        pathname: `/${usersNamespace}/${this.client.appKey}/_me`,
        auth: this.client.sessionAuth(),
        properties: options.properties,
        timeout: options.timeout
      });
    }).then(response => {
      this.data = response.data;

      if (!this.authtoken) {
        return this.client.getActiveUser().then(activeUser => {
          if (activeUser) {
            this.authtoken = activeUser[kmdAttribute].authtoken;
          }

          return this;
        });
      }

      return this;
    }).then(() => {
      return this.client.setActiveUser(this.data);
    }).then(() => {
      return this;
    });

    return promise;
  }

  verifyEmail(username, options) {
    const promise = this.client.executeNetworkRequest({
      method: HttpMethod.POST,
      pathname: `/${rpcNamespace}/${this.client.appKey}/${username}/user-email-verification-initiate`,
      auth: this.client.appAuth(),
      properties: options.properties,
      timeout: options.timeout
    });
    return promise;
  }

  forgotUsername(email, options) {
    const promise = this.client.executeNetworkRequest({
      method: HttpMethod.POST,
      pathname: `/${rpcNamespace}/${this.client.appKey}/user-forgot-username`,
      auth: this.client.appAuth(),
      data: { email: email },
      properties: options.properties,
      timeout: options.timeout
    });
    return promise;
  }

  resetPassword(username, options) {
    const promise = this.client.executeNetworkRequest({
      method: HttpMethod.POST,
      pathname: `/${rpcNamespace}/${this.client.appKey}/${username}/user-password-reset-initiate`,
      auth: this.client.appAuth(),
      properties: options.properties,
      timeout: options.timeout
    });
    return promise;
  }

  toJSON() {
    return clone(this.data, true);
  }
}
