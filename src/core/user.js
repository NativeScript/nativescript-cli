import HttpMethod from '../enums/httpMethod';
import Kinvey from '../kinvey';
import CoreObject from './object';
import utils from './utils';
import NetworkRequest from './networkRequest';
import AuthType from '../enums/authType';
import Session from './session';
import LocalDataStore from './localDataStore';
const currentUser = Symbol();

class User extends CoreObject {
  constructor(data = {}) {
    super();

    // Set data for the user
    this.data = data;
  }

  toJSON() {
    return this.data;
  }

  static login(username, password) {
    // Reject if a user is already active
    if (utils.isDefined(Session.current)) {
      return Promise.reject(new Error('You already have a current session.'));
    }

    // Create a network request
    let request = new NetworkRequest(HttpMethod.POST, `/user/${Kinvey.appKey}/login`, null, {
        username: username,
        password: password
    });

    // Set the auth type
    request.authType = AuthType.App;

    // Execute the request
    return request.execute().then((response) => {
      // Create a user from the response
      let user = new User(response.data);

      // Set the user as the current session
      Session.current = user.toJSON();

      // Save the user to the local datastore
      return LocalDataStore.save(user.toJSON()).then(() => {
        return user;
      });
    });
  }

  static get current() {
    let user = this[currentUser];

    if (!utils.isDefined(user)) {
      let session = Session.current;

      if (utils.isDefined(session)) {
        user = new User(session.user);
        this[currentUser] = user;
      }
    }

    return user;
  }
}

export default User;
