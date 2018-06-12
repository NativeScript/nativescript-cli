import { EventEmitter } from 'events';
import { Color } from 'tns-core-modules/color';
import * as frameModule from 'tns-core-modules/ui/frame';
import * as app from 'tns-core-modules/application';
import { handleOpenURL, AppURL } from 'nativescript-urlhandler';

import { Page } from 'tns-core-modules/ui/page';
import { GridLayout } from 'tns-core-modules/ui/layouts/grid-layout';
import { StackLayout } from 'tns-core-modules/ui/layouts/stack-layout';
import { WebView, LoadEventData } from 'tns-core-modules/ui/web-view';

declare const android: any;
const customtabs = android.support.customtabs || {};
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

class OAuthPageProvider {
  private authUrl: string;
  private webviewIntercept: (webview, error?, url?) => boolean;

  constructor(authUrl, webviewIntercept) {
    this.authUrl = authUrl;
    this.webviewIntercept = webviewIntercept;
  }

  createWebViewPage(): Page {
    const webview = new WebView();

    webview.on(WebView.loadFinishedEvent, (args: LoadEventData) => {
      this.webviewIntercept(webview, args.error, args.url);
    });

    webview.on(WebView.loadStartedEvent, (args: LoadEventData) => {
      this.webviewIntercept(webview, args.error, args.url);
    });

    const grid = new GridLayout();
    grid.addChild(webview);

    const stack = new StackLayout();
    stack.addChild(grid);

    const page = new Page();
    page.content = stack;

    webview.src = this.authUrl;

    return page;
  }
}

class LegacyPopup extends EventEmitter {
  private _open = false;

  open(url = '/') {
    if (this._open === false) {
      const webViewIntercept = (webview, error, url): boolean => {
        let urlStr = '';

        try {
          if (error && error.userInfo && error.userInfo.allValues && error.userInfo.allValues.count > 0) {
            const val0 = error.userInfo.allValues[0];
            if (val0.absoluteString) {
              urlStr = val0.absoluteString;
            } else if (val0.userInfo && val0.userInfo.allValues && val0.userInfo.allValues.count > 0) {
              urlStr = val0.userInfo.allValues[0];
            } else {
              urlStr = val0;
            }
          } else if (webview.request && webview.request.URL && webview.request.URL.absoluteString) {
            urlStr = webview.request.URL.absoluteString;
          } else if (url) {
            urlStr = url;
          }
        } catch (ex) {
          // Just catch the exception
        }

        (this as any).emit('loadstop', { url: urlStr });
        return true;
      };

      const authPage = new OAuthPageProvider(url, webViewIntercept);
      frameModule.topmost().navigate(() => authPage.createWebViewPage());
      this._open = true;
    }

    return this;
  }
}

export class Popup extends EventEmitter {
  private _open = false;

  open(url = '/', options: PopupOptions = {}) {
    const activity = app.android.startActivity || app.android.foregroundActivity;
    let shouldClose = false;
    let success = false;

    try {
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
      success = CustomTabsClient.bindCustomTabsService(activity, 'com.android.chrome', new serviceConnection());
    } catch (error) {}

    if (!success) {
      const legacyPopup = new LegacyPopup();
      legacyPopup.on('loadstop', (event) => this.emit('loadstop', event));
      legacyPopup.open(url);
      this._open = true;
    }

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
