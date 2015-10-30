import Social from './social';
import { KinveyError } from '../errors';
import Promise from 'bluebird';
const FB = global.FB;

export default class Facebook extends Social {

  get name() {
    return 'facebook';
  }

  connect() {
    const promise = new Promise((resolve, reject) => {
      if (typeof FB === 'undefined') {
        return reject(new KinveyError('Facebook SDK not found.', 'Please load the Facebook SDK by following the guide at https://developers.facebook.com/docs/javascript/quickstart/v2.4.'));
      }

      FB.getLoginStatus((response) => {
        if (response.status === 'connected') {
          return resolve(response.authResponse);
        }

        FB.login((response) => {
          if (response.status === 'connected') {
            const authResponse = response.authResponse;
            const token = {
              access_token: authResponse.accessToken,
              expires_in: authResponse.expiresIn
            };
            return resolve(token);
          } else if (response.status === 'not_authorized') {
            return reject(new KinveyError('The user did not authorize the application to connect to Facebook.'));
          }

          reject('Unable to connect to Facebook.');
        });
      });
    });

    return promise;
  }
}
