import { RequestMethod, AuthType, KinveyRequest, KinveyRequestConfig } from './request';
import { KinveyRackManager } from '../rack/rack';
import { NoResponseError, InvalidCredentialsError } from '../errors';
import { KinveyResponse, KinveyResponseConfig } from './response';
import { SocialIdentity } from '../social/src/enums';
import { setActiveUser, getIdentitySession, setIdentitySession } from '../utils/storage';
import regeneratorRuntime from 'regenerator-runtime'; // eslint-disable-line no-unused-vars
import url from 'url';
import assign from 'lodash/assign';
const socialIdentityAttribute = process.env.KINVEY_SOCIAL_IDENTITY_ATTRIBUTE || '_socialIdentity';
const tokenPathname = process.env.KINVEY_MIC_TOKEN_PATHNAME || '/oauth/token';
const usersNamespace = process.env.KINVEY_USERS_NAMESPACE || 'user';

/**
 * @private
 */
export class NetworkRequest extends KinveyRequest {
  constructor(options = {}) {
    super(options);
    this.rack = KinveyRackManager.networkRack;
  }

  async execute(rawResponse = false) {
    try {
      await super.execute();
      let response = await this.rack.execute(this);
      this.executing = false;

      if (!response) {
        throw new NoResponseError();
      }

      if (!(response instanceof KinveyResponse)) {
        response = new KinveyResponse(new KinveyResponseConfig({
          statusCode: response.statusCode,
          headers: response.headers,
          data: response.data
        }));
      }

      if (rawResponse === false && response.isSuccess() === false) {
        throw response.error;
      }

      return response;
    } catch (error) {
      if (error instanceof InvalidCredentialsError) {
        // Retrieve the MIC session
        let micSession = getIdentitySession(this.client, SocialIdentity.MobileIdentityConnect);

        if (micSession) {
          // Refresh MIC Auth Token
          const refreshMICRequestConfig = new KinveyRequestConfig({
            method: RequestMethod.POST,
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            authType: AuthType.App,
            url: url.format({
              protocol: micSession.protocol || this.client.micProtocol,
              host: micSession.host || this.client.micHost,
              pathname: tokenPathname
            }),
            body: {
              grant_type: 'refresh_token',
              client_id: micSession.client_id,
              redirect_uri: micSession.redirect_uri,
              refresh_token: micSession.refresh_token
            },
            timeout: this.timeout,
            properties: this.properties
          });
          const refreshMICRequest = new NetworkRequest(refreshMICRequestConfig);
          const newMicSession = await refreshMICRequest.execute().then(response => response.data);
          micSession = assign(micSession, newMicSession);

          // Login the user with the new mic session
          const data = {};
          data[socialIdentityAttribute] = {};
          data[socialIdentityAttribute][SocialIdentity.MobileIdentityConnect] = micSession;

          // Login the user
          const loginRequestConfig = new KinveyRequestConfig({
            method: RequestMethod.POST,
            authType: AuthType.App,
            url: url.format({
              protocol: this.client.protocol,
              host: this.client.host,
              pathname: `/${usersNamespace}/${this.client.appKey}/login`
            }),
            properties: this.properties,
            body: data,
            timeout: this.timeout,
            client: this.client
          });
          const loginRequest = new NetworkRequest(loginRequestConfig);
          loginRequest.automaticallyRefreshAuthToken = false;
          const activeUser = await loginRequest.execute().then(response => response.data);

          // Store the updated active user
          setActiveUser(this.client, activeUser);

          // Store the updated mic session
          setIdentitySession(this.client, SocialIdentity.MobileIdentityConnect, micSession);

          // Execute the original request
          return this.execute();
        }
      }

      throw error;
    }
  }

  cancel() {
    const promise = super.cancel().then(() => this.rack.cancel());
    return promise;
  }
}
