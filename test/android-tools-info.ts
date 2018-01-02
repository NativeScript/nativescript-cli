import { Yok } from "../lib/common/yok";
import { AndroidToolsInfo } from "../lib/android-tools-info";
import { EOL } from "os";
import { format } from "util";
import { assert } from "chai";

interface ITestData {
	javacVersion: string;
	expectedResult: boolean;
	warnings?: string[];
}

describe("androidToolsInfo", () => {
	let loggedWarnings: string[] = [];
	let loggedMarkdownMessages: string[] = [];
	const sysRequirementsLink = "";

	const additionalMsg = "You will not be able to build your projects for Android." + EOL
		+ "To be able to build for Android, verify that you have installed The Java Development Kit (JDK) and configured it according to system requirements as" + EOL +
		" described in " + sysRequirementsLink;

	beforeEach(() => {
		loggedWarnings = [];
		loggedMarkdownMessages = [];
	});

	const createTestInjector = (): IInjector => {
		const testInjector = new Yok();
		testInjector.register("childProcess", {});
		testInjector.register("errors", {
			failWithoutHelp: (message: string, ...args: any[]): any => {
				const loggedError = format(message, args);
				throw new Error(loggedError);
			}
		});
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
		const testData: ITestData[] = [
			{
				javacVersion: "1.8.0",
				expectedResult: false
			},
			{
				javacVersion: "1.8.0_152",
				expectedResult: false
			},
			{
				javacVersion: "9",
				expectedResult: true,
				warnings: ["Javac version 9 is not supported. You have to install version 1.8.0."]
			},
			{
				javacVersion: "9.0.1",
				expectedResult: true,
				warnings: ["Javac version 9.0.1 is not supported. You have to install version 1.8.0."]
			},
			{
				javacVersion: "1.7.0",
				expectedResult: true,
				warnings: ["Javac version 1.7.0 is not supported. You have to install at least 1.8.0."]
			},
			{
				javacVersion: "1.7.0_132",
				expectedResult: true,
				warnings: ["Javac version 1.7.0_132 is not supported. You have to install at least 1.8.0."]
			},
			{
				javacVersion: null,
				expectedResult: true,
				warnings: ["Error executing command 'javac'. Make sure you have installed The Java Development Kit (JDK) and set JAVA_HOME environment variable."]
			}
		];

		_.each(testData, ({ javacVersion, expectedResult, warnings }) => {
			it(`returns ${expectedResult} when version is ${javacVersion}`, () => {
				const testInjector = createTestInjector();
				const androidToolsInfo = testInjector.resolve<IAndroidToolsInfo>(AndroidToolsInfo);
				assert.deepEqual(androidToolsInfo.validateJavacVersion(javacVersion), expectedResult);
				if (warnings && warnings.length) {
					assert.deepEqual(loggedWarnings, warnings);
					assert.deepEqual(loggedMarkdownMessages, [additionalMsg]);
				} else {
					assert.equal(loggedWarnings.length, 0);
					assert.equal(loggedMarkdownMessages.length, 0);
				}
			});
		});

		it("throws error when passing showWarningsAsErrors to true and javac is not installed", () => {
			const testInjector = createTestInjector();
			const androidToolsInfo = testInjector.resolve<IAndroidToolsInfo>(AndroidToolsInfo);
			assert.throws(() => androidToolsInfo.validateJavacVersion(null, { showWarningsAsErrors: true }), "Error executing command 'javac'. Make sure you have installed The Java Development Kit (JDK) and set JAVA_HOME environment variable.");
		});
	});
});
