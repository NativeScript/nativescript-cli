/// <reference path="../../node_modules/tns-platform-declarations/android.d.ts" />

import { EventEmitter } from 'events';
import * as app from 'application';
import * as frameModule from 'ui/frame';
import { Page } from 'ui/page';
import { GridLayout } from 'ui/layouts/grid-layout';
import { StackLayout } from 'ui/layouts/stack-layout';
import { WebView } from 'ui/web-view';

/**
 * Implementation details have been copied from https://github.com/alexziskind1/nativescript-oauth.
 */

class OAuthWebViewHelper extends android.webkit.WebViewClient {
  private _view: any;
  private _origClient: any;
  private _webViewIntercept: (webView, error?, url?) => boolean;

  constructor() {
    super();
    return global.__native(this);
  }

  public static initWithWebViewAndIntercept(webView: WebView, webViewIntercept) {
    const webViewCreateNativeView = webView.createNativeView;
    webView.createNativeView = () => {
      (<any>webView)._webViewClient = OAuthWebViewHelper.initWithView(webView, webViewIntercept);
      const nativeView = new android.webkit.WebView(webView._context);
      nativeView.getSettings().setJavaScriptEnabled(true);
      nativeView.getSettings().setBuiltInZoomControls(true);
      nativeView.setWebViewClient((<any>webView)._webViewClient);
      (<any>nativeView).client = (<any>webView)._webViewClient;
      return nativeView;
    };
  }

  private static initWithView(view: WebView, webViewIntercept): OAuthWebViewHelper {
    try {
      const client = new OAuthWebViewHelper();
      client._view = view;
      client._origClient = (<any>view)._webViewClient;
      client._webViewIntercept = webViewIntercept;
      return client;
    } catch (error) {
      console.dir(error);
    }
  }

  /// param url was a string before 7.1.1. It is an object after 7.1.1
  public shouldOverrideUrlLoading(view: android.webkit.WebView, url: any) {
    let urlStr = '';

    if (typeof url === 'string') {
      urlStr = url;
    } else if (typeof url === 'object') {
      try {
        urlStr = url.getUrl().toString();
      } catch (ex) {
        return false;
      }
    } else {
      return false;
    }

    if (this._webViewIntercept(this._view, null, urlStr)) {
      return true;
    }

    return false;
  }

  public onPageStarted(view: android.webkit.WebView, url: string, favicon: android.graphics.Bitmap) {
    this._webViewIntercept(this._view, null, url);
    super.onPageStarted(view, url, favicon);

    if (this._view) {
      this._view._onLoadStarted(url, undefined);
    }
  }

  public onPageFinished(view: android.webkit.WebView, url: string) {
    super.onPageFinished(view, url);

    if (this._view) {
      this._webViewIntercept(this._view, null, url);
      this._view._onLoadFinished(url, undefined);
    }
  }

  public onReceivedError() {
    const view: android.webkit.WebView = arguments[0];

    if (arguments.length === 4) {
      const errorCode: number = arguments[1];
      const description: string = arguments[2];
      const failingUrl: string = arguments[3];

      this._webViewIntercept(this._view, null, failingUrl);
      super.onReceivedError(view, errorCode, description, failingUrl);

      if (this._view) {
        this._view._onLoadFinished(failingUrl, `${description}(${errorCode})`);
      }
    } else {
      const request: any = arguments[1];
      const error: any = arguments[2];

      this._webViewIntercept(this._view, error);
      super.onReceivedError(view, request, error);

      if (this._view) {
        this._view._onLoadFinished(error.getUrl && error.getUrl(), `${error.getDescription()}(${error.getErrorCode()})`);
      }
    }
  }
}

class OAuthPageProvider {
  private _authUrl: string;
  private _webViewIntercept: (webView, error?, url?) => boolean;

  constructor(authUrl, webViewIntercept) {
    this._authUrl = authUrl;
    this._webViewIntercept = webViewIntercept;
  }

  createWebViewPage(): Page {
    const webView = new WebView();
    OAuthWebViewHelper.initWithWebViewAndIntercept(webView, this._webViewIntercept);

    const grid = new GridLayout();
    grid.addChild(webView);

    const stack = new StackLayout();
    stack.addChild(grid);

    const page = new Page();
    page.content = stack;

    webView.src = this._authUrl;

    return page;
  }
}

export class Popup extends EventEmitter {
  private _open = false;

  open(url = '/') {
    if (this._open === false) {
      const webViewIntercept = (webView, error, url): boolean => {
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
          } else if (webView.request && webView.request.URL && webView.request.URL.absoluteString) {
            urlStr = webView.request.URL.absoluteString;
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
