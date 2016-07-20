import { Social, SocialIdentity } from './social';


export class LinkedIn extends Social {
  get identity() {
    return SocialIdentity.LinkedIn;
  }
}
