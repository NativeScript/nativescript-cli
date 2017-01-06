import Identity from './identity';
import { SocialIdentity } from './enums';

/**
 * @private
 */
export class Google extends Identity {
  get identity() {
    return SocialIdentity.Google;
  }

  static get identity() {
    return SocialIdentity.Google;
  }
}
