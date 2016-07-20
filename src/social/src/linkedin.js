import { Social, SocialIdentity } from './social';


export class LinkedIn extends Social {
  static get identity() {
    return SocialIdentity.LinkedIn;
  }
}
