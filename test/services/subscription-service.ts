import { Yok } from "../../lib/common/yok";
import { assert } from "chai";
import { SubscriptionService } from "../../lib/services/subscription-service";
import { LoggerStub } from "../stubs";
import { stringify } from "querystring";
import { SubscribeForNewsletterMessages } from "../../lib/constants";
import * as prompt from "inquirer";
const helpers = require("../../lib/common/helpers");

interface IValidateTestData {
	name: string;
	valuePassedToValidate: string;
	expectedResult: boolean | string;
}

const createTestInjector = (): IInjector => {
	const testInjector = new Yok();
	testInjector.register("logger", LoggerStub);

	testInjector.register("userSettingsService", {
		getSettingValue: async (value: string) => true,
		saveSetting: async (key: string, value: any): Promise<void> => undefined
	});

	testInjector.register("prompter", {
		get: async (schemas: prompt.Question[]): Promise<any> => ({
			inputEmail: "SomeEmail"
		})
	});

	testInjector.register("httpClient", {
		httpRequest: async (options: any, proxySettings?: IProxySettings): Promise<Server.IResponse> => undefined
	});

	return testInjector;
};

class SubscriptionServiceTester extends SubscriptionService {
	public shouldAskForEmailResult: boolean = null;

	constructor($httpClient: Server.IHttpClient,
		$prompter: IPrompter,
		$userSettingsService: IUserSettingsService,
		$logger: ILogger) {
		super($httpClient, $prompter, $userSettingsService, $logger);
	}

	public async shouldAskForEmail(): Promise<boolean> {
		if (this.shouldAskForEmailResult !== null) {
			return this.shouldAskForEmailResult;
		}

		return super.shouldAskForEmail();
	}
}

describe("subscriptionService", () => {
	describe("shouldAskForEmail", () => {
		describe("returns false", () => {
			it("when terminal is not interactive", async () => {
				const originalIsInteractive = helpers.isInteractive;
				helpers.isInteractive = () => false;

				const testInjector = createTestInjector();
				const subscriptionService = testInjector.resolve<SubscriptionServiceTester>(SubscriptionServiceTester);
				const shouldAskForEmailResult = await subscriptionService.shouldAskForEmail();

				helpers.isInteractive = originalIsInteractive;

				assert.isFalse(shouldAskForEmailResult, "When console is not interactive, we should not ask for email.");
			});

			it("when environment variable CLI_NOPROMPT is set to 1", async () => {
				const originalIsInteractive = helpers.isInteractive;
				helpers.isInteractive = () => true;

				const originalCliNoPrompt = process.env.CLI_NOPROMPT;
				process.env.CLI_NOPROMPT = "1";

				const testInjector = createTestInjector();
				const subscriptionService = testInjector.resolve<SubscriptionServiceTester>(SubscriptionServiceTester);
				const shouldAskForEmailResult = await subscriptionService.shouldAskForEmail();

				helpers.isInteractive = originalIsInteractive;
				process.env.CLI_NOPROMPT = originalCliNoPrompt;

				assert.isFalse(shouldAskForEmailResult, "When the environment variable CLI_NOPROMPT is set to 1, we should not ask for email.");
			});

			it("when user had already been asked for mail", async () => {
				const originalIsInteractive = helpers.isInteractive;
				helpers.isInteractive = () => true;

				const originalCliNoPrompt = process.env.CLI_NOPROMPT;
				process.env.CLI_NOPROMPT = "random_value";

				const testInjector = createTestInjector();
				const subscriptionService = testInjector.resolve<SubscriptionServiceTester>(SubscriptionServiceTester);
				const shouldAskForEmailResult = await subscriptionService.shouldAskForEmail();

				helpers.isInteractive = originalIsInteractive;
				process.env.CLI_NOPROMPT = originalCliNoPrompt;

				assert.isFalse(shouldAskForEmailResult, "When the user had already been asked for mail, we should not ask for email.");
			});
		});

		describe("returns true", () => {
			it("when console is interactive, CLI_NOPROMPT is not 1 and we have not asked user before that", async () => {
				const originalIsInteractive = helpers.isInteractive;
				helpers.isInteractive = () => true;

				const originalCliNoPrompt = process.env.CLI_NOPROMPT;
				process.env.CLI_NOPROMPT = "random_value";

				const testInjector = createTestInjector();
				const userSettingsService = testInjector.resolve<IUserSettingsService>("userSettingsService");
				userSettingsService.getSettingValue = async (settingName: string): Promise<any> => false;

				const subscriptionService = testInjector.resolve<SubscriptionServiceTester>(SubscriptionServiceTester);
				const shouldAskForEmailResult = await subscriptionService.shouldAskForEmail();

				helpers.isInteractive = originalIsInteractive;
				process.env.CLI_NOPROMPT = originalCliNoPrompt;

				assert.isTrue(shouldAskForEmailResult, "We should ask the user for email when console is interactiv, CLI_NOPROMPT is not 1 and we have never asked the user before.");
			});
		});
	});

	describe("subscribeForNewsletter", () => {
		it("does nothing when shouldAskForEmail returns false", async () => {
			const testInjector = createTestInjector();
			const subscriptionService = testInjector.resolve<SubscriptionServiceTester>(SubscriptionServiceTester);
			subscriptionService.shouldAskForEmailResult = false;
			const logger = testInjector.resolve<LoggerStub>("logger");
			let loggerOutput = "";
			logger.info = (...args: string[]): void => {
				loggerOutput += args.join(" ");
			};

			await subscriptionService.subscribeForNewsletter();
			assert.deepEqual(loggerOutput, "");
		});

		it("shows message that asks for e-mail address", async () => {
			const testInjector = createTestInjector();
			const subscriptionService = testInjector.resolve<SubscriptionServiceTester>(SubscriptionServiceTester);
			subscriptionService.shouldAskForEmailResult = true;

			const logger = testInjector.resolve<LoggerStub>("logger");
			let loggerOutput = "";

			logger.info = (...args: string[]): void => {
				loggerOutput += args.join(" ");
			};

			logger.printMarkdown = (message: string): void => {
				loggerOutput += message;
			};

			await subscriptionService.subscribeForNewsletter();

			assert.equal(loggerOutput, `${SubscribeForNewsletterMessages.ReviewPrivacyPolicyMsg}${SubscribeForNewsletterMessages.AgreeToReceiveEmailMsg}`);
		});

		const expectedMessageInPrompter = SubscribeForNewsletterMessages.PromptMsg;
		it(`calls prompter with specific message - ${expectedMessageInPrompter}`, async () => {
			const testInjector = createTestInjector();
			const subscriptionService = testInjector.resolve<SubscriptionServiceTester>(SubscriptionServiceTester);
			subscriptionService.shouldAskForEmailResult = true;
			const prompter = testInjector.resolve<IPrompter>("prompter");
			let schemasPassedToPromter: prompt.Question[] = null;
			prompter.get = async (schemas: prompt.Question[]): Promise<any> => {
				schemasPassedToPromter = schemas;

				return { inputEmail: "SomeEmail" };
			};

			await subscriptionService.subscribeForNewsletter();

			assert.isNotNull(schemasPassedToPromter, "Prompter should have been called.");
			assert.equal(schemasPassedToPromter.length, 1, "A single schema should have been passed to schemas.");

			assert.equal(schemasPassedToPromter[0].message, expectedMessageInPrompter);
		});

		describe("calls prompter with validate method", () => {
			const testData: IValidateTestData[] = [
				{
					name: "returning true when empty string is passed",
					valuePassedToValidate: "",
					expectedResult: true
				},
				{
					name: "returning true when passing valid email",
					valuePassedToValidate: "abc@def.gh",
					expectedResult: true
				},
				{
					name: "returning specific message when invalid email is passed",
					valuePassedToValidate: "abcdef.gh",
					expectedResult: "Please provide a valid e-mail or simply leave it blank."
				}
			];

			_.each(testData, testCase => {
				it(testCase.name, async () => {
					const testInjector = createTestInjector();
					const subscriptionService = testInjector.resolve<SubscriptionServiceTester>(SubscriptionServiceTester);
					subscriptionService.shouldAskForEmailResult = true;
					const prompter = testInjector.resolve<IPrompter>("prompter");
					let schemasPassedToPromter: prompt.Question[] = null;
					prompter.get = async (schemas: prompt.Question[]): Promise<any> => {
						schemasPassedToPromter = schemas;
						return { inputEmail: "SomeEmail" };
					};

					await subscriptionService.subscribeForNewsletter();

					const schemaPassedToPromter = schemasPassedToPromter[0];
					const resultOfValidateMethod = schemaPassedToPromter.validate(testCase.valuePassedToValidate);
					assert.equal(resultOfValidateMethod, testCase.expectedResult);
				});
			});

		});

		const emailRegisteredKey = "EMAIL_REGISTERED";
		it(`persists ${emailRegisteredKey} setting with value true in user settings`, async () => {
			const testInjector = createTestInjector();
			const subscriptionService = testInjector.resolve<SubscriptionServiceTester>(SubscriptionServiceTester);
			subscriptionService.shouldAskForEmailResult = true;
			const userSettingsService = testInjector.resolve<IUserSettingsService>("userSettingsService");
			let keyPassedToSaveSetting: string = null;
			let valuePassedToSaveSetting: boolean = null;
			userSettingsService.saveSetting = async (key: string, value: any): Promise<void> => {
				keyPassedToSaveSetting = key;
				valuePassedToSaveSetting = value;
			};

			await subscriptionService.subscribeForNewsletter();

			assert.deepEqual(keyPassedToSaveSetting, emailRegisteredKey);
			assert.deepEqual(valuePassedToSaveSetting, true);
		});

		it("calls httpRequest with concrete data", async () => {
			const email = "abc@def.gh";

			const postData = stringify({
				'elqFormName': "NativeScript_IncludeinEmail",
				'elqSiteID': '1325',
				'emailAddress': email,
				'elqCookieWrite': '0'
			});

			const expectedOptions = {
				url: 'https://s1325.t.eloqua.com/e/f2',
				method: 'POST',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
					'Content-Length': postData.length
				},
				body: postData
			};

			const testInjector = createTestInjector();

			const prompter = testInjector.resolve<IPrompter>("prompter");
			prompter.get = async (schemas: prompt.Question[]): Promise<any> => {
				return { inputEmail: email };
			};

			const httpClient = testInjector.resolve<Server.IHttpClient>("httpClient");
			let optionsPassedToHttpRequest: any = null;
			httpClient.httpRequest = async (options: any, proxySettings?: IProxySettings): Promise<Server.IResponse> => {
				optionsPassedToHttpRequest = options;
				return null;
			};

			const subscriptionService = testInjector.resolve<SubscriptionServiceTester>(SubscriptionServiceTester);
			subscriptionService.shouldAskForEmailResult = true;

			await subscriptionService.subscribeForNewsletter();

			assert.deepEqual(optionsPassedToHttpRequest, expectedOptions);
		});
	});
});
