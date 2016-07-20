import { Social, SocialIdentity } from './social';


export class Google extends Social {
  get identity() {
    return SocialIdentity.Google;
  }
}
