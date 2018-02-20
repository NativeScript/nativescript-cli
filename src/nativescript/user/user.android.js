import { User as CoreUser } from '../../core/user';

export class User extends CoreUser {
  // static handleMICRedirectURL(redirectUri, micRedirectURL) {
  //   if (typeof redirectUri !== 'string') {
  //     throw new Error('redirectUri must be a string');
  //   }

  //   if (micRedirectURL instanceof NSURL) {
  //     micRedirectURL = micRedirectURL.absoluteString;
  //   }

  //   if (typeof micRedirectURL !== 'string') {
  //     throw new Error('micRedirectURL must be a string');
  //   }

  //   if (micRedirectURL.toLowerCase().indexOf(redirectUri.toLowerCase()) === 0) {
  //     return new android.content.Intent('com.kinvey.KinveyMICRedirectURL', Uri.parse("content://result_uri"));
  //   }

  //   return null;
  // }

  // static onOAuthCallbackReceived(intent, clientId, client) {
  //   if (!intent || !intent.getData()) {
  //     return;
  //   }

  //   const uri = intent.getData();
  //   String accessToken = uri.getQueryParameter('code');
  //   if (accessToken == null) {
  //     return;
  //   }
  //   getMICAccessToken(accessToken, clientId, client);
  // }
}
