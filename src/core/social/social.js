import KinveyError from '../errors/error';
import Client from '../client';
import Request from '../request';
import HttpMethod from '../enums/httpMethod';
import Auth from '../auth';
import url from 'url';
import when from 'when';
import assign from 'lodash/object/assign';
import { isPhoneGap, isTitanium } from '../../utils/platform';
const usersNamespace = 'user';

export default class Social {
  requestToken(options = {}) {
    options = assign(options, {
      state: Math.random().toString(36).substr(2),
      flags: {
        provider: this.name,
        step: 'requestToken'
      }
    });

    const redirectUri = options.redirect || global.location.toString();
    const client = Client.sharedInstance();
    const path = `/${usersNamespace}/${client.appKey}`;
    const data = {
      redirect: redirectUri,
      state: options.state
    };
    const request = new Request(HttpMethod.POST, path, null, data, options);
    request.auth = Auth.app;

    const promise = request.execute().then((data) => {
      const popupUrl = data.url;

      return when.promise((resolve, reject) => {
        const interval = 100;
        let elapsed = 0;
        let tiWebView;
        let tiCloseButton;
        let popup;
        let timer;

        const popupRedirected = (event) => {
          const params = url.parse(event.url).query;
          resolve(params.code);

          // closePopup();
        };

        // Load handler: Used when running PhoneGap or Titanium
        const loadHandler = (event) => {
          let redirected = false;

          try {
            redirected = event.url.indexOf(redirectUri) === 0;
          } catch (err) {
            // Just catch the error
          }

          if (redirected) {
            popupRedirected(event.url);
          }
        };

        // Click handler: Used when running Titanium
        const clickHandler = () => {
          popup.close();
        };

        // Close handler: Used when running PhoneGap or Titanium
        const closePopup = () => {
          if (isPhoneGap()) {
            popup.removeEventListener('loadstart', loadHandler);
            popup.removeEventListener('exit', closePopup);
          } else if (isTitanium()) {
            tiWebView.removeEventListener('load', loadHandler);
            tiWebView.removeEventListener('error', loadHandler);
            popup.removeEventListener('close', closePopup);

            if (Titanium.Platform.name === 'iPhone OS') {
              tiCloseButton.removeEventListener('click', clickHandler);
            } else if (Titanium.Platform.name === 'Android') {
              popup.removeEventListener('androidback', closePopup);
            }
          }

          // Animation popup open prevents closing sometimes so
          // wait just a moment to close
          setTimeout(function() {
            popup.close();
          }, 200);

          clearTimeout(timer);
          popup.closed = true;
        };

        if (isPhoneGap()) {
          popup = global.open(popupUrl, '_blank', 'location=yes');
          popup.addEventListener('loadstart', loadHandler);
          popup.addEventListener('exit', closeHandler);
        } else if (isTitanium()) {
          // Create a web view
          tiWebView = Titanium.UI.createWebView({
            width: '100%',
            height: '100%',
            url: popupUrl
          });

          // Create a popup window
          popup = Titanium.UI.createWindow({
            backgroundColor: 'white',
            barColor: '#000',
            title: 'Kinvey - OAuth',
            modal: true
          });

          // Add the web view to the popup window
          popup.add(tiWebView);

          if (Titanium.Platform.name === 'iPhone OS') {
            // Create a window
            const win = Titanium.UI.createWindow({
              backgroundColor: 'white',
              barColor: '#e3e3e3',
              title: 'Kinvey - OAuth'
            });

            // Add the web view to the window
            win.add(tiWebView);

            // Create close button
            tiCloseButton = Titanium.UI.createButton({
              title: 'Close',
              style: Titanium.UI.iPhone.SystemButtonStyle.DONE
            });
            win.setLeftNavButton(tiCloseButton);

            // Listen for click event on close button
            tiCloseButton.addEventListener('click', clickHandler);

            // Create a navigation window
            popup = Titanium.UI.iOS.createNavigationWindow({
              backgroundColor: 'white',
              window: win,
              modal: true
            });
          } else if (Titanium.Platform.name === 'Android') {
            popup.addEventListener('androidback', closePopup);
          }

          // Add event listener
          tiWebView.addEventListener('load', loadHandler);
          tiWebView.addEventListener('error', loadHandler);
          popup.addEventListener('close', closePopup);

          // Open the web view UI
          popup.open();
        } else {
          popup = global.open(popupUrl, '_blank', 'toolbar=no,location=no');
        }

        if (!popup) {
          closePopup();
          return reject(new KinveyError('The popup was blocked.'));
        }

        timer = setInterval(() => {
          let redirected = false;

          if (popup.closed) {
            clearTimeout(timer);
            return reject(new KinveyError('The popup was closed without authorizing the user.'));
          } else if (options.timeout && elapsed > options.timeout) {
            closePopup();
            return reject(new KinveyError('The authorization request timed out.'));
          }

          if (popup.location) {
            try {
              redirected = popup.location.href.indexOf(redirectUri) === 0;
            } catch (err) {
              // Just catch the error
            }

            if (redirected) {
              return popupRedirected({ url: popup.location });
            }
          }

          elapsed += interval;
        }, interval);
      });
    });

    // Return the promise
    return promise;
  }

  verifyToken(token, options = {}) {
    options = assign(options, {
      flags: {
        provider: this.name,
        step: 'verifyToken'
      }
    });

    const client = Client.sharedInstance();
    const path = `/${usersNamespace}/${client.appKey}`;
    const request = new Request(HttpMethod.POST, path, null, token, options);
    request.auth = Auth.app;
    const promise = request.execute();
    return promise;
  }
}
