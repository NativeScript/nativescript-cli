import { EventEmitter } from 'events';
import { Color } from 'tns-core-modules/color';
import * as frameModule from 'tns-core-modules/ui/frame';
import * as app from 'tns-core-modules/application';
import { handleOpenURL, AppURL } from 'nativescript-urlhandler';

declare const android: any;
const customtabs = android.support.customtabs;
const CustomTabsCallback = customtabs.CustomTabsCallback;
const CustomTabsServiceConnection = customtabs.CustomTabsServiceConnection;
const CustomTabsIntent = customtabs.CustomTabsIntent;
const CustomTabsClient = customtabs.CustomTabsClient;
const Uri = android.net.Uri;

export interface PopupOptions {
  toolbarColor?: string;
  showTitle?: boolean;
}

enum NavigationEvent {
  Started = 1,
  Finished,
  Failed,
  Aborted,
  TabShown,
  TabHidden
}

export class Popup extends EventEmitter {
  private _open = false;

  open(url = '/', options: PopupOptions = {}) {
    const activity = app.android.startActivity || app.android.foregroundActivity;
    let shouldClose = false;

    const callback = CustomTabsCallback.extend({
      onNavigationEvent: (navigationEvent) => {
        switch (navigationEvent) {
          case NavigationEvent.Finished:
          case NavigationEvent.Failed:
          case NavigationEvent.Aborted:
            if (shouldClose) {
              setTimeout(() => {
                this.emit('exit');
              }, 0);
            }
            break;
          case NavigationEvent.TabHidden:
            shouldClose = true;
            this._open = false;
            break;
        }
      }
    });

    handleOpenURL((appURL: AppURL) => {
      this.emit('loadstop', { url: appURL.toString() });
    });

    const serviceConnection = CustomTabsServiceConnection.extend({
      onCustomTabsServiceConnected: (name, client) => {
        // Create a new session
        const session = client.newSession(new callback());

        // Create a new intent builder
        const intentBuilder = new CustomTabsIntent.Builder(session);

        // Toolbar color
        if (options.toolbarColor) {
          intentBuilder.setToolbarColor(new Color(options.toolbarColor).android);
        }

        // Show title
        if (options.showTitle) {
          intentBuilder.setShowTitle(options.showTitle);
        }

        intentBuilder.addDefaultShareMenuItem(); // Adds a default share item to the menu.
        intentBuilder.enableUrlBarHiding(); // Enables the url bar to hide as the user scrolls down on the page.

        // Launch the url
        let intent = intentBuilder.build();
        intent.launchUrl(activity, Uri.parse(url));

        // Set open to true
        this._open = true;
      },

      onServiceDisconnected(name) {
        // TODO: Do nothing for now. Should this change?
      }
    });

    // Bind to the custom tabs service
    CustomTabsClient.bindCustomTabsService(activity, 'com.android.chrome', new serviceConnection());

    // Return this
    return this;
  }

  close() {
    if (this._open) {
      frameModule.topmost().goBack();
      this._open = false;
    }

    return this;
  }
}
