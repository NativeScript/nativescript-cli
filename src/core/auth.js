import UserUtils from './utils/user';
import Client from './client';

/**
 * @private
 * Access to the Kinvey service is authenticated through user credentials,
 * Master Secret, or App Secret. A combination of these is often (but not
 * always) accepted. Therefore, an extensive set of all possible combinations
 * is gathered here and presented as authentication policies.
 */
const Auth = {
  // All policies must return a {Promise}. The value of a resolved promise must
  // be an object containing `scheme` and `username` and `password` or
  // `credentials`. The reason of rejection must be a `Kinvey.Error` constan
  // https://tools.ietf.org/html/rfc2617

  /**
   * Authenticate through (1) user credentials, (2) Master Secret, or (3) App
   * Secret.
   *
   * @returns {Promise}
   */
  all(client = Client.sharedInstance()) {
    return Auth.session(client).catch(() => {
      return Auth.basic(client);
    });
  },

  /**
   * Authenticate through App Secret.
   *
   * @returns {Promise}
   */
  app(client = Client.sharedInstance()) {
    if (!client.appKey || !client.appSecret) {
      const error = new Error('Missing client credentials');
      return Promise.reject(error);
    }

    const promise = Promise.resolve({
      scheme: 'Basic',
      username: client.appKey,
      password: client.appSecret
    });

    return promise;
  },

  /**
   * Authenticate through (1) Master Secret, or (2) App Secret.
   *
   * @returns {Promise}
   */
  basic(client = Client.sharedInstance()) {
    return Auth.master(client).catch(() => {
      return Auth.app(client);
    });
  },

  /**
   * Authenticate through (1) user credentials, or (2) Master Secret.
   *
   * @returns {Promise}
   */
  default(client = Client.sharedInstance()) {
    return Auth.session().catch((err) => {
      return Auth.master(client).catch(() => {
        return Promise.reject(err);
      });
    });
  },

  /**
   * Authenticate through Master Secret.
   *
   * @returns {Promise}
   */
  master(client = Client.sharedInstance()) {
    if (!client.appKey || !client.masterSecret) {
      const error = new Error('Missing client credentials');
      return Promise.reject(error);
    }

    const promise = Promise.resolve({
      scheme: 'Basic',
      username: client.appKey,
      password: client.masterSecret
    });

    return promise;
  },

  /**
   * Do not authenticate.
   *
   * @returns {Promise}
   */
  none() {
    return Promise.resolve(null);
  },

  /**
   * Authenticate through user credentials.
   *
   * @returns {Promise}
   */
  session() {
    return UserUtils.getActive().then(user => {
      if (!user) {
        throw new Error('There is not an active user.');
      }

      return {
        scheme: 'Kinvey',
        credentials: user._kmd.authtoken
      };
    });
  }
};
export default Auth;
