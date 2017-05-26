// import { User } from 'kinvey-js-sdk/dist/entity';
// import Client from 'kinvey-js-sdk/dist/client';
// import { CacheRequest } from 'kinvey-js-sdk/dist/request';
// import { isDefined } from 'kinvey-js-sdk/dist/utils';
// import { ActiveUserError } from 'kinvey-js-sdk/dist/errors';
// import { MobileIdentityConnect } from 'kinvey-js-sdk/dist/identity';
// import url from 'url';
// import isString from 'lodash/isString';
// import { Popup } from './popup';
// const application = require('application'); // eslint-disable-line import/no-unresolved, import/extensions, import/no-extraneous-dependencies

// class NativeScriptMobileIdentityConnect extends MobileIdentityConnect {
//   requestCodeWithPopup(clientId, redirectUri, options = {}) {
//     const promise = Promise.resolve().then(() => {
//       let pathname = '/';
//       const popup = new Popup();

//       if (options.version) {
//         let version = options.version;

//         if (!isString(version)) {
//           version = String(version);
//         }

//         pathname = path.join(pathname, version.indexOf('v') === 0 ? version : `v${version}`);
//       }

//       return popup.open(url.format({
//         protocol: this.client.micProtocol,
//         host: this.client.micHost,
//         pathname: path.join(pathname, authPathname),
//         query: {
//           client_id: clientId,
//           redirect_uri: redirectUri,
//           response_type: 'code'
//         }
//       }));
//     }).then((popup) => {
//       const promise = new Promise((resolve, reject) => {
//         let redirected = false;

//         function loadCallback(event) {
//           try {
//             if (event.url && event.url.indexOf(redirectUri) === 0 && redirected === false) {
//               redirected = true;
//               popup.removeAllListeners();
//               popup.close();
//               resolve(url.parse(event.url, true).query.code);
//             }
//           } catch (error) {
//             // Just catch the error
//           }
//         }

//         function errorCallback(event) {
//           try {
//             if (event.url && event.url.indexOf(redirectUri) === 0 && redirected === false) {
//               redirected = true;
//               popup.removeAllListeners();
//               popup.close();
//               resolve(url.parse(event.url, true).query.code);
//             } else if (redirected === false) {
//               popup.removeAllListeners();
//               popup.close();
//               reject(new KinveyError(event.message, '', event.code));
//             }
//           } catch (error) {
//             // Just catch the error
//           }
//         }

//         function exitCallback() {
//           if (redirected === false) {
//             popup.removeAllListeners();
//             reject(new KinveyError('Login has been cancelled.'));
//           }
//         }

//         popup.on('loadstart', loadCallback);
//         popup.on('loadstop', loadCallback);
//         popup.on('error', errorCallback);
//         popup.on('exit', exitCallback);
//       });
//       return promise;
//     });

//     return promise;
//   }
// }

// class NativeScriptUser extends User {
//   loginWithMIC(redirectUri, authorizationGrant, options = {}) {
//     const isActive = this.isActive();
//     const activeUser = NativeScriptUser.getActiveUser(this.client);

//     if (isActive) {
//       throw new ActiveUserError('This user is already the active user.');
//     }

//     if (isDefined(activeUser)) {
//       throw new ActiveUserError('An active user already exists. Please logout the active user before you login.');
//     }

//     const mic = new MobileIdentityConnect({ client: this.client });
//     return mic.login(redirectUri, authorizationGrant, options)
//       .then(session => this.connectIdentity(MobileIdentityConnect.identity, session, options));
//   }

//   static loginWithMIC(redirectUri, authorizationGrant, options = {}) {
//     const user = new NativeScriptUser({}, options);
//     return user.loginWithMIC(redirectUri, authorizationGrant, options);
//   }


//   static processMICRedirect(redirectUrl) {
//     if (!redirectUrl || isString(redirectUrl) === false) {
//       return false;
//     }

//     const code = url.parse(redirectUrl, true).query.code;

//     if (!code) {
//       return false;
//     }

//     application.notify({
//       eventName: 'MICRedirectNotification',
//       url: redirectUrl
//     });
//     return true;
//   }

//   static getActiveUser(client = Client.sharedInstance()) {
//     const data = CacheRequest.getActiveUser(client);

//     if (isDefined(data)) {
//       return new NativeScriptUser(data, { client: client });
//     }

//     return null;
//   }
// }

// // Setup popup
// NativeScriptUser.usePopupClass(Popup);

// // Export
// export default NativeScriptUser;
