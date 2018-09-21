import * as url from "url";
import { EOL } from "os";
import * as helpers from "./helpers";
import * as zlib from "zlib";
import * as util from "util";
import { HttpStatusCodes } from "./constants";
import * as request from "request";

export class HttpClient implements Server.IHttpClient {
	private defaultUserAgent: string;
	private static STATUS_CODE_REGEX = /statuscode=(\d+)/i;

	constructor(private $config: Config.IConfig,
		private $logger: ILogger,
		private $proxyService: IProxyService,
		private $staticConfig: Config.IStaticConfig) { }

	async httpRequest(options: any, proxySettings?: IProxySettings): Promise<Server.IResponse> {
		if (_.isString(options)) {
			options = {
				url: options,
				method: "GET"
			};
		}

		const unmodifiedOptions = _.clone(options);

		if (options.url) {
			const urlParts = url.parse(options.url);
			if (urlParts.protocol) {
				options.proto = urlParts.protocol.slice(0, -1);
			}
			options.host = urlParts.hostname;
			options.port = urlParts.port;
			options.path = urlParts.path;
		}

		const requestProto = options.proto || "http";
		const body = options.body;
		delete options.body;
		let pipeTo = options.pipeTo;
		delete options.pipeTo;

		const cliProxySettings = await this.$proxyService.getCache();

		options.headers = options.headers || {};
		const headers = options.headers;

		await this.useProxySettings(proxySettings, cliProxySettings, options, headers, requestProto);

		if (!headers.Accept || headers.Accept.indexOf("application/json") < 0) {
			if (headers.Accept) {
				headers.Accept += ", ";
			} else {
				headers.Accept = "";
			}
			headers.Accept += "application/json; charset=UTF-8, */*;q=0.8";
		}

		if (!headers["User-Agent"]) {
			if (!this.defaultUserAgent) {
				//TODO: the user agent client name is also passed explicitly during login and should be kept in sync
				this.defaultUserAgent = `${this.$staticConfig.USER_AGENT_NAME}/${this.$staticConfig.version} (Node.js ${process.versions.node}; ${process.platform}; ${process.arch})`;
				this.$logger.debug("User-Agent: %s", this.defaultUserAgent);
			}

			headers["User-Agent"] = this.defaultUserAgent;
		}

		if (!headers["Accept-Encoding"]) {
			headers["Accept-Encoding"] = "gzip,deflate";
		}

		const result = new Promise<Server.IResponse>((resolve, reject) => {
			let timerId: number;

			const promiseActions: IPromiseActions<Server.IResponse> = {
				resolve,
				reject,
				isResolved: () => false
			};

			if (options.timeout) {
				timerId = setTimeout(() => {
					this.setResponseResult(promiseActions, timerId, { err: new Error(`Request to ${unmodifiedOptions.url} timed out.`) }, );
				}, options.timeout);

				delete options.timeout;
			}

			options.url = options.url || `${options.proto}://${options.host}${options.path}`;
			options.encoding = null;
			options.followAllRedirects = true;

			this.$logger.trace("httpRequest: %s", util.inspect(options));
			const requestObj = request(options);

			requestObj
				.on("error", (err: IHttpRequestError) => {
					this.$logger.trace("An error occurred while sending the request:", err);
					// In case we get a 4xx error code there seems to be no better way than this regex to get the error code
					// the tunnel-agent module that request is using is obscuring the response and hence the statusCode by throwing an error message
					// https://github.com/request/tunnel-agent/blob/eb2b1b19e09ee0e6a2b54eb2612755731b7301dc/index.js#L166
					// in case there is a better way to obtain status code in future version do not hesitate to remove this code
					const errorMessageMatch = err.message.match(HttpClient.STATUS_CODE_REGEX);
					const errorMessageStatusCode = errorMessageMatch && errorMessageMatch[1] && +errorMessageMatch[1];
					const errorMessage = this.getErrorMessage(errorMessageStatusCode, null);
					err.proxyAuthenticationRequired = errorMessageStatusCode === HttpStatusCodes.PROXY_AUTHENTICATION_REQUIRED;
					err.message = errorMessage || err.message;
					this.setResponseResult(promiseActions, timerId, { err });
				})
				.on("response", (response: Server.IRequestResponseData) => {
					const successful = helpers.isRequestSuccessful(response);
					if (!successful) {
						pipeTo = undefined;
					}

					let responseStream = response;
					switch (response.headers["content-encoding"]) {
						case "gzip":
							responseStream = responseStream.pipe(zlib.createGunzip());
							break;
						case "deflate":
							responseStream = responseStream.pipe(zlib.createInflate());
							break;
					}

					if (pipeTo) {
						pipeTo.on("finish", () => {
							this.$logger.trace("httpRequest: Piping done. code = %d", response.statusCode.toString());
							this.setResponseResult(promiseActions, timerId, { response });
						});

						responseStream.pipe(pipeTo);
					} else {
						const data: string[] = [];

						responseStream.on("data", (chunk: string) => {
							data.push(chunk);
						});

						responseStream.on("end", () => {
							this.$logger.trace("httpRequest: Done. code = %d", response.statusCode.toString());
							const responseBody = data.join("");

							if (successful) {
								this.setResponseResult(promiseActions, timerId, { body: responseBody, response });
							} else {
								const errorMessage = this.getErrorMessage(response.statusCode, responseBody);
								const err: any = new Error(errorMessage);
								err.response = response;
								err.body = responseBody;
								this.setResponseResult(promiseActions, timerId, { err });
							}
						});
					}

				});

			this.$logger.trace("httpRequest: Sending:\n%s", this.$logger.prepare(body));

			if (!body || !body.pipe) {
				requestObj.end(body);
			} else {
				body.pipe(requestObj);
			}
		});

		const response = await result;

		if (helpers.isResponseRedirect(response.response)) {
			if (response.response.statusCode === HttpStatusCodes.SEE_OTHER) {
				unmodifiedOptions.method = "GET";
			}

			this.$logger.trace("Begin redirected to %s", response.headers.location);
			unmodifiedOptions.url = response.headers.location;
			return await this.httpRequest(unmodifiedOptions);
		}

		return response;
	}

	private setResponseResult(result: IPromiseActions<Server.IResponse>, timerId: number, resultData: { response?: Server.IRequestResponseData, body?: string, err?: Error }): void {
		if (timerId) {
			clearTimeout(timerId);
			timerId = null;
		}

		if (!result.isResolved()) {
			result.isResolved = () => true;
			if (resultData.err) {
				return result.reject(resultData.err);
			}

			const finalResult: any = resultData;
			finalResult.headers = resultData.response.headers;

			result.resolve(finalResult);
		}
	}

	private getErrorMessage(statusCode: number, body: string): string {
		if (statusCode === HttpStatusCodes.PROXY_AUTHENTICATION_REQUIRED) {
			const clientNameLowerCase = this.$staticConfig.CLIENT_NAME.toLowerCase();
			this.$logger.error(`You can run ${EOL}\t${clientNameLowerCase} proxy set <url> <username> <password>.${EOL}In order to supply ${clientNameLowerCase} with the credentials needed.`);
			return "Your proxy requires authentication.";
		} else if (statusCode === HttpStatusCodes.PAYMENT_REQUIRED) {
			const subscriptionUrl = util.format("%s://%s/appbuilder/account/subscription", this.$config.AB_SERVER_PROTO, this.$config.AB_SERVER);
			return util.format("Your subscription has expired. Go to %s to manage your subscription. Note: After you renew your subscription, " +
				"log out and log back in for the changes to take effect.", subscriptionUrl);
		} else {
			this.$logger.trace("Request was unsuccessful. Server returned: ", body);
			try {
				const err = JSON.parse(body);

				if (_.isString(err)) {
					return err;
				}

				if (err && err.ExceptionMessage) {
					return err.ExceptionMessage;
				}
				if (err && err.Message) {
					return err.Message;
				}
			} catch (parsingFailed) {
				this.$logger.trace("Failed to get error from http request: ", parsingFailed);
				return `The server returned unexpected response: ${body}`;
			}

			return body;
		}
	}

	/**
	 * This method respects the proxySettings (or proxyCache) by modifying headers and options passed to http(s) module.
	 * @param {IProxySettings} proxySettings The settings passed for this specific call.
	 * @param {IProxySettings} cliProxySettings The globally set proxy for this CLI.
	 * @param {any}options The object that will be passed to http(s) module.
	 * @param {any} headers Headers of the current request.
	 * @param {string} requestProto The protocol used for the current request - http or https.
	 */
	private async useProxySettings(proxySettings: IProxySettings, cliProxySettings: IProxySettings, options: any, headers: any, requestProto: string): Promise<void> {
		if (proxySettings || cliProxySettings) {
			const proto = (proxySettings && proxySettings.protocol) || cliProxySettings.protocol || "http:";
			const host = (proxySettings && proxySettings.hostname) || cliProxySettings.hostname;
			const port = (proxySettings && proxySettings.port) || cliProxySettings.port;
			let credentialsPart = "";
			if (cliProxySettings.username && cliProxySettings.password) {
				credentialsPart = `${cliProxySettings.username}:${cliProxySettings.password}@`;
			}

			// Note that proto ends with :
			options.proxy = `${proto}//${credentialsPart}${host}:${port}`;
			options.rejectUnauthorized = proxySettings ? proxySettings.rejectUnauthorized : cliProxySettings.rejectUnauthorized;

			this.$logger.trace("Using proxy: %s", options.proxy);
		}
	}
}
$injector.register("httpClient", HttpClient);
