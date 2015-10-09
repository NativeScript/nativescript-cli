import Social from './social';
import KinveyError from '../errors/error';

export default class Twitter extends Social {

  get name() {
    return 'twitter';
  }

  connect(options) {
    return this.requestToken(options).then((token) => {
      return this.verifyToken(token, options);
    });
  }

  requestToken(options) {
    return super.requestToken(options).then((token) => {
      if (token.error || token.denied) {
        throw new KinveyError('Error connecting with twitter.', token);
      }

      return {
        oauth_token: token.oauth_token,
        oauth_token_secret: token.oauth_token_secret,
        oauth_verifier: token.oauth_verifier
      };
    });
  }
}
