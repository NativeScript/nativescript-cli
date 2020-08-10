import { Yok } from "../../yok";
import { Logger } from "../../logger/logger";
import * as path from "path";
import * as util from "util";
import { assert } from "chai";
import * as _ from 'lodash';
import * as fileSystemFile from "../../file-system";
import { LoggerConfigData } from "../../../constants";
import { IInjector } from "../../definitions/yok";
import { IFileSystem } from "../../declarations";

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
			trace: "",
			info: "",
			error: "",
			context: {},
			removedContext: {}
		};

		const log4jsLogger = {
			debug: (...args: string[]) => {
				outputs.debug += args.join("");
			},
			trace: (...args: string[]) => {
				outputs.trace += args.join("");
			},
			info: (...args: string[]) => {
				outputs.info += util.format.apply(null, args);
			},
			error: (...args: string[]) => {
				outputs.error += util.format.apply(null, args);
			},
			addContext(key: string, value: any): void {
				outputs.context[key] = value;
			},
			removeContext(key: string): void {
				outputs.removedContext[key] = true;
			}
		};

		// Initialize the logger manually, so we can overwrite the log4jsLogger property
		logger.initialize();
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

	describe("info", () => {
		[undefined, null, false, "string value", 42, { obj: 1 }, ["string value 1", "string value 2"]].forEach(value => {
			it(`handles formatted message with '${value}' value in one of the args`, () => {
				logger.info("test %s", value);
				assert.equal(outputs.info, util.format("test %s", value));
				assert.deepEqual(outputs.context, {}, "Nothing should be added to logger context.");
				assert.deepEqual(outputs.removedContext, {}, "Removed context should be empty.");
			});

			it(`handles formatted message with '${value}' value in one of the args and additional values passed to context`, () => {
				logger.info("test %s", value, { [LoggerConfigData.skipNewLine]: true });
				assert.equal(outputs.info, util.format("test %s", value));
				assert.deepEqual(outputs.context, { [LoggerConfigData.skipNewLine]: true }, `${LoggerConfigData.skipNewLine} should be set with value true.`);
				assert.deepEqual(outputs.removedContext, { [LoggerConfigData.skipNewLine]: true }, `Removed context should contain ${LoggerConfigData.skipNewLine}`);
			});
		});

		it("sets correct context when multiple logger options are passed in one object", () => {
			logger.info("test", { [LoggerConfigData.skipNewLine]: true, [LoggerConfigData.useStderr]: true });
			assert.equal(outputs.info, "test");
			assert.deepEqual(outputs.context, { [LoggerConfigData.skipNewLine]: true, [LoggerConfigData.useStderr]: true });
			assert.deepEqual(outputs.removedContext, { [LoggerConfigData.skipNewLine]: true, [LoggerConfigData.useStderr]: true });
		});

		it("sets correct context when multiple logger options are passed in multiple objects", () => {
			logger.info({ [LoggerConfigData.useStderr]: true }, "test", { [LoggerConfigData.skipNewLine]: true });
			assert.equal(outputs.info, "test");
			assert.deepEqual(outputs.context, { [LoggerConfigData.skipNewLine]: true, [LoggerConfigData.useStderr]: true });
			assert.deepEqual(outputs.removedContext, { [LoggerConfigData.skipNewLine]: true, [LoggerConfigData.useStderr]: true });
		});
	});

	describe("printMarkdown", () => {
		it(`passes markdown formatted text to log4js.info method`, () => {
			logger.printMarkdown("header text\n==");
			assert.isTrue(outputs.info.indexOf("# header text") !== -1);
		});

		it(`passes skipNewLine to log4js context`, () => {
			logger.printMarkdown("`coloured` text");
			assert.isTrue(outputs.info.indexOf("coloured") !== -1);
			assert.deepEqual(outputs.context, { [LoggerConfigData.skipNewLine]: true }, `${LoggerConfigData.skipNewLine} should be set with value true.`);
			assert.deepEqual(outputs.removedContext, { [LoggerConfigData.skipNewLine]: true }, `Removed context should contain ${LoggerConfigData.skipNewLine}`);
		});
	});

	describe("error", () => {
		const errorMessage = "this is error message";
		it(`passes useStderr to log4js context`, () => {
			logger.error(errorMessage);
			assert.equal(outputs.error, errorMessage);
			assert.deepEqual(outputs.context, { [LoggerConfigData.useStderr]: true }, `${LoggerConfigData.useStderr} should be set with value true.`);
			assert.deepEqual(outputs.removedContext, { [LoggerConfigData.useStderr]: true }, `Removed context should contain ${LoggerConfigData.useStderr}`);
		});

		it(`allows overwrite of useStderr`, () => {
			logger.error(errorMessage, { [LoggerConfigData.useStderr]: false });
			assert.equal(outputs.error, errorMessage);
			assert.deepEqual(outputs.context, { [LoggerConfigData.useStderr]: false }, `${LoggerConfigData.useStderr} should be set with value false.`);
			assert.deepEqual(outputs.removedContext, { [LoggerConfigData.useStderr]: true }, `Removed context should contain ${LoggerConfigData.useStderr}`);
		});
	});
});
