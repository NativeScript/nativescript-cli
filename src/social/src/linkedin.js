import { Social } from './social';
import { SocialIdentity } from './enums';

/**
 * @private
 */
export class LinkedIn extends Social {
  get identity() {
    return SocialIdentity.LinkedIn;
  }

  static get identity() {
    return SocialIdentity.LinkedIn;
  }
}
