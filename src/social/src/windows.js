import { Social, SocialIdentity } from './social';


export class Windows extends Social {
  static get identity() {
    return SocialIdentity.Windows;
  }
}
