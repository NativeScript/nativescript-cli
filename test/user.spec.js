import './setup';
import { User, UserStore } from '../src/user';
import { Acl } from '../src/acl';
import { Metadata } from '../src/metadata';
import { ActiveUserError, KinveyError } from '../src/errors';
import { MobileIdentityConnect, SocialIdentity, AuthorizationGrant } from '../src/social';
import { randomString } from '../src/utils/string';
import nock from 'nock';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import sinonChai from 'sinon-chai';
chai.use(chaiAsPromised);
chai.use(sinonChai);
const expect = chai.expect;
const appdataNamespace = process.env.KINVEY_DATASTORE_NAMESPACE || 'appdata';
const rpcNamespace = process.env.KINVEY_RPC_NAMESPACE || 'rpc';

describe('UserStore', function() {
  before(function() {
    this.store = new UserStore();
  });

  after(function() {
    delete this.store;
  });

  beforeEach(function() {
    return this.login();
  });

  afterEach(function() {
    return this.logout();
  });

  describe('constructor', function() {
    it('should create a user store');
  });

  describe('update()', function() {
    it('should update a user');
  });

  describe('exists()', function() {
    it('should return true that the username exists', function() {
      nock(this.client.baseUrl)
        .post(`/${rpcNamespace}/${this.store.client.appKey}/check-username-exists`)
        .query(true)
        .reply(200, { usernameExists: true }, {
          'content-type': 'application/json'
        });

      return this.store.exists('admin').then(exists => {
        expect(exists).to.be.true;
      });
    });

    it('should return false that the username exists', function() {
      nock(this.client.baseUrl)
        .post(`/${rpcNamespace}/${this.store.client.appKey}/check-username-exists`)
        .query(true)
        .reply(200, { usernameExists: false }, {
          'content-type': 'application/json'
        });

      return this.store.exists('admin').then(exists => {
        expect(exists).to.be.false;
      });
    });

    it('should return false that the username exists', function() {
      nock(this.client.baseUrl)
        .post(`/${rpcNamespace}/${this.store.client.appKey}/check-username-exists`)
        .query(true)
        .reply(200, { usernameExists: 'yes' }, {
          'content-type': 'application/json'
        });

      return this.store.exists('admin').then(exists => {
        expect(exists).to.be.false;
      });
    });
  });
});

describe('User', function () {
  it('should create a new user', function() {
    const user = new User();
    expect(user).to.be.instanceof(User);
  });

  it('should create a new user with data', function() {
    const data = { name: 'foo' };
    const user = new User(data);
    expect(user.data).to.deep.equal(data);
  });

  describe('_id', function() {
    before(function() {
      this._id = randomString();
      this.user = new User({
        _id: this._id
      });
    });

    after(function() {
      delete this._id;
      delete this.user;
    });

    it('should be a property', function() {
      expect(this.user).to.have.property('_id', this._id);
    });
  });

  describe('_acl', function() {
    before(function() {
      this.user = new User();
    });

    after(function() {
      delete this.user;
    });

    it('should be a property', function() {
      expect(this.user).to.have.property('_acl');
      expect(this.user._acl).to.be.instanceof(Acl);
    });
  });

  describe('metadata', function() {
    before(function() {
      this.user = new User();
    });

    after(function() {
      delete this.user;
    });

    it('should be a property', function() {
      expect(this.user).to.have.property('metadata');
      expect(this.user).to.have.property('_kmd');
      expect(this.user.metadata).to.be.instanceof(Metadata);
      expect(this.user._kmd).to.be.instanceof(Metadata);
    });
  });

  describe('authtoken', function() {
    before(function() {
      this.authtoken = randomString();
      this.user = new User({
        _kmd: {
          authtoken: this.authtoken
        }
      });
    });

    after(function() {
      delete this.authtoken;
      delete this.user;
    });

    it('should be a property', function() {
      expect(this.user).to.have.property('authtoken', this.authtoken);
    });
  });

  describe('username', function() {
    before(function() {
      this.username = randomString();
      this.user = new User({
        username: this.username
      });
    });

    after(function() {
      delete this.username;
      delete this.user;
    });

    it('should be a property', function() {
      expect(this.user).to.have.property('username', this.username);
    });
  });

  describe('email', function() {
    before(function() {
      this.email = randomString();
      this.user = new User({
        email: this.email
      });
    });

    after(function() {
      delete this.email;
      delete this.user;
    });

    it('should be a property', function() {
      expect(this.user).to.have.property('email', this.email);
    });
  });

  describe('getActiveUser', function() {
    before(function() {
      return this.login();
    });

    after(function() {
      return this.logout();
    });

    it('should be a static method', function() {
      expect(User).itself.to.respondTo('getActiveUser');
    });

    it('should return null when there is not an active user', async function() {
      await this.logout();
      const user = User.getActiveUser();
      expect(user).to.be.null;
    });

    it('should return the active user', function() {
      const user = new User();
      nock(this.client.baseUrl)
        .post(`${user.pathname}/login`, () => true)
        .query(true)
        .reply(200, {
          _id: randomString(),
          _kmd: {
            authtoken: randomString()
          }
        }, {
          'content-type': 'application/json'
        });
      return user.login('foo', 'foo').then(() => {
        const activeUser = User.getActiveUser();
        expect(activeUser).to.deep.equal(user);
      });
    });
  });

  describe('isActive', function() {
    after(function() {
      return this.logout();
    });

    it('should be a method', function() {
      expect(User).to.respondTo('isActive');
    });

    it('should return false if the user is not the active user', function() {
      const user = new User();
      const isActive = user.isActive();
      expect(isActive).to.to.be.false;
    });

    it('should return true if the user is the active user', function() {
      return this.login().then(user => {
        const isActive = user.isActive();
        expect(isActive).to.be.true;
      });
    });
  });

  describe('isEmailVerified', function() {
    it('should return false if the users email is not verified', function() {
      const user = new User({
        _kmd: {
          emailVerification: {
            status: 'sent'
          }
        }
      });
      const status = user.isEmailVerified();
      return expect(status).to.to.be.false;
    });

    it('should return true if the users email is verified', function() {
      const user = new User({
        _kmd: {
          emailVerification: {
            status: 'confirmed'
          }
        }
      });
      const status = user.isEmailVerified();
      expect(status).to.to.be.true;
    });
  });

  describe('login()', function() {
    afterEach(function() {
      return this.logout();
    });

    it('should be a static method', function() {
      expect(User).itself.to.respondTo('login');
    });

    it('should be a method', function() {
      expect(User).to.respondTo('login');
    });

    it('should forward to the login instance method', function() {
      const stub = this.sandbox.stub(User.prototype, 'login', function() {
        return Promise.resolve();
      });
      return User.login({
        username: randomString(),
        password: randomString()
      }).then(() => {
        expect(stub).to.have.been.called.once;
      });
    });

    it('should throw an error if the user is already active', function() {
      return this.login().then(user => {
        const promise = user.login({
          username: randomString(),
          password: randomString()
        });
        return expect(promise).to.be.rejectedWith(ActiveUserError);
      });
    });

    it('should throw an error if an active user already exists', function() {
      return this.login().then(() => {
        const promise = User.login({
          username: randomString(),
          password: randomString()
        });
        return expect(promise).to.be.rejectedWith(ActiveUserError);
      });
    });

    it('should throw an error if a username is not provided', function() {
      const promise = User.login({
        password: randomString()
      });
      return expect(promise).to.be.rejectedWith(KinveyError);
    });

    it('should throw an error if the username is an empty string', function() {
      const promise = User.login({
        username: ' ',
        password: randomString()
      });
      return expect(promise).to.be.rejectedWith(KinveyError);
    });

    it('should throw an error if a password is not provided', function() {
      const promise = User.login({
        password: randomString()
      });
      return expect(promise).to.be.rejectedWith(KinveyError);
    });

    it('should throw an error if the password is an empty string', function() {
      const promise = User.login({
        username: randomString(),
        password: ' '
      });
      return expect(promise).to.be.rejectedWith(KinveyError);
    });

    it('should login a user', function() {
      const user = new User();
      const username = randomString();
      const reply = {
        _id: randomString(),
        _kmd: {
          lmt: new Date().toISOString(),
          ect: new Date().toISOString(),
          authtoken: randomString()
        },
        username: username,
        _acl: {
          creator: randomString()
        }
      };
      nock(this.client.baseUrl)
        .post(`${user.pathname}/login`)
        .query(true)
        .reply(200, reply, {
          'content-type': 'application/json'
        });

      return user.login({
        username: username,
        password: randomString()
      }).then(user => {
        expect(user._id).to.equal(reply._id);
        expect(user.authtoken).to.equal(reply._kmd.authtoken);
        expect(user.username).to.equal(reply.username);
        expect(user.isActive()).to.be.true;
      });
    });
  });

  describe('loginWithMIC', function() {
    afterEach(function() {
      return this.logout();
    });

    it('should be a static method', function() {
      expect(User).itself.to.respondTo('loginWithMIC');
    });

    it('should be a method', function() {
      expect(User).to.respondTo('loginWithMIC');
    });

    it('should forward to the loginWithMIC instance method', function() {
      const stub = this.sandbox.stub(User.prototype, 'loginWithMIC', function() {
        return Promise.resolve();
      });
      return User.loginWithMIC(randomString(), AuthorizationGrant.AuthorizationCodeLoginPage).then(() => {
        expect(stub).to.have.been.called.once;
      });
    });

    it('should call login on the MobileIdentityConnect module and then connect on the user', function() {
      const stub = this.sandbox.stub(MobileIdentityConnect.prototype, 'login', function() {
        return Promise.resolve({});
      });
      const connectIdentityStub = this.sandbox.stub(User.prototype, 'connectIdentity', function() {
        return Promise.resolve();
      });
      return User.loginWithMIC(randomString(), AuthorizationGrant.AuthorizationCodeLoginPage).then(() => {
        expect(stub).to.have.been.called.once;
        expect(connectIdentityStub).to.have.been.called.once;
      });
    });
  });

  describe('logout', function() {
    beforeEach(function() {
      return this.login().then(user => {
        this.user = user;
      });
    });

    afterEach(function() {
      return this.logout().then(() => {
        delete this.user;
      });
    });

    it('should be a method', function() {
      expect(User).to.respondTo('logout');
    });

    it('should logout a user when the user is not the active user', function() {
      return this.logout().then(() => {
        const promise = this.user.logout();
        return expect(promise).to.be.fulfilled;
      });
    });

    it('should logout a user when the user is the active user', function() {
      nock(this.client.baseUrl)
        .post(`${this.user.pathname}/_logout`)
        .query(true)
        .reply(204, null, {
          'content-type': 'application/json'
        });

      const promise = this.user.logout();
      return expect(promise).to.be.fulfilled;
    });

    it('should logout a user when the REST API rejects the logout request', function() {
      nock(this.client.baseUrl)
        .post(`${this.user.pathname}/_logout`)
        .query(true)
        .reply(500, null, {
          'content-type': 'application/json'
        });

      const promise = this.user.logout();
      return expect(promise).to.be.fulfilled;
    });
  });

  describe('update()', function() {
    beforeEach(function() {
      return this.login().then(user => {
        this.user = user;
      });
    });

    afterEach(function() {
      return this.logout().then(() => {
        delete this.user;
      });
    });

    it('should update a user', function() {
      const age = 1;

      // Kinvey API response
      nock(this.client.apiHostname)
        .put(`${this.user.pathname}/${this.user._id}`, {
          _id: this.user._id,
          _kmd: this.user.data._kmd,
          age: age
        })
        .query(true)
        .reply(200, {
          _id: this.user._id,
          _kmd: this.user.data._kmd,
          age: age
        }, {
          'content-type': 'application/json'
        });

      return this.user.update({
        age: age
      }).then(user => {
        expect(user.data).to.have.property('age', age);
      });
    });
  });

  describe('connectFacebook()', function() {
    it('should be a static method', function() {
      expect(User).itself.to.respondTo('connectFacebook');
    });

    // it('should call User.prototype.connect()', function() {
    //   const user = new User();
    //   const stub = this.sandbox.stub(user, 'connect', function() {
    //     return Promise.resolve();
    //   });
    //   return user.loginWithFacebook().then(() => {
    //     expect(stub).to.have.been.called.once;
    //   });
    // });
  });

  describe('connectGoogle()', function() {
    it('should be a static method', function() {
      expect(User).itself.to.respondTo('connectGoogle');
    });

    // it('should call User.prototype.connect()', function() {
    //   const user = new User();
    //   const stub = this.sandbox.stub(user, 'connect', function() {
    //     return Promise.resolve();
    //   });
    //   return user.loginWithGoogle().then(() => {
    //     expect(stub).to.have.been.called.once;
    //   });
    // });
  });

  describe('connectLinkedIn()', function() {
    it('should be a static method', function() {
      expect(User).itself.to.respondTo('connectLinkedIn');
    });

    // it('should call User.prototype.connect()', function() {
    //   const user = new User();
    //   const stub = this.sandbox.stub(user, 'connect', function() {
    //     return Promise.resolve();
    //   });
    //   return user.loginWithLinkedIn().then(() => {
    //     expect(stub).to.have.been.called.once;
    //   });
    // });
  });

  describe('resetPassword', function() {
    it('should throw an error if a username is not provided', function() {
      expect(User.resetPassword()).to.be.rejected;
    });

    it('should throw an error if the provided username is not a string', function() {
      expect(User.resetPassword({})).to.be.rejected;
    });

    it('should reset the password for a user', function() {
      const username = 'test';
      nock(this.client.baseUrl)
        .put(`/${rpcNamespace}/${this.client.appKey}/${username}/user-password-reset-initiate`, () => true)
        .query(true)
        .reply(204, null, {
          'content-type': 'application/json'
        });

      expect(User.resetPassword(username)).to.be.fulfilled;
    });
  });
});
