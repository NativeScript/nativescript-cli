/* global UIApplication, android */

// import { KinveyError } from 'kinvey-js-sdk';
// import { EventEmitter } from 'events';
// import { openAdvancedUrl as openUrl } from 'nativescript-advanced-webview'; // eslint-disable-line import/no-unresolved, import/extensions, import/no-extraneous-dependencies
// import * as utils from 'utils/utils'; // eslint-disable-line import/no-unresolved, import/extensions, import/no-extraneous-dependencies
// import * as app from 'application'; // eslint-disable-line import/no-unresolved, import/extensions, import/no-extraneous-dependencies

// export class Popup extends EventEmitter {
//   open(url = '/') {
//     const options = { url: url };

//     if (app.ios) {
//       // Listen for MICSuccessNotification
//       app.on('MICRedirectNotification', (args) => {
//         // Remove listeners
//         app.off('MICRedirectNotification');

//         // Emit loadstop event
//         this.emit('loadstop', args);
//       });
//     } else if (app.android) {
//       const uri = android.net.Uri.parse(url);
//       const intent = new android.content.Intent(android.content.Intent.ACTION_VIEW, uri);
//       const activity = app.android.startActivity || app.android.foregroundActivity;

//       if (activity) {
//         activity.startActivity(intent);
//       }
//     } else {
//       throw new KinveyError('This platform is not supported for MIC.');
//     }

//     // Open the url
//     openUrl(options);

//     return this;
//   }

//   close() {
//     if (app.ios) {
//       const uiApplication = utils.ios.getter(UIApplication, UIApplication.sharedApplication);
//       uiApplication.keyWindow.rootViewController.dismissViewControllerAnimatedCompletion(true, null);
//     }

//     return this;
//   }
// }
