import { Color } from 'tns-core-modules/color';
import * as frameModule from 'tns-core-modules/ui/frame';
import * as app from 'tns-core-modules/application';

declare const android: any;
const CustomTabsCallback = android.support.customtabs.CustomTabsCallback;
const Uri = android.net.Uri;

export interface PopupOptions {
  toolbarColor?: string;
  showTitle?: boolean;
}

export class Popup {
  open(url = '/', options: PopupOptions = {}) {
    const activity = app.android.startActivity || app.android.foregroundActivity;

    const callback = new CustomTabsCallback({
      onNavigationEvent: function (navigationEvent) {
        console.log('navigationEvent', navigationEvent);
      }
    });

    // const serviceConnection = new CustomTabsServiceConnection({
    //   onCustomTabsServiceConnected: function (name, client) {
    //     // Create a new session
    //     const session = client.newSession(callback);

    //     // Create a new intent builder
    //     const intentBuilder = new CustomTabsIntent.Builder(session);

    //     // Toolbar color
    //     if (options.toolbarColor) {
    //       intentBuilder.setToolbarColor(new Color(options.toolbarColor).android);
    //     }

    //     // Show title
    //     if (options.showTitle) {
    //       intentBuilder.setShowTitle(options.showTitle);
    //     }

    //     intentBuilder.addDefaultShareMenuItem(); /// Adds a default share item to the menu.
    //     intentBuilder.enableUrlBarHiding(); /// Enables the url bar to hide as the user scrolls down on the page.

    //     // Launch the url
    //     let intent = intentBuilder.build().intent;
    //     intent.launchUrl(activity, Uri.parse(url));
    //   }
    // });

    // // Bind to the custom tabs service
    // CustomTabsClient.bindCustomTabsService(activity, 'com.android.chrome', serviceConnection);

    // Return this
    return this;
  }

  close() {
    return this;
  }
}
