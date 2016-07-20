import { Social, SocialIdentity } from './social';


export class Windows extends Social {
  get identity() {
    return SocialIdentity.Windows;
  }
}
