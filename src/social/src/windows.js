import { Social } from './social';
import { SocialIdentity } from './enums';

export class Windows extends Social {
  static get identity() {
    return SocialIdentity.Windows;
  }
}
