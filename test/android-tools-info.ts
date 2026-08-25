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
			},
		});
		testInjector.register("options", {});
		testInjector.register("staticConfig", {
			SYS_REQUIREMENTS_LINK: sysRequirementsLink,
		});
		return testInjector;
	};

	describe("getCompileSdkVersion", () => {
		const resolveCompileSdk = (
			compileSdk: number,
			installedTargets: string[],
		): number => {
			const testInjector = createTestInjector();
			testInjector.register("options", { compileSdk });
			const androidToolsInfo: any = testInjector.resolve(AndroidToolsInfo);
			return androidToolsInfo.getCompileSdkVersion(installedTargets, 36);
		};

		it("accepts a user-specified compile sdk matching an exact installed target", () => {
			assert.equal(resolveCompileSdk(36, ["android-35", "android-36"]), 36);
		});

		it("accepts a user-specified compile sdk installed as a minor-versioned target", () => {
			assert.equal(
				resolveCompileSdk(37, ["android-36", "android-37.0", "android-37.1"]),
				37,
			);
		});

		it("fails when the user-specified compile sdk is not installed", () => {
			assert.throws(
				() => resolveCompileSdk(38, ["android-36", "android-37.0"]),
				"You have specified '38' for compile sdk, but it is not installed on your system.",
			);
		});

		it("does not treat extension targets as the base platform", () => {
			assert.throws(
				() => resolveCompileSdk(35, ["android-34", "android-35-ext15"]),
				"You have specified '35' for compile sdk, but it is not installed on your system.",
			);
		});
	});

	describe("validateJavacVersion", () => {
		it("throws error when passing showWarningsAsErrors to true and javac is not installed", () => {
			const testInjector = createTestInjector();
			const androidToolsInfo =
				testInjector.resolve<IAndroidToolsInfo>(AndroidToolsInfo);
			assert.throws(
				() =>
					androidToolsInfo.validateJavacVersion(null, {
						showWarningsAsErrors: true,
					}),
				"Error executing command 'javac'. Make sure you have installed The Java Development Kit (JDK) and set JAVA_HOME environment variable.",
			);
		});
	});
});
