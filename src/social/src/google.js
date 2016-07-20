import { Social } from './social';
import { SocialIdentity } from './enums';

export class Google extends Social {
  static get identity() {
    return SocialIdentity.Google;
  }
}
