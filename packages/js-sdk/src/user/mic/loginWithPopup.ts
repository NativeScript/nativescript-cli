import { parse } from 'url';
import { formatKinveyAuthUrl } from '../../http';
import { KinveyError } from '../../errors/kinvey';
import { getVersion } from './utils';
import { open } from './popup';

export function loginWithPopup(clientId: string, redirectUri: string, version?: string | number): Promise<string> {
  return new Promise(async (resolve, reject) => {
    const url = formatKinveyAuthUrl(`/${getVersion(version)}/oauth/auth`, {
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid'
    });
    const popup = await open(url);
    let redirected = false;

    popup.onLoaded(async (event) => {
      try {
        if (event.url && event.url.indexOf(redirectUri) === 0 && redirected === false) {
          const parsedUrl = parse(event.url, true);
          const { code, error, error_description } = parsedUrl.query;

          redirected = true;
          popup.removeAllListeners();
          await popup.close();

          if (code) {
            resolve(code as string);
          } else if (error) {
            reject(new KinveyError(error as string));
          } else {
            reject(new KinveyError('No code or error was provided.'));
          }
        }
      } catch (error) {
        // Just catch the error
      }
    });

    popup.onClosed(() => {
      if (!redirected) {
        popup.removeAllListeners();
        reject(new KinveyError('Login has been cancelled.'));
      }
    });
  });
}
