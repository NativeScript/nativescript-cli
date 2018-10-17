import { register as _register } from 'kinvey-http';
import { register as registerSession } from 'kinvey-session-web';
import { parseHeaders } from './utils';

function http(request) {
  return new Promise((resolve, reject) => {
    const requestHeaders = request.headers;
    let requestBody = request.body;
    let xhr = new XMLHttpRequest();

    // Open the request
    xhr.open(request.method.toUpperCase(), request.url, true);

    // Set the timeout in MS
    xhr.timeout = request.timeout;

    // Add the request headers
    Object.keys(requestHeaders).forEach((key) => {
      if (requestHeaders && Object.prototype.hasOwnProperty.call(requestHeaders, key)) {
        if (key.toLowerCase() === 'content-type' && !requestBody) {
          delete requestHeaders[key];
        } else {
          xhr.setRequestHeader(key, request.headers[key]);
        }
      }
    });

    // Handle state changes
    xhr.onreadystatechange = function handleLoad() {
      if (!xhr || xhr.readyState !== XMLHttpRequest.DONE) {
        return;
      }

      // The request errored out and we didn't get a response, this will be
      // handled by onerror instead
      // With one exception: request that using file: protocol, most browsers
      // will return status as 0 even though it's a successful request
      if (xhr.status === 0 && !(xhr.responseURL && xhr.responseURL.indexOf('file:') === 0)) {
        return;
      }

      // Resolve with the response
      resolve({
        data: xhr.responseText,
        statusCode: xhr.status,
        statusText: xhr.statusText,
        headers: 'getAllResponseHeaders' in xhr ? parseHeaders(xhr.getAllResponseHeaders()) : null
      });

      // Clean up xhr
      xhr = null;
    };

    // Handle browser request cancellation (as opposed to a manual cancellation)
    xhr.onabort = function handleAbort() {
      if (!xhr) {
        return;
      }

      reject(new Error('Request aborted'));

      // Clean up xhr
      xhr = null;
    };

    // Handle low level network errors
    xhr.onerror = function handleError() {
      // Real errors are hidden from us by the browser
      // onerror should only fire if it's a network error
      reject(new Error('Network Error'));

      // Clean up xhr
      xhr = null;
    };

    // Handle timeout
    xhr.ontimeout = function handleTimeout() {
      reject(new Error(`timeout of ${request.timeout} ms exceeded`));

      // Clean up xhr
      xhr = null;
    };

    // Send the request
    if (typeof requestBody === 'undefined') {
      requestBody = null;
    }

    xhr.send(requestBody);
  });
}

export function register() {
  _register(http);
  registerSession();
}
