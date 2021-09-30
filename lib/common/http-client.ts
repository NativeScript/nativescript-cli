import * as _ from "lodash";
import { EOL } from "os";
import * as util from "util";
import { Server, IProxySettings, IProxyService } from "./declarations";
import { injector } from "./yok";
import axios from "axios";
import { HttpStatusCodes } from "./constants";
import * as tunnel from "tunnel";

export class HttpClient implements Server.IHttpClient {
	private static STUCK_REQUEST_ERROR_MESSAGE =
		"The request can't receive any response.";
	private static STUCK_RESPONSE_ERROR_MESSAGE =
		"Can't receive all parts of the response.";

	private defaultUserAgent: string;

	constructor(
		private $logger: ILogger,
		private $proxyService: IProxyService,
		private $staticConfig: Config.IStaticConfig
	) {}

	public async httpRequest(
		options: any,
		proxySettings?: IProxySettings
	): Promise<Server.IResponse> {
		try {
			const result = await this.httpRequestCore(options, proxySettings);
			return {
				response: result,
				body: result.body,
				headers: result.headers,
			};
		} catch (err) {
			if (
				err.message === HttpClient.STUCK_REQUEST_ERROR_MESSAGE ||
				err.message === HttpClient.STUCK_RESPONSE_ERROR_MESSAGE
			) {
				// Retry the request immediately because there are at least 10 seconds between the two requests.
				// We have to retry only once the sporadically stuck requests/responses.
				// We can add exponential backoff retry here if we decide that we need to workaround bigger network issues on the client side.
				this.$logger.warn(
					"%s Retrying request to %s...",
					err.message,
					options.url || options
				);
				const retryResult = await this.httpRequestCore(options, proxySettings);
				return {
					response: retryResult,
					body: retryResult.body,
					headers: retryResult.headers,
				};
			}

			throw err;
		}
	}

	private async httpRequestCore(
		options: any,
		proxySettings?: IProxySettings
	): Promise<Server.IResponse> {
		if (_.isString(options)) {
			options = {
				url: options,
				method: "GET",
			};
		}

		const cliProxySettings = await this.$proxyService.getCache();
		const requestProto = options.proto || "http";

		options.headers = options.headers || {};
		const headers = options.headers;

		await this.useProxySettings(
			proxySettings,
			cliProxySettings,
			options,
			headers,
			requestProto
		);

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

		this.$logger.trace("httpRequest: %s", util.inspect(options));

		let agent;
		if (cliProxySettings) {
			agent = tunnel.httpsOverHttp({
				proxy: {
					host: cliProxySettings.hostname,
					port: parseInt(cliProxySettings.port),
				},
			});
		}
		const result = await axios({
			url: options.url,
			headers: options.headers,
			method: options.method,
			proxy: false,
			httpAgent: agent,
			data: data,
		}).catch((err) => {
			this.$logger.trace("An error occurred while sending the request:", err);
			if (err.response) {
				// The request was made and the server responded with a status code
				// that falls out of the range of 2xx
				const errorMessage = this.getErrorMessage(err.response.status, null);

				err.proxyAuthenticationRequired =
					err.response.status === HttpStatusCodes.PROXY_AUTHENTICATION_REQUIRED;

				err.message = errorMessage || err.message;
			} else if (err.request) {
				// The request was made but no response was received
				// `err.request` is an instance of XMLHttpRequest in the browser and an instance of
			} else {
				// Something happened in setting up the request that triggered an Error
			}
			throw err;
		});

		if (result) {
			this.$logger.trace(
				"httpRequest: Done. code = %d",
				result.status.toString()
			);

			return {
				response: result,
				body: JSON.stringify(result.data),
				headers: result.headers,
			};
		}
	}

	private getErrorMessage(statusCode: number, body: string): string {
		if (statusCode === HttpStatusCodes.PROXY_AUTHENTICATION_REQUIRED) {
			const clientNameLowerCase = this.$staticConfig.CLIENT_NAME.toLowerCase();
			this.$logger.error(
				`You can run ${EOL}\t${clientNameLowerCase} proxy set <url> <username> <password>.${EOL}In order to supply ${clientNameLowerCase} with the credentials needed.`
			);
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
				this.$logger.trace(
					"Failed to get error from http request: ",
					parsingFailed
				);
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
	private async useProxySettings(
		proxySettings: IProxySettings,
		cliProxySettings: IProxySettings,
		options: any,
		headers: any,
		requestProto: string
	): Promise<void> {
		const isLocalRequest =
			options.host === "localhost" || options.host === "127.0.0.1";
		// don't use the proxy for requests to localhost
		if (!isLocalRequest && (proxySettings || cliProxySettings)) {
			const proto =
				(proxySettings && proxySettings.protocol) ||
				cliProxySettings.protocol ||
				"http:";
			const host =
				(proxySettings && proxySettings.hostname) || cliProxySettings.hostname;
			const port =
				(proxySettings && proxySettings.port) || cliProxySettings.port;
			let credentialsPart = "";
			if (cliProxySettings.username && cliProxySettings.password) {
				credentialsPart = `${cliProxySettings.username}:${cliProxySettings.password}@`;
			}

			// Note that proto ends with :
			options.proxy = `${proto}//${credentialsPart}${host}:${port}`;
			options.rejectUnauthorized = proxySettings
				? proxySettings.rejectUnauthorized
				: cliProxySettings.rejectUnauthorized;

			this.$logger.trace("Using proxy: %s", options.proxy);
		}
	}
}
injector.register("httpClient", HttpClient);
