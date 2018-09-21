import { Yok } from "../../yok";
import { Logger } from "../../logger";
import * as path from "path";
import { assert } from "chai";
import * as fileSystemFile from "../../file-system";

const passwordReplacement = "*******";
const debugTrace = ["debug", "trace"];
const passwordPair = ["password", "Password"];

function createTestInjector(logLevel?: string): IInjector {
	const testInjector = new Yok();
	testInjector.register("injector", testInjector);
	testInjector.register("config", {});
	testInjector.register("options", {
		log: logLevel
	});
	testInjector.register("logger", Logger);
	testInjector.register("fs", fileSystemFile.FileSystem);

	return testInjector;
}

describe("logger", () => {
	let testInjector: IInjector;
	let logger: any;
	let outputs: any;
	let fs: IFileSystem;

	beforeEach(() => {
		testInjector = createTestInjector();
		logger = testInjector.resolve("logger");
		fs = testInjector.resolve("fs");
		outputs = {
			debug: "",
			trace: ""
		};

		const log4jsLogger = {
			debug: (...args: string[]) => {
				outputs.debug += args.join("");
			},
			trace: (...args: string[]) => {
				outputs.trace += args.join("");
			}
		};

		logger.log4jsLogger = log4jsLogger;
	});

	describe(debugTrace.join("+"), () => {
		_.each(debugTrace, methodName => {

			it(`${methodName} should obfuscate password parameter when the string is larger`, () => {
				const dataFilePath = path.join(__dirname, './mocks/nativescript-cloud-npmjs-result.txt');
				const data = fs.readText(dataFilePath);
				const before = Date.now();
				logger[methodName].call(logger, data);
				const after = Date.now();
				console.log(after - before);

				assert.notEqual(outputs[methodName].indexOf("password:'*******'"), -1);
				assert.isTrue(after - before < 50);
			});

			it(`${methodName} should not get slower when the string is really large`, () => {
				const dataFilePath = path.join(__dirname, './mocks/tns-android-npmjs-result.txt');
				const data = fs.readText(dataFilePath);
				const before = Date.now();
				logger[methodName].call(logger, data);
				const after = Date.now();

				assert.notEqual(outputs[methodName].indexOf("https://github.com/NativeScript/android-runtime"), -1);
				assert.isTrue(after - before < 50);
			});

			_.each(passwordPair, passwordString => {
				it(`${methodName} should obfuscate properties ending in '${passwordString}' with values surrounded by single quotes`, () => {
					const logArgument = `{ certificate${passwordString}: 'pass', otherProperty: 'pass' }`;

					logger[methodName].call(logger, logArgument);

					assert.deepEqual(outputs[methodName], `{ certificate${passwordString}: '${passwordReplacement}', otherProperty: 'pass' }`, `logger.${methodName} should obfuscate ${passwordString} properties`);
				});

				it(`${methodName} should obfuscate properties ending in '${passwordString}' with values surrounded by single quotes when it is the last property`, () => {
					const logArgument = `{ certificate${passwordString}: 'pass' }`;

					logger[methodName].call(logger, logArgument);

					assert.deepEqual(outputs[methodName], `{ certificate${passwordString}: '${passwordReplacement}' }`, `logger.${methodName} should obfuscate ${passwordString} properties`);
				});

				it(`${methodName} should obfuscate properties ending in '${passwordString}' with values surrounded by double quotes`, () => {
					const logArgument = `{ certificate${passwordString}: "pass", otherProperty: "pass" }`;

					logger[methodName].call(logger, logArgument);

					assert.deepEqual(outputs[methodName], `{ certificate${passwordString}: "${passwordReplacement}", otherProperty: "pass" }`, `logger.${methodName} should obfuscate ${passwordString} properties`);
				});

				it(`${methodName} should obfuscate properties ending in '${passwordString}' with values surrounded by double quotes when it is the last property`, () => {
					const logArgument = `{ certificate${passwordString}: "pass" }`;

					logger[methodName].call(logger, logArgument);

					assert.deepEqual(outputs[methodName], `{ certificate${passwordString}: "${passwordReplacement}" }`, `logger.${methodName} should obfuscate ${passwordString} properties`);
				});

				it(`${methodName} should obfuscate '${passwordString}' query parameter when it is the last query parameter`, () => {
					const logArgument = `{ proto: 'https', host: 'platform.telerik.com', path: '/appbuilder/api/itmstransporter/applications?username=dragon.telerikov%40yahoo.com&${passwordString}=somePassword', method: 'POST' }`;

					logger[methodName].call(logger, logArgument);

					assert.deepEqual(outputs[methodName], `{ proto: 'https', host: 'platform.telerik.com', path: '/appbuilder/api/itmstransporter/applications?username=dragon.telerikov%40yahoo.com&${passwordString}=${passwordReplacement}', method: 'POST' }`, `logger.${methodName} should obfuscate ${passwordString} when in query parameter`);
				});

				it(`${methodName} should obfuscate '${passwordString}' query parameter when it is not the last query parameter`, () => {
					const logArgument = `{ proto: 'https', host: 'platform.telerik.com', path: '/appbuilder/api/itmstransporter/applications?username=dragon.telerikov%40yahoo.com&${passwordString}=somePassword&data=someOtherData', method: 'POST' }`;

					logger[methodName].call(logger, logArgument);

					assert.deepEqual(outputs[methodName], `{ proto: 'https', host: 'platform.telerik.com', path: '/appbuilder/api/itmstransporter/applications?username=dragon.telerikov%40yahoo.com&${passwordString}=${passwordReplacement}&data=someOtherData', method: 'POST' }`, `logger.${methodName} should obfuscate ${passwordString} when in query parameter`);
				});
			});
		});
	});

	describe("trace", () => {

		it("should not obfuscate body of other requests", () => {
			const request = "{ proto: 'https', host: 'platform.telerik.com', path: '/appbuilder/api/endpoint/applications?data=somedata, method: 'POST' }";
			const requestBody = '"password"';

			logger.trace(request, requestBody);

			assert.deepEqual(outputs.trace, `${request}${requestBody}`, "logger.trace should not obfuscate body of request unless it is towards api/itmstransporter");
		});
	});
});
