import { Yok } from "../lib/common/yok";
import { AndroidToolsInfo } from "../lib/android-tools-info";
import { format } from "util";
import { assert } from "chai";
import { ErrorsStub } from "./stubs";
import { IAndroidToolsInfo } from "../lib/declarations";
import { IInjector } from "../lib/common/definitions/yok";

describe("androidToolsInfo", () => {
	let loggedWarnings: string[] = [];
	let loggedMarkdownMessages: string[] = [];
	const sysRequirementsLink = "";

	beforeEach(() => {
		loggedWarnings = [];
		loggedMarkdownMessages = [];
	});

	const createTestInjector = (): IInjector => {
		const testInjector = new Yok();
		testInjector.register("childProcess", {});

		testInjector.register("errors", ErrorsStub);
		testInjector.register("fs", {});
		testInjector.register("hostInfo", {});
		testInjector.register("logger", {
			warn: (...args: string[]): void => {
				loggedWarnings.push(format.apply(null, args));
			},

			printMarkdown: (...args: string[]): void => {
				loggedMarkdownMessages.push(format.apply(null, args));
			}
		});
		testInjector.register("options", {});
		testInjector.register("staticConfig", {
			SYS_REQUIREMENTS_LINK: sysRequirementsLink
		});
		return testInjector;
	};

	describe("validateJavacVersion", () => {
		it("throws error when passing showWarningsAsErrors to true and javac is not installed", () => {
			const testInjector = createTestInjector();
			const androidToolsInfo = testInjector.resolve<IAndroidToolsInfo>(AndroidToolsInfo);
			assert.throws(() => androidToolsInfo.validateJavacVersion(null, { showWarningsAsErrors: true }), "Error executing command 'javac'. Make sure you have installed The Java Development Kit (JDK) and set JAVA_HOME environment variable.");
		});
	});
});
