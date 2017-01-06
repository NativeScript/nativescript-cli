import Identity from './identity';
import { SocialIdentity } from './enums';

/**
 * @private
 */
export class Windows extends Identity {
  get identity() {
    return SocialIdentity.Windows;
  }

  static get identity() {
    return SocialIdentity.Windows;
  }
}
