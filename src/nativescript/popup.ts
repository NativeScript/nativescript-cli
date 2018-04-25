import { EventEmitter } from 'events';
import * as app from 'tns-core-modules/application';
import * as frameModule from 'tns-core-modules/ui/frame';
import { Page } from 'tns-core-modules/ui/page';
import { GridLayout } from 'tns-core-modules/ui/layouts/grid-layout';
import { StackLayout } from 'tns-core-modules/ui/layouts/stack-layout';
import { WebView, LoadEventData } from 'tns-core-modules/ui/web-view';

/**
 * Implementation details have been copied from https://github.com/alexziskind1/nativescript-oauth.
 */

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

export class Popup extends EventEmitter {
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

  close() {
    if (this._open) {
      frameModule.topmost().goBack();
      this._open = false;
    }

    return this;
  }
}
