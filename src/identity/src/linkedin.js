import Identity from './identity';
import { SocialIdentity } from './enums';

/**
 * @private
 */
export class LinkedIn extends Identity {
  get identity() {
    return SocialIdentity.LinkedIn;
  }

  static get identity() {
    return SocialIdentity.LinkedIn;
  }
}
