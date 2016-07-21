import { Social } from './social';
import { SocialIdentity } from './enums';

/**
 * @private
 */
export class Google extends Social {
  get identity() {
    return SocialIdentity.Google;
  }

  static get identity() {
    return SocialIdentity.Google;
  }
}
