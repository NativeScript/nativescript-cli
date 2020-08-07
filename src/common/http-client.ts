import * as url from "url";
import { EOL } from "os";
import { TLSSocket } from "tls";
import * as helpers from "./helpers";
import * as zlib from "zlib";
import * as util from "util";
import { HttpStatusCodes } from "./constants";
import * as request from "request";
import { IHttpRequestError, IPromiseActions, IProxyService, IProxySettings, Server } from "./declarations";
import * as _ from "lodash";

export class HttpClient implements Server.IHttpClient {
	private static STATUS_CODE_REGEX = /statuscode=(\d+)/i;
	private static STUCK_REQUEST_ERROR_MESSAGE = "The request can't receive any response.";
	private static STUCK_RESPONSE_ERROR_MESSAGE = "Can't receive all parts of the response.";
	private static STUCK_REQUEST_TIMEOUT = 60000;
	// We receive multiple response packets every ms but we don't need to be very aggressive here.
	private static STUCK_RESPONSE_CHECK_INTERVAL = 10000;

	private defaultUserAgent: string;

	constructor(private $logger: ILogger,
				private $proxyService: IProxyService,
				private $staticConfig: Config.IStaticConfig) {
	}

	public async httpRequest(options: any, proxySettings?: IProxySettings): Promise<Server.IResponse> {
		try {
			const result = await this.httpRequestCore(options, proxySettings);
			return result;
		} catch (err) {
			if (err.message === HttpClient.STUCK_REQUEST_ERROR_MESSAGE || err.message === HttpClient.STUCK_RESPONSE_ERROR_MESSAGE) {
				// Retry the request immediately because there are at least 10 seconds between the two requests.
				// We have to retry only once the sporadically stuck requests/responses.
				// We can add exponential backoff retry here if we decide that we need to workaround bigger network issues on the client side.
				this.$logger.warn("%s Retrying request to %s...", err.message, options.url || options);
				const retryResult = await this.httpRequestCore(options, proxySettings);
				return retryResult;
			}

			throw err;
		}
	}

	private async httpRequestCore(options: any, proxySettings?: IProxySettings): Promise<Server.IResponse> {
		if (_.isString(options)) {
			options = {
				url: options,
				method: "GET"
			};
		}

		const clonedOptions = _.cloneDeep(options);

		if (clonedOptions.url) {
			const urlParts = url.parse(clonedOptions.url);
			if (urlParts.protocol) {
				clonedOptions.proto = urlParts.protocol.slice(0, -1);
			}
			clonedOptions.host = urlParts.hostname;
			clonedOptions.port = urlParts.port;
			clonedOptions.path = urlParts.path;
		}

		const requestProto = clonedOptions.proto || "http";
		const body = clonedOptions.body;
		delete clonedOptions.body;
		let pipeTo = options.pipeTo; // Use the real stream because the _.cloneDeep can't clone the internal state of a stream.
		delete clonedOptions.pipeTo;

		const cliProxySettings = await this.$proxyService.getCache();

		clonedOptions.headers = clonedOptions.headers || {};
		const headers = clonedOptions.headers;

		await this.useProxySettings(proxySettings, cliProxySettings, clonedOptions, headers, requestProto);

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
			let timerId: NodeJS.Timer;
			const cleanupRequestData: ICleanupRequestData = Object.create({timers: []});

			const promiseActions: IPromiseActions<Server.IResponse> = {
				resolve,
				reject,
				isResolved: () => false
			};

			clonedOptions.url = clonedOptions.url || `${clonedOptions.proto}://${clonedOptions.host}${clonedOptions.path}`;
			if (clonedOptions.timeout) {
				timerId = setTimeout(() => {
					this.setResponseResult(promiseActions, cleanupRequestData, {err: new Error(`Request to ${clonedOptions.url} timed out.`)});
				}, clonedOptions.timeout);
				cleanupRequestData.timers.push(timerId);

				delete clonedOptions.timeout;
			}

			clonedOptions.encoding = null;
			clonedOptions.followAllRedirects = true;

			this.$logger.trace("httpRequest: %s", util.inspect(clonedOptions));
			const requestObj = request(clonedOptions);
			cleanupRequestData.req = requestObj;

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
					this.setResponseResult(promiseActions, cleanupRequestData, {err});
				})
				.on("socket", (s: TLSSocket) => {
					let stuckRequestTimerId: NodeJS.Timer;

					stuckRequestTimerId = setTimeout(() => {
						this.setResponseResult(promiseActions, cleanupRequestData, {err: new Error(HttpClient.STUCK_REQUEST_ERROR_MESSAGE)});
					}, clonedOptions.timeout || HttpClient.STUCK_REQUEST_TIMEOUT);

					cleanupRequestData.timers.push(stuckRequestTimerId);

					s.once("secureConnect", () => {
						clearTimeout(stuckRequestTimerId);
						stuckRequestTimerId = null;
					});
				})
				.on("response", (responseData: Server.IRequestResponseData) => {
					cleanupRequestData.res = responseData;
					let lastChunkTimestamp = Date.now();
					cleanupRequestData.stuckResponseIntervalId = setInterval(() => {
						if (Date.now() - lastChunkTimestamp > HttpClient.STUCK_RESPONSE_CHECK_INTERVAL) {
							this.setResponseResult(promiseActions, cleanupRequestData, {err: new Error(HttpClient.STUCK_RESPONSE_ERROR_MESSAGE)});
						}
					}, HttpClient.STUCK_RESPONSE_CHECK_INTERVAL);
					const successful = helpers.isRequestSuccessful(responseData) || responseData.statusCode === HttpStatusCodes.NOT_MODIFIED;
					if (!successful) {
						pipeTo = undefined;
					}

					let responseStream = responseData;
					responseStream.on("data", (chunk: string) => {
						lastChunkTimestamp = Date.now();
					});
					switch (responseData.headers["content-encoding"]) {
						case "gzip":
							responseStream = responseStream.pipe(zlib.createGunzip());
							break;
						case "deflate":
							responseStream = responseStream.pipe(zlib.createInflate());
							break;
					}

					if (pipeTo) {
						pipeTo.on("finish", () => {
							this.$logger.trace("httpRequest: Piping done. code = %d", responseData.statusCode.toString());
							this.setResponseResult(promiseActions, cleanupRequestData, {response: responseData});
						});

						responseStream.pipe(pipeTo);
					} else {
						const data: string[] = [];

						responseStream.on("data", (chunk: string) => {
							data.push(chunk);
						});

						responseStream.on("end", () => {
							this.$logger.trace("httpRequest: Done. code = %d", responseData.statusCode.toString());
							const responseBody = data.join("");

							if (successful) {
								this.setResponseResult(promiseActions, cleanupRequestData, {
									body: responseBody,
									response: responseData
								});
							} else {
								const errorMessage = this.getErrorMessage(responseData.statusCode, responseBody);
								const err: any = new Error(errorMessage);
								err.response = responseData;
								err.body = responseBody;
								this.setResponseResult(promiseActions, cleanupRequestData, {err});
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
			const unmodifiedOptions = _.cloneDeep(options);
			if (response.response.statusCode === HttpStatusCodes.SEE_OTHER) {
				unmodifiedOptions.method = "GET";
			}

			this.$logger.trace("Begin redirected to %s", response.headers.location);
			unmodifiedOptions.url = response.headers.location;
			return await this.httpRequest(unmodifiedOptions);
		}

		return response;
	}

	private setResponseResult(result: IPromiseActions<Server.IResponse>, cleanupRequestData: ICleanupRequestData, resultData: { response?: Server.IRequestResponseData, body?: string, err?: Error }): void {
		this.cleanupAfterRequest(cleanupRequestData);
		if (!result.isResolved()) {
			result.isResolved = () => true;
			if (resultData.err || !resultData.response.complete) {
				return result.reject(resultData.err || new Error("Request canceled"));
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
			return "Your subscription has expired.";
		} else if (statusCode === HttpStatusCodes.CONFLICTING_RESOURCE) {
			return "The request conflicts with the current state of the server.";
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
		const isLocalRequest = options.host === "localhost" || options.host === "127.0.0.1";
		// don't use the proxy for requests to localhost
		if (!isLocalRequest && (proxySettings || cliProxySettings)) {
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

	private cleanupAfterRequest(data: ICleanupRequestData): void {
		data.timers.forEach(t => {
			if (t) {
				clearTimeout(t);
				t = null;
			}
		});

		if (data.stuckResponseIntervalId) {
			clearInterval(data.stuckResponseIntervalId);
			data.stuckResponseIntervalId = null;
		}

		if (data.req) {
			data.req.abort();
		}

		if (data.res) {
			data.res.destroy();
		}
	}

}

interface ICleanupRequestData {
	timers: NodeJS.Timer[];
	stuckResponseIntervalId: NodeJS.Timer;
	req: request.Request;
	res: Server.IRequestResponseData;
}

$injector.register("httpClient", HttpClient);
