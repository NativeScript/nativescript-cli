import { SysInfo } from "../lib/sys-info";
import { Yok } from "../lib/common/yok";
import { assert } from "chai";
import { format } from "util";
import * as sinon from "sinon";
import { MacOSVersions, MacOSDeprecationStringFormat } from "../lib/constants";
const verifyNodeVersion = require("../lib/common/verify-node-version");

describe("sysInfo", () => {
	let sandbox: sinon.SinonSandbox = null;
	beforeEach(() => {
		sandbox = sinon.sandbox.create();
	});

	afterEach(() => {
		sandbox.restore();
	});

	const createTestInjector = (): IInjector => {
		const testInjector = new Yok();
		testInjector.register("hostInfo", {
			getMacOSVersion: async (): Promise<string> => null
		});

		testInjector.register("fs", {
			readJson: (filename: string, encoding?: string): any => null
		});

		testInjector.register("sysInfo", SysInfo);

		return testInjector;
	};

	describe("getSystemWarnings", () => {
		const getSystemWarnings = async (opts?: { nodeJsWarning?: string, macOSDeprecatedVersion?: string }): Promise<ISystemWarning[]> => {
			sandbox.stub(verifyNodeVersion, "getNodeWarning").returns(opts && opts.nodeJsWarning ? { message: opts.nodeJsWarning, severity: SystemWarningsSeverity.medium } : null);

			const testInjector = createTestInjector();
			const $hostInfo = testInjector.resolve<IHostInfo>("hostInfo");
			$hostInfo.getMacOSVersion = async (): Promise<string> => opts && opts.macOSDeprecatedVersion;
			const sysInfo = testInjector.resolve<ISysInfo>("sysInfo");
			const warnings = await sysInfo.getSystemWarnings();
			return warnings;
		};

		it("returns empty array when there are no warnings", async () => {
			const warnings = await getSystemWarnings();
			assert.deepEqual(warnings, []);
		});

		it("returns correct single warning when macOS version is deprecated", async () => {
			const macOSDeprecatedVersion = MacOSVersions.Sierra;
			const macOSWarning = { message: format(MacOSDeprecationStringFormat, macOSDeprecatedVersion), severity: SystemWarningsSeverity.high };
			const warnings = await getSystemWarnings({ macOSDeprecatedVersion });
			_.each(warnings, warning => delete warning.toString);
			assert.deepEqual(warnings, [macOSWarning]);
		});

		it("returns correct single warning when Node.js version is deprecated", async () => {
			const nodeJsWarning = { message: "Node.js Warning", severity: SystemWarningsSeverity.medium };
			const warnings = await getSystemWarnings({ nodeJsWarning: nodeJsWarning.message });
			_.each(warnings, warning => delete warning.toString);
			assert.deepEqual(warnings, [nodeJsWarning]);
		});

		it("returns correct warnings when both Node.js and macOS versions are deprecated", async () => {
			const macOSDeprecatedVersion = MacOSVersions.Sierra;
			const macOSWarning = { message: format(MacOSDeprecationStringFormat, macOSDeprecatedVersion), severity: SystemWarningsSeverity.high };
			const nodeJsWarning = { message: "Node.js Warning", severity: SystemWarningsSeverity.medium };
			const warnings = await getSystemWarnings({ macOSDeprecatedVersion, nodeJsWarning: nodeJsWarning.message });
			_.each(warnings, warning => delete warning.toString);
			assert.deepEqual(warnings, [macOSWarning, nodeJsWarning]);
		});
	});

	describe("getMacOSWarningMessage", () => {
		const getMacOSWarning = async (macOSDeprecatedVersion?: string): Promise<ISystemWarning> => {
			sandbox.stub(verifyNodeVersion, "getNodeWarning").returns(null);

			const testInjector = createTestInjector();
			const $hostInfo = testInjector.resolve<IHostInfo>("hostInfo");
			$hostInfo.getMacOSVersion = async (): Promise<string> => macOSDeprecatedVersion;
			const sysInfo = testInjector.resolve<ISysInfo>("sysInfo");
			const warning = await sysInfo.getMacOSWarningMessage();
			return warning;
		};

		it("returns null when macOS version is supported", async () => {
			const warning = await getMacOSWarning();
			assert.deepEqual(warning, null);
		});

		it("returns correct single warning when macOS version is deprecated", async () => {
			const macOSDeprecatedVersion = MacOSVersions.Sierra;
			const macOSWarning: ISystemWarning = { message: format(MacOSDeprecationStringFormat, macOSDeprecatedVersion), severity: SystemWarningsSeverity.high };
			const warning = await getMacOSWarning(macOSDeprecatedVersion);
			delete warning.toString;
			assert.deepEqual(warning, macOSWarning);
		});
	});

	describe("getSupportedNodeVersionRange", () => {
		it("returns range from CLI's package.json", () => {
			const testInjector = createTestInjector();
			const expectedRange = require("../package.json").engines.node;
			const fs = testInjector.resolve<IFileSystem>("fs");
			fs.readJson = () => require("../package.json");
			const sysInfo = testInjector.resolve<ISysInfo>("sysInfo");
			const actualRange = sysInfo.getSupportedNodeVersionRange();
			assert.equal(actualRange, expectedRange);
		});
	});
});
