import { Social } from './social';
import { SocialIdentity } from './enums';

/**
 * @private
 */
export class Windows extends Social {
  get identity() {
    return SocialIdentity.Windows;
  }

  static get identity() {
    return SocialIdentity.Windows;
  }
}
