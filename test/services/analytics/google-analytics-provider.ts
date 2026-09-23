import { assert } from "chai";
import { GoogleAnalyticsProvider } from "../../../lib/services/analytics/google-analytics-provider";
import { GoogleAnalyticsDataType } from "../../../lib/common/enums";
import { GoogleAnalyticsCustomDimensions } from "../../../lib/common/services/analytics/google-analytics-custom-dimensions";
import * as stubs from "../../stubs";

const clientId = "test-client-id";
const measurementId = "G-TESTID";
const apiSecret = "test-secret";

interface ISentRequest {
	url: string;
	method: string;
	headers: any;
	body: any;
}

const createProvider = (opts?: {
	measurementId?: string;
	apiSecret?: string;
}) => {
	const requests: ISentRequest[] = [];

	const provider = new GoogleAnalyticsProvider(
		clientId,
		<any>{ version: "9.0.0" },
		<any>{ getUserAgentString: (proto: string) => `${proto} (test)` },
		<any>new stubs.LoggerStub(),
		<any>{ getCache: async (): Promise<any> => null },
		<any>{
			GA_MEASUREMENT_ID:
				"measurementId" in (opts || {}) ? opts.measurementId : measurementId,
			GA_API_SECRET: "apiSecret" in (opts || {}) ? opts.apiSecret : apiSecret,
		},
		<any>{
			httpRequest: async (options: any) => {
				requests.push({
					url: options.url,
					method: options.method,
					headers: options.headers,
					body: JSON.parse(options.body),
				});
				return {};
			},
		},
		<any>{ logData: (): void => undefined },
	);

	return { provider, requests };
};

describe("GoogleAnalyticsProvider", () => {
	it("posts a command event to the measurement protocol", async () => {
		const { provider, requests } = createProvider();

		await provider.trackHit(<any>{
			googleAnalyticsDataType: GoogleAnalyticsDataType.Page,
			path: "build android",
			title: "build android",
		});

		assert.lengthOf(requests, 1);
		const [request] = requests;

		assert.strictEqual(request.method, "POST");
		assert.include(request.url, "measurement_id=G-TESTID");
		assert.include(request.url, "api_secret=test-secret");
		assert.strictEqual(request.headers["Content-Type"], "application/json");
		assert.strictEqual(request.body.client_id, clientId);
		assert.isTrue(request.body.non_personalized_ads);
		assert.lengthOf(request.body.events, 1);
		assert.strictEqual(request.body.events[0].name, "command");
		assert.strictEqual(
			request.body.events[0].params.command_name,
			"build android",
		);
	});

	it("attributes events to the command that is running", async () => {
		const { provider, requests } = createProvider();

		await provider.trackHit(<any>{
			googleAnalyticsDataType: GoogleAnalyticsDataType.Page,
			path: "build android",
			title: "build android",
		});
		await provider.trackHit(<any>{
			googleAnalyticsDataType: GoogleAnalyticsDataType.Event,
			action: "Build",
			label: "android",
		});

		assert.strictEqual(
			requests[1].body.events[0].params.command_name,
			"build android",
		);
	});

	it("names the event after the action and carries category and label", async () => {
		const { provider, requests } = createProvider();

		await provider.trackHit(<any>{
			googleAnalyticsDataType: GoogleAnalyticsDataType.Event,
			category: "CLI",
			action: "Build",
			label: "android",
			value: 3,
		});

		const [event] = requests[0].body.events;
		assert.strictEqual(event.name, "Build");
		assert.strictEqual(event.params.event_category, "CLI");
		assert.strictEqual(event.params.event_label, "android");
		assert.strictEqual(event.params.value, 3);
	});

	it("translates custom dimension slots into named parameters", async () => {
		const { provider, requests } = createProvider();

		await provider.trackHit(<any>{
			googleAnalyticsDataType: GoogleAnalyticsDataType.Event,
			action: "Build",
			label: "android",
			customDimensions: {
				[GoogleAnalyticsCustomDimensions.projectType]: "Shared",
			},
		});

		const { params } = requests[0].body.events[0];
		assert.strictEqual(params.project_type, "Shared");
		assert.strictEqual(params.cli_version, "9.0.0");
		assert.strictEqual(params.node_version, process.version);
		assert.strictEqual(params.client_uuid, clientId);
		assert.isString(params.session_id);
		// the raw cdN slot names must not survive into the payload
		assert.notProperty(params, GoogleAnalyticsCustomDimensions.projectType);
		assert.notProperty(params, GoogleAnalyticsCustomDimensions.cliVersion);
	});

	it("sanitizes action names that are not valid event names", async () => {
		const cases: [string, string][] = [
			["Build android", "Build_android"],
			["1nvalid-start", "nvalid_start"],
			["", "cli_event"],
			["a".repeat(60), "a".repeat(40)],
		];

		for (const [action, expected] of cases) {
			const { provider, requests } = createProvider();
			await provider.trackHit(<any>{
				googleAnalyticsDataType: GoogleAnalyticsDataType.Event,
				action,
				label: "l",
			});

			assert.strictEqual(requests[0].body.events[0].name, expected, action);
		}
	});

	it("omits dimensions that have no value", async () => {
		const { provider, requests } = createProvider();

		await provider.trackHit(<any>{
			googleAnalyticsDataType: GoogleAnalyticsDataType.Event,
			action: "Build",
			label: "android",
		});

		const { params } = requests[0].body.events[0];
		// projectType and isShared default to null and must not be sent
		assert.notProperty(params, "project_type");
		assert.notProperty(params, "is_shared");
	});

	it("sends nothing when analytics is not configured", async () => {
		for (const opts of [{ measurementId: "" }, { apiSecret: "" }]) {
			const { provider, requests } = createProvider(opts);

			await provider.trackHit(<any>{
				googleAnalyticsDataType: GoogleAnalyticsDataType.Event,
				action: "Build",
				label: "android",
			});

			assert.lengthOf(requests, 0);
		}
	});

	it("swallows transport failures", async () => {
		const provider = new GoogleAnalyticsProvider(
			clientId,
			<any>{ version: "9.0.0" },
			<any>{ getUserAgentString: (proto: string) => proto },
			<any>new stubs.LoggerStub(),
			<any>{ getCache: async (): Promise<any> => null },
			<any>{ GA_MEASUREMENT_ID: measurementId, GA_API_SECRET: apiSecret },
			<any>{
				httpRequest: async (): Promise<any> => {
					throw new Error("network down");
				},
			},
			<any>{ logData: (): void => undefined },
		);

		await provider.trackHit(<any>{
			googleAnalyticsDataType: GoogleAnalyticsDataType.Event,
			action: "Build",
			label: "android",
		});
	});
});
