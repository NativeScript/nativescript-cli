import Client from './client';
import Query from './query';
import { KinveyError, NotFoundError, ActiveUserError } from './errors';
import MobileIdentityConnect from './mic';
import { SocialIdentity, HttpMethod } from './enums';
import assign from 'lodash/assign';
import result from 'lodash/result';
import forEach from 'lodash/forEach';
import isObject from 'lodash/isObject';
const micAuthProvider = process.env.KINVEY_MIC_AUTH_PROVIDER || 'kinveyAuth';
const appdataNamespace = process.env.KINVEY_DATASTORE_NAMESPACE || 'appdata';
const usersNamespace = process.env.KINVEY_USERS_NAMESPACE || 'user';
const rpcNamespace = process.env.KINVEY_RPC_NAMESPACE || 'rpc';
const idAttribute = process.env.KINVEY_ID_ATTRIBUTE || '_id';
const kmdAttribute = process.env.KINVEY_KMD_ATTRIBUTE || '_kmd';
const socialIdentityAttribute = process.env.KINVEY_SOCIAL_IDENTITY_ATTRIBUTE || '_socialIdentity';
let hello;

if (typeof window !== 'undefined') {
  hello = require('hellojs');
}

export class User {
  constructor(data = {}) {
    /**
     * @type {Object}
     */
    this.data = data;

    /**
     * @private
     * @type {Client}
     */
    this.client = Client.sharedInstance();
  }

  get _id() {
    return this.data[idAttribute];
  }

  get authtoken() {
    const kmd = this.data[kmdAttribute] || {};
    return kmd.authtoken;
  }

  set authtoken(authtoken) {
    const kmd = this.data[kmdAttribute] || {};
    kmd.authtoken = authtoken;
    this.data[kmdAttribute] = kmd;
  }

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

  static setActiveUser(user, client = Client.sharedInstance()) {
    const data = result(user, 'data', user);
    return client.setActiveUser(data).then(() => {
      return User.getActiveUser();
    });
  }

  isActiveUser() {
    return this.client.getActiveUser().then(activeUser => {
      if (activeUser[idAttribute] === this._id) {
        return true;
      }

      return false;
    });
  }

  login(usernameOrData, password, options = {}) {
    if (!isObject(usernameOrData)) {
      usernameOrData = {
        username: usernameOrData,
        password: password
      };
    }
    usernameOrData.username = String(usernameOrData.username).trim();
    usernameOrData.password = String(usernameOrData.password).trim();

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

  loginWithMIC(redirectUri, authorizationGrant, options) {
    return MobileIdentityConnect.login(redirectUri, authorizationGrant, options).then(token => {
      return this.connect(token.access_token, token.expires_in, micAuthProvider, options);
    });
  }

  logout(options = {}) {
    return this.client.executeNetworkRequest({
      method: HttpMethod.POST,
      pathname: `/${usersNamespace}/${this.client.appKey}/_logout`,
      auth: this.client.sessionAuth(),
      properties: options.properties,
      timeout: options.timeout
    }).then(() => {
      return this.client.setActiveUser(null);
    }).catch(() => {
      return this.client.setActiveUser(null);
    }).then(() => {
      return this;
    });
  }

  isSocialIdentityConnectSupported() {
    return hello ? true : false;
  }

  connectWithFacebook(options) {
    return this.connectWithSocialIdentity(SocialIdentity.Facebook, options);
  }

  connectWithGoogle(options) {
    return this.connectWithSocialIdentity(SocialIdentity.Google, options);
  }

  connectWithLinkedIn(options) {
    return this.connectWithSocialIdentity(SocialIdentity.LinkedIn, options);
  }

  connectWithSocialIdentity(identity, options = {}) {
    if (this.isSocialIdentityConnectSupported()) {
      return Promise.reject(new KinveyError(`Unable to connect to social identity ${identity} on this platform.`));
    }

    options = assign({
      collectionName: 'SocialIdentities',
      handler() {}
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

      throw new KinveyError('Unsupported social identity');
    }).then(() => {
      const authResponse = hello(identity).getAuthResponse();
      return this.connect(authResponse.access_token, authResponse.expires_in, identity, options);
    });

    return promise;
  }

  connect(accessToken, expiresIn, identity, options = {}) {
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
          return this.connect(accessToken, expiresIn, identity, options);
        });
      }
    });

    return promise;
  }

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
        data: data,
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
}
