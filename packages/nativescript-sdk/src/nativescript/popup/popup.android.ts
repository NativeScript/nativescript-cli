import { EventEmitter } from 'events';
import { Color } from 'tns-core-modules/color';
import { topmost } from 'tns-core-modules/ui/frame';
import * as app from 'tns-core-modules/application';
import { Page } from 'tns-core-modules/ui/page';
import { GridLayout } from 'tns-core-modules/ui/layouts/grid-layout';
import { StackLayout } from 'tns-core-modules/ui/layouts/stack-layout';
import { WebView, LoadEventData } from 'tns-core-modules/ui/web-view';
import { handleOpenURL, AppURL } from 'nativescript-urlhandler';

const LOADED_EVENT = 'loaded';
const CLOSED_EVENT = 'closed';
const ERROR_EVENT = 'error';
declare const global;

const customtabsPackage: any = global.androidx && global.androidx.browser ? global.androidx.browser : android.support;
const customtabs = customtabsPackage.customtabs || {};
const CustomTabsCallback = customtabs.CustomTabsCallback;
const CustomTabsServiceConnection = customtabs.CustomTabsServiceConnection;
const CustomTabsIntent = customtabs.CustomTabsIntent;
const CustomTabsClient = customtabs.CustomTabsClient;
const Uri = android.net.Uri;

interface PopupOptions {
  toolbarColor?: string;
  showTitle?: boolean;
}

const NavigationEvent = {
  Started: 1,
  Finished: 2,
  Failed: 3,
  Aborted: 4,
  TabShown: 5,
  TabHidden: 6
};

class OAuthPageProvider {
  private authUrl: string;
  private webviewIntercept: (webview: any, error?: any, url?: string) => boolean;

  constructor(authUrl: string, webviewIntercept: (webview: any, error?: any, url?: string) => boolean) {
    this.authUrl = authUrl;
    this.webviewIntercept = webviewIntercept;
  }

  createWebViewPage() {
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
    if (this._open !== true) {
      const webViewIntercept = (webview: any, error: any, url: string): boolean => {
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

        this.emit(LOADED_EVENT, { url: urlStr });
        return true;
      };

      const authPage = new OAuthPageProvider(url, webViewIntercept);
      topmost().navigate(() => authPage.createWebViewPage());
      this._open = true;
    }

    return this;
  }
}

export class Popup extends EventEmitter {
  private _open = false;

  isClosed() {
    return this._open !== true;
  }

  onLoaded(listener: any) {
    return this.on(LOADED_EVENT, listener);
  }

  onClosed(listener: any) {
    return this.on(CLOSED_EVENT, listener);
  }

  onError(listener: any) {
    return this.on(ERROR_EVENT, listener);
  }

  async open(url = '/', options: PopupOptions = {}) {
    if (this._open !== true) {
      const activity = app.android.startActivity || app.android.foregroundActivity;
      let shouldClose = false;
      let success = false;

      try {
        const callback = CustomTabsCallback.extend({
          onNavigationEvent: (navigationEvent: any) => {
            switch (navigationEvent) {
              case NavigationEvent.Finished:
              case NavigationEvent.Failed:
              case NavigationEvent.Aborted:
                if (shouldClose) {
                  setTimeout(() => {
                    this.emit(CLOSED_EVENT);
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

        // Handle redirect uri
        handleOpenURL((appURL: AppURL) => {
          this.emit(LOADED_EVENT, { url: appURL.toString() });
        });

        const serviceConnection = CustomTabsServiceConnection.extend({
          onCustomTabsServiceConnected: (name: any, client: any) => {
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

          onServiceDisconnected(name: any) {
            // TODO: Do nothing for now. Should this change?
          }
        });

        // Bind to the custom tabs service
        success = CustomTabsClient.bindCustomTabsService(activity, 'com.android.chrome', new serviceConnection());
      } catch (error) { }

      if (!success) {
        const legacyPopup = new LegacyPopup();
        legacyPopup.on(LOADED_EVENT, (event) => this.emit(LOADED_EVENT, event));
        legacyPopup.open(url);
        this._open = true;
      }
    }

    // Return this
    return this;
  }

  async close() {
    if (this._open === true) {
      topmost().goBack();
      this._open = false;
    }

    this.emit(CLOSED_EVENT);
    return this;
  }

  static open(url: string, options?: PopupOptions) {
    const popup = new Popup();
    return popup.open(url, options);
  }
}
