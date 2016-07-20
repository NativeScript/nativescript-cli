import { Social, SocialIdentity } from './social';


export class Google extends Social {
  static get identity() {
    return SocialIdentity.Google;
  }
}
