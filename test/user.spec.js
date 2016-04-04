import { User } from '../src/user';
import { Acl } from '../src/acl';
import { Metadata } from '../src/metadata';
import { ActiveUserError, KinveyError } from '../src/errors';
import { AuthorizationGrant, SocialIdentity } from '../src/enums';
import { MobileIdentityConnect } from '../src/mic';
import { randomString } from '../src/utils/string';
import { UserHelper } from './helper';
import nock from 'nock';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import sinonChai from 'sinon-chai';
chai.use(chaiAsPromised);
chai.use(sinonChai);
const expect = chai.expect;
const appdataNamespace = process.env.KINVEY_DATASTORE_NAMESPACE || 'appdata';

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
    after(function() {
      return User.setActiveUser(null);
    });

    it('should be a static method', function() {
      expect(User).itself.to.respondTo('getActiveUser');
    });

    it('should return null when there is not an active user', function() {
      const user = User.getActiveUser();
      expect(user).to.be.null;
    });

    it('should return the active user', function() {
      const user = new User();
      user.setAsActiveUser();
      const activeUser = User.getActiveUser();
      expect(activeUser).to.deep.equal(user);
    });
  });

  describe('setActiveUser', function() {
    after(function() {
      return User.setActiveUser(null);
    });

    it('should be a static method', function() {
      expect(User).itself.to.respondTo('setActiveUser');
    });

    it('should set the active user', function() {
      const user = new User();
      User.setActiveUser(user);
      const activeUser = User.getActiveUser();
      expect(activeUser).to.deep.equal(user);
    });

    it('should remove the active user when set to null', function() {
      const user = new User();
      User.setActiveUser(user);
      let activeUser = User.getActiveUser();
      expect(activeUser).to.deep.equal(user);

      User.setActiveUser(null);
      activeUser = User.getActiveUser();
      expect(activeUser).to.be.null;
    });
  });

  describe('setAsActiveUser', function() {
    after(function() {
      return User.setActiveUser(null);
    });

    it('should be a method', function() {
      expect(User).to.respondTo('setAsActiveUser');
    });

    it('should set a user as the active user', function() {
      const user = new User();
      user.setAsActiveUser();
      const activeUser = User.getActiveUser();
      expect(activeUser).to.deep.equal(user);
    });
  });

  describe('isActive', function() {
    after(function() {
      return User.setActiveUser(null);
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
      const user = new User();
      user.setAsActiveUser();
      const isActive = user.isActive();
      expect(isActive).to.be.true;
    });
  });

  describe('login()', function() {
    afterEach(function() {
      return User.setActiveUser(null);
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
      const user = new User();
      user.setAsActiveUser();
      const promise = user.login({
        username: randomString(),
        password: randomString()
      });
      return expect(promise).to.be.rejectedWith(ActiveUserError);
    });

    it('should throw an error if an active user already exists', function() {
      const user = new User();
      user.setAsActiveUser();
      const promise = User.login({
        username: randomString(),
        password: randomString()
      });
      return expect(promise).to.be.rejectedWith(ActiveUserError);
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
        .post(`${user._pathname}/login`)
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
      return User.setActiveUser(null);
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
      const connectStub = this.sandbox.stub(User.prototype, 'connect', function() {
        return Promise.resolve();
      });
      return User.loginWithMIC(randomString(), AuthorizationGrant.AuthorizationCodeLoginPage).then(() => {
        expect(stub).to.have.been.called.once;
        expect(connectStub).to.have.been.called.once;
      });
    });
  });

  describe('logout', function() {
    beforeEach(function() {
      this.user = UserHelper.login();
    });

    afterEach(function() {
      UserHelper.logout();
      delete this.user;
    });

    it('should be a method', function() {
      expect(User).to.respondTo('logout');
    });

    it('should logout a user when the user is not the active user', function() {
      User.setActiveUser(null);
      const promise = this.user.logout();
      return expect(promise).to.be.fulfilled;
    });

    it('should logout a user when the user is the active user', function() {
      nock(this.client.baseUrl)
        .post(`${this.user._pathname}/_logout`)
        .query(true)
        .reply(200, null, {
          'content-type': 'application/json'
        });

      const promise = this.user.logout();
      return expect(promise).to.be.fulfilled;
    });

    it('should logout a user when the REST API rejects the logout request', function() {
      nock(this.client.baseUrl)
        .post(`${this.user._pathname}/_logout`)
        .query(true)
        .reply(500, null, {
          'content-type': 'application/json'
        });

      const promise = this.user.logout();
      return expect(promise).to.be.fulfilled;
    });
  });

  describe('isIdentitySupported', function() {
    it('should be a static method', function() {
      expect(User).itself.to.respondTo('isIdentitySupported');
    });

    it('should return true', function() {
      expect(User.isIdentitySupported('facebook')).to.be.true;
    });

    it('should return false', function() {
      expect(User.isIdentitySupported('foo')).to.be.false;
    });
  });

  describe('connectWithFacebook', function() {
    it('should be a static method', function() {
      expect(User).itself.to.respondTo('connectWithFacebook');
    });

    it('should call User.connectWithIdentity', function() {
      const stub = this.sandbox.stub(User, 'connectWithIdentity', function() {
        return Promise.resolve();
      });
      return User.connectWithFacebook().then(() => {
        expect(stub).to.have.been.called.once;
      });
    });
  });

  describe('connectWithGoogle', function() {
    it('should be a static method', function() {
      expect(User).itself.to.respondTo('connectWithGoogle');
    });

    it('should call User.connectWithIdentity', function() {
      const stub = this.sandbox.stub(User, 'connectWithIdentity', function() {
        return Promise.resolve();
      });
      return User.connectWithGoogle().then(() => {
        expect(stub).to.have.been.called.once;
      });
    });
  });

  describe('connectWithLinkedIn', function() {
    it('should be a static method', function() {
      expect(User).itself.to.respondTo('connectWithLinkedIn');
    });

    it('should call User.connectWithIdentity', function() {
      const stub = this.sandbox.stub(User, 'connectWithIdentity', function() {
        return Promise.resolve();
      });
      return User.connectWithLinkedIn().then(() => {
        expect(stub).to.have.been.called.once;
      });
    });
  });

  describe('connectWithIdentity', function() {
    it('should be a static method', function() {
      expect(User).itself.to.respondTo('connectWithIdentity');
    });

    it('should be a method', function() {
      expect(User).to.respondTo('connectWithIdentity');
    });

    it('should forward to the connectWithIdentity instance method', function() {
      const stub = this.sandbox.stub(User.prototype, 'connectWithIdentity', function() {
        return Promise.resolve();
      });
      return User.connectWithIdentity(randomString()).then(() => {
        expect(stub).to.have.been.called.once;
      });
    });

    it('should throw an error if an identity is not provided', function() {
      const promise = User.connectWithIdentity();
      return expect(promise).to.be.rejectedWith(KinveyError);
    });

    it('should throw an error if an identity is not supported', function() {
      const promise = User.connectWithIdentity(randomString());
      return expect(promise).to.be.rejectedWith(KinveyError);
    });

    it('should throw an error if an identity is not configured in the cloud', function() {
      nock(this.client.baseUrl)
        .get(`/${appdataNamespace}/${this.client.appKey}/identities`)
        .query(true)
        .reply(200, [], {
          'content-type': 'application/json'
        });

      const promise = User.connectWithIdentity(SocialIdentity.Facebook);
      return expect(promise).to.be.rejectedWith(KinveyError);
    });

    // it('should connect a user when the identity is configured in the cloud', function() {
    //   nock(this.client.baseUrl)
    //     .get(`/${appdataNamespace}/${this.client.appKey}/identities`)
    //     .query(true)
    //     .reply(200, [{
    //       key: randomString(),
    //       appId: randomString(),
    //       clientId: randomString()
    //     }], {
    //       'content-type': 'application/json'
    //     });

    //   const promise = User.connectWithIdentity(SocialIdentity.Facebook);
    //   return expect(promise).to.be.rejectedWith(KinveyError);
    // });
  });
});
