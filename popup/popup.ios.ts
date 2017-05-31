/// <reference path="../references.d.ts" />

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

class OAuthWebViewHelper extends NSObject implements UIWebViewDelegate {
  public static ObjCProtocols = [UIWebViewDelegate];

  private _owner: WeakRef<WebView>;
  private _origDelegate: any; // UIWebViewDelegateImpl
  private _webViewIntercept: (WebView, error?, url?) => boolean;

  constructor() {
    super();
  }

  public static initWithWebViewAndIntercept(wv: WebView, webViewIntercept) {
    (<any>wv)._delegate = OAuthWebViewHelper.initWithOwner(new WeakRef(wv), webViewIntercept);
  }

  private static initWithOwner(owner: WeakRef<WebView>, webViewIntercept): OAuthWebViewHelper {
    let delegate = new OAuthWebViewHelper();
    delegate._owner = owner;
    delegate._origDelegate = (<any>owner.get())._delegate;
    delegate._webViewIntercept = webViewIntercept;
    return delegate;
  }

  public webViewShouldStartLoadWithRequestNavigationType(webView: UIWebView, request: NSURLRequest, navigationType: number) {
    return this._origDelegate.webViewShouldStartLoadWithRequestNavigationType(webView, request, navigationType);
  }

  public webViewDidStartLoad(webView: UIWebView) {
    this._origDelegate.webViewDidStartLoad(webView);
  }

  public webViewDidFinishLoad(webView: UIWebView) {
    this._webViewIntercept(webView, null);
    this._origDelegate.webViewDidFinishLoad(webView);
  }

  public webViewDidFailLoadWithError(webView: UIWebView, error: NSError) {
    this._webViewIntercept(webView, error);
    this._origDelegate.webViewDidFailLoadWithError(webView, error);
  }
}

class OAuthPageProvider {
  private _authUrl: string;
  private _webViewIntercept: (WebView, error?, url?) => boolean;

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
            let val0 = error.userInfo.allValues[0];
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

        this.emit('loadstop', { url: urlStr });
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
