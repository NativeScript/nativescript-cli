import { Social } from './social';
import { SocialIdentity } from './enums';

export class LinkedIn extends Social {
  static get identity() {
    return SocialIdentity.LinkedIn;
  }
}
