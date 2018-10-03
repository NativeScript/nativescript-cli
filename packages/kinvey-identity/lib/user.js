"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getActiveUser = getActiveUser;
exports.signup = signup;
exports.login = login;
exports.loginWithMIC = loginWithMIC;
exports.logout = logout;
exports.me = me;
exports.update = update;
exports.remove = remove;
exports.verifyEmail = verifyEmail;
exports.forgotUsername = forgotUsername;
exports.resetPassword = resetPassword;
exports.lookup = lookup;
exports.exists = exists;

var _isPlainObject = _interopRequireDefault(require("lodash/isPlainObject"));

var _isString = _interopRequireDefault(require("lodash/isString"));

var _isArray = _interopRequireDefault(require("lodash/isArray"));

var _isEmpty = _interopRequireDefault(require("lodash/isEmpty"));

var _kinveyDatastore = require("kinvey-datastore");

var _kinveyAcl = require("kinvey-acl");

var _kinveyKmd = require("kinvey-kmd");

var _kinveyHttp = require("kinvey-http");

var MIC = _interopRequireWildcard(require("./mic"));

const USER_NAMESPACE = 'user';
const RPC_NAMESPACE = 'rpc';

class User {
  constructor(data = {}) {
    this.data = data;
  }

  get _id() {
    if (this.data) {
      return this.data._id;
    }

    return undefined;
  }

  get _acl() {
    if (this.data) {
      return new _kinveyAcl.Acl(this.data._acl);
    }

    return undefined;
  }

  get _kmd() {
    if (this.data) {
      return new _kinveyKmd.Kmd(this.data._kmd);
    }

    return undefined;
  }

  get metadata() {
    return this._kmd;
  }

  get username() {
    if (this.data) {
      return this.data.username;
    }

    return undefined;
  }

  get email() {
    if (this.data) {
      return this.data.email;
    }

    return undefined;
  }

  isActive() {
    const activeUser = (0, _kinveyHttp.getSession)();

    if (activeUser && activeUser._id === this._id) {
      return true;
    }

    return false;
  }

  isEmailVerified() {
    const metadata = this.metadata;

    if (metadata) {
      const status = metadata.emailVerification;
      return status === 'confirmed';
    }

    return false;
  }

  async me() {
    const request = new _kinveyHttp.KinveyRequest({
      method: _kinveyHttp.RequestMethod.GET,
      auth: _kinveyHttp.Auth.Session,
      url: (0, _kinveyHttp.formatKinveyBaasUrl)(`/${USER_NAMESPACE}/appKey/_me`)
    });
    const response = await (0, _kinveyHttp.execute)(request);
    const data = response.data;
    delete data.password; // Remove sensitive data

    this.data = data;

    if (this.isActive()) {
      (0, _kinveyHttp.setSession)(this.data);
    }

    return this;
  }

  async update(data) {
    const request = new _kinveyHttp.KinveyRequest({
      method: _kinveyHttp.RequestMethod.PUT,
      auth: _kinveyHttp.Auth.Default,
      url: (0, _kinveyHttp.formatKinveyBaasUrl)(`/${USER_NAMESPACE}/appKey/${this._id}`),
      body: Object.assign(this.data, data)
    });
    const response = await (0, _kinveyHttp.execute)(request);
    this.data = response.data;

    if (this.isActive()) {
      (0, _kinveyHttp.setSession)(this.data);
    }

    return this;
  }

}

function getActiveUser() {
  const session = (0, _kinveyHttp.getSession)();

  if (session) {
    return new User(session);
  }

  return null;
}

async function signup(data, options = {}) {
  const activeUser = (0, _kinveyHttp.getSession)();
  const _options$state = options.state,
        state = _options$state === void 0 ? true : _options$state;

  if (state === true && activeUser) {
    throw new Error('An active user already exists. Please logout the active user before you signup.');
  }

  const url = (0, _kinveyHttp.formatKinveyBaasUrl)(`/${USER_NAMESPACE}/appKey`);
  const request = new _kinveyHttp.KinveyRequest({
    method: _kinveyHttp.RequestMethod.POST,
    auth: _kinveyHttp.Auth.App,
    url,
    body: (0, _isEmpty.default)(data) ? null : data
  });
  const response = await (0, _kinveyHttp.execute)(request);
  const userData = response.data;

  if (state === true) {
    (0, _kinveyHttp.setSession)(userData);
  }

  return new User(userData);
}

async function login(username, password) {
  const activeUser = getActiveUser();
  let credentials = username;

  if (activeUser) {
    throw new Error('An active user already exists. Please logout the active user before you login.');
  }

  if (!(0, _isPlainObject.default)(credentials)) {
    credentials = {
      username,
      password
    };
  }

  if (credentials.username) {
    credentials.username = String(credentials.username).trim();
  }

  if (credentials.password) {
    credentials.password = String(credentials.password).trim();
  }

  if ((!credentials.username || credentials.username === '' || !credentials.password || credentials.password === '') && !credentials._socialIdentity) {
    throw new Error('Username and/or password missing. Please provide both a username and password to login.');
  }

  const request = new _kinveyHttp.KinveyRequest({
    method: _kinveyHttp.RequestMethod.POST,
    auth: _kinveyHttp.Auth.App,
    url: (0, _kinveyHttp.formatKinveyBaasUrl)(`/${USER_NAMESPACE}/appKey/login`),
    body: credentials
  });
  const response = await (0, _kinveyHttp.execute)(request);
  const userData = response.data;
  (0, _kinveyHttp.setSession)(userData);
  return new User(userData);
}

async function loginWithMIC(redirectUri, authorizationGrant, options) {
  const activeUser = getActiveUser();

  if (activeUser) {
    throw new Error('An active user already exists. Please logout the active user before you login with Mobile Identity Connect.');
  }

  const session = await MIC.login(redirectUri, authorizationGrant, options);
  const socialIdentity = {};
  socialIdentity[MIC.IDENTITY] = session;
  const credentials = {
    _socialIdentity: socialIdentity
  };

  try {
    return await User.login(credentials);
  } catch (error) {
    if (error.name === 'NotFoundError') {
      return await User.signup(credentials);
    }

    throw error;
  }
}

async function logout() {
  const activeUser = getActiveUser();

  if (activeUser) {
    // TODO: unregister from live service and push
    const url = (0, _kinveyHttp.formatKinveyBaasUrl)(`/${USER_NAMESPACE}/appKey/_logout`);
    const request = new _kinveyHttp.KinveyRequest({
      method: _kinveyHttp.RequestMethod.POST,
      auth: _kinveyHttp.Auth.Session,
      url
    });

    try {
      await (0, _kinveyHttp.execute)(request);
    } catch (error) {// TODO: log error
    }

    (0, _kinveyHttp.removeSession)();
    await (0, _kinveyDatastore.clearCache)();
    return activeUser;
  }

  return null;
}

async function me() {
  const activeUser = getActiveUser();

  if (activeUser) {
    return activeUser.me();
  }

  return null;
}

async function update(data) {
  const activeUser = getActiveUser();

  if ((0, _isArray.default)(data)) {
    throw new Error('Only one user can be updated at one time.');
  }

  if (activeUser) {
    return activeUser.update(data);
  }

  return null;
}

async function remove(id, options = {}) {
  const _options$hard = options.hard,
        hard = _options$hard === void 0 ? false : _options$hard;

  if (!id) {
    throw new Error('An id was not provided.');
  }

  if (!(0, _isString.default)(id)) {
    throw new Error('The id provided is not a string.');
  }

  const url = (0, _kinveyHttp.formatKinveyBaasUrl)(`/user/appKey/${id}`, {
    hard
  });
  const request = new _kinveyHttp.KinveyRequest({
    method: _kinveyHttp.RequestMethod.DELETE,
    auth: _kinveyHttp.Auth.Default,
    url
  });
  const response = await (0, _kinveyHttp.execute)(request);
  (0, _kinveyHttp.removeSession)();
  return response.data;
}

async function verifyEmail(username) {
  if (!username) {
    throw new Error('A username was not provided.');
  }

  if (!(0, _isString.default)(username)) {
    throw new Error('The provided username is not a string.');
  }

  const request = new _kinveyHttp.KinveyRequest({
    method: _kinveyHttp.RequestMethod.POST,
    auth: _kinveyHttp.Auth.App,
    url: (0, _kinveyHttp.formatKinveyBaasUrl)(`/${RPC_NAMESPACE}/appKey/${username}/user-email-verification-initiate`)
  });
  const response = await (0, _kinveyHttp.execute)(request);
  return response.data;
}

async function forgotUsername(email) {
  if (!email) {
    throw new Error('An email was not provided.');
  }

  if (!(0, _isString.default)(email)) {
    throw new Error('The provided email is not a string.');
  }

  const request = new _kinveyHttp.KinveyRequest({
    method: _kinveyHttp.RequestMethod.POST,
    auth: _kinveyHttp.Auth.App,
    url: (0, _kinveyHttp.formatKinveyBaasUrl)(`/${RPC_NAMESPACE}/appKey/user-forgot-username`),
    body: {
      email
    }
  });
  const response = await (0, _kinveyHttp.execute)(request);
  return response.data;
}

async function resetPassword(username) {
  if (!username) {
    throw new Error('A username was not provided.');
  }

  if (!(0, _isString.default)(username)) {
    throw new Error('The provided username is not a string.');
  }

  const request = new _kinveyHttp.KinveyRequest({
    method: _kinveyHttp.RequestMethod.POST,
    auth: _kinveyHttp.Auth.App,
    url: (0, _kinveyHttp.formatKinveyBaasUrl)(`/${RPC_NAMESPACE}/appKey/${username}/user-password-reset-initiate`)
  });
  const response = await (0, _kinveyHttp.execute)(request);
  return response.data;
}

async function lookup(query) {
  const request = new _kinveyHttp.KinveyRequest({
    method: _kinveyHttp.RequestMethod.POST,
    auth: _kinveyHttp.Auth.Default,
    url: (0, _kinveyHttp.formatKinveyBaasUrl)(`/${USER_NAMESPACE}/appKey/_lookup`),
    body: query ? query.filter : undefined
  });
  const response = await (0, _kinveyHttp.execute)(request);
  return response.data;
}

async function exists(username) {
  if (!username) {
    throw new Error('A username was not provided.');
  }

  if (!(0, _isString.default)(username)) {
    throw new Error('The provided username is not a string.');
  }

  const request = new _kinveyHttp.KinveyRequest({
    method: _kinveyHttp.RequestMethod.POST,
    auth: _kinveyHttp.Auth.App,
    url: (0, _kinveyHttp.formatKinveyBaasUrl)(`/${RPC_NAMESPACE}/appKey/check-username-exists`),
    body: {
      username
    }
  });
  const response = await (0, _kinveyHttp.execute)(request);
  return response.data.usernameExists === true;
}