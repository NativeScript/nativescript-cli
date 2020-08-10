import { DoctorService } from "../../lib/services/doctor-service";
import { Yok } from "../../lib/common/yok";
import { LoggerStub, FileSystemStub } from "../stubs";
import { assert } from "chai";
import * as path from "path";
import * as sinon from "sinon";
import * as _ from 'lodash';
import { IProjectDataService } from "../../lib/definitions/project";
import { IVersionsService } from "../../lib/declarations";
import { ICheckEnvironmentRequirementsInput, ICheckEnvironmentRequirementsOutput } from "../../lib/definitions/platform";
import { IAnalyticsService, IHostInfo, IChildProcess, IFileSystem, ISettingsService, IStringDictionary, IDoctorService } from "../../lib/common/declarations";
import { IInjector } from "../../lib/common/definitions/yok";
import { ICacheTimeoutOpts, IUseCacheOpts, IJsonFileSettingsService } from "../../lib/common/definitions/json-file-settings-service";
const nativescriptDoctor = require("nativescript-doctor");

class DoctorServiceInheritor extends DoctorService {
	constructor($analyticsService: IAnalyticsService,
		$hostInfo: IHostInfo,
		$logger: ILogger,
		$childProcess: IChildProcess,
		$injector: IInjector,
		$projectDataService: IProjectDataService,
		$fs: IFileSystem,
		$terminalSpinnerService: ITerminalSpinnerService,
		$versionsService: IVersionsService,
		$settingsService: ISettingsService) {
		super($analyticsService, $hostInfo, $logger, $childProcess, $injector, $projectDataService, $fs, $terminalSpinnerService, $versionsService, $settingsService);
	}

	public getDeprecatedShortImportsInFiles(files: string[], projectDir: string): { file: string, line: string }[] {
		return super.getDeprecatedShortImportsInFiles(files, projectDir);
	}
}

describe("doctorService", () => {
	const createTestInjector = (): IInjector => {
		const testInjector = new Yok();
		testInjector.register("doctorService", DoctorServiceInheritor);
		testInjector.register("analyticsService", {});
		testInjector.register("hostInfo", {});
		testInjector.register("logger", LoggerStub);
		testInjector.register("childProcess", {});
		testInjector.register("projectDataService", {});
		testInjector.register("fs", FileSystemStub);
		testInjector.register("terminalSpinnerService", {
			execute: (spinnerOptions: ITerminalSpinnerOptions, action: () => Promise<any>): Promise<any> => action(),
			createSpinner: (spinnerOptions?: ITerminalSpinnerOptions): ITerminalSpinner => (<any>{
				text: '',
				succeed: (): any => undefined,
				fail: (): any => undefined
			})
		});
		testInjector.register("versionsService", {});
		testInjector.register("settingsService", {
			getProfileDir: (): string => ""
		});
		testInjector.register("jsonFileSettingsService", {
			getSettingValue: async (settingName: string, cacheOpts?: ICacheTimeoutOpts): Promise<any> => undefined,
			saveSetting: async (key: string, value: any, cacheOpts?: IUseCacheOpts): Promise<void> => undefined
		});
		testInjector.register("platformEnvironmentRequirements", {
			checkEnvironmentRequirements: async (input: ICheckEnvironmentRequirementsInput): Promise<ICheckEnvironmentRequirementsOutput> => (<any>{})
		});

		return testInjector;
	};

	describe("checkForDeprecatedShortImportsInAppDir", () => {
		const tnsCoreModulesDirs = [
			"application",
			"data",
			"text"
		];

		const testData: { filesContents: IStringDictionary, expectedShortImports: any[] }[] = [
			{
				filesContents: {
					file1: 'const application = require("application");'
				},
				expectedShortImports: [{ file: "file1", line: 'const application = require("application")' }]
			},
			{
				filesContents: {
					file1: 'const application = require("tns-core-modules/application");'
				},
				expectedShortImports: []
			},
			{
				filesContents: {
					file1: 'const Observable = require("data/observable").Observable;'
				},
				expectedShortImports: [{ file: "file1", line: 'const Observable = require("data/observable").Observable' }]
			},
			{
				filesContents: {
					file1: 'const Observable = require("tns-core-modules/data/observable").Observable;'
				},
				expectedShortImports: []
			},
			{
				filesContents: {
					file1: 'import * as application from "application";'
				},
				expectedShortImports: [{ file: "file1", line: 'import * as application from "application"' }]
			},
			{
				filesContents: {
					file1: 'import * as application from "tns-core-modules/application";'
				},
				expectedShortImports: []
			},
			{
				filesContents: {
					file1: 'import { run } from "application";'
				},
				expectedShortImports: [{ file: "file1", line: 'import { run } from "application"' }]
			},
			{
				filesContents: {
					file1: 'import { run } from "tns-core-modules/application";'
				},
				expectedShortImports: []
			},
			{
				// Using single quotes
				filesContents: {
					file1: "import { run } from 'application';"
				},
				expectedShortImports: [{ file: "file1", line: "import { run } from 'application'" }]
			},
			{
				// Using single quotes
				filesContents: {
					file1: "import { run } from 'tns-core-modules/application';"
				},
				expectedShortImports: []
			},
			{
				filesContents: {
					file1: `const application = require("application");
const Observable = require("data/observable").Observable;
`
				},
				expectedShortImports: [
					{ file: "file1", line: 'const application = require("application")' },
					{ file: "file1", line: 'const Observable = require("data/observable").Observable' },
				]
			},
			{
				filesContents: {
					file1: `const application = require("application");
const Observable = require("tns-core-modules/data/observable").Observable;
`
				},
				expectedShortImports: [
					{ file: "file1", line: 'const application = require("application")' },
				]
			},
			{
				filesContents: {
					file1: `const application = require("application");
const Observable = require("tns-core-modules/data/observable").Observable;
`,
					file2: `const application = require("tns-core-modules/application");
const Observable = require("data/observable").Observable;`
				},
				expectedShortImports: [
					{ file: "file1", line: 'const application = require("application")' },
					{ file: "file2", line: 'const Observable = require("data/observable").Observable' },
				]
			},
			{
				filesContents: {
					// this is not from tns-core-modules
					file1: `const application = require("application1");
const Observable = require("tns-core-modules/data/observable").Observable;
`,
					file2: `const application = require("some-name-tns-core-modules-widgets/application");
const Observable = require("tns-core-modules-widgets/data/observable").Observable;`
				},
				expectedShortImports: []
			},
			{
				filesContents: {
					// several statements on one line
					file1: 'const _ = require("lodash");console.log("application");'
				},
				expectedShortImports: []
			},
			{
				filesContents: {
					// several statements on one line with actual short imports
					file1: 'const _ = require("lodash");const application = require("application");console.log("application");',
					file2: 'const _ = require("lodash");const application = require("application");const Observable = require("data/observable").Observable;'
				},
				expectedShortImports: [
					{ file: "file1", line: 'const application = require("application")' },
					{ file: "file2", line: 'const application = require("application")' },
					{ file: "file2", line: 'const Observable = require("data/observable").Observable' },
				]
			},
			{
				filesContents: {
					// several statements on one line withoutshort imports
					file1: 'const _ = require("lodash");const application = require("tns-core-modules/application");console.log("application");',
					file2: 'const _ = require("lodash");const application = require("tns-core-modules/application");const Observable = require("tns-core-modules/data/observable").Observable;'
				},
				expectedShortImports: []
			},
			{
				filesContents: {
					// minified code that has both require and some of the tns-core-modules subdirs (i.e. text)
					file1: `o.cache&&(r+="&cache="+u(o.cache)),t=["<!DOCTYPE html>","<html>","<head>",'<meta charset="UTF-8" />','<script type="text/javascript">',"   var UWA = {hosts:"+n(e.hosts)+"},",'       curl = {apiName: "require"};`
				},
				expectedShortImports: []
			},
			{
				filesContents: {
					// spaces around require
					file1: 'const application   = require     (  "application"   ); console.log("application");',
				},
				expectedShortImports: [
					{ file: "file1", line: 'const application   = require     (  "application"   )' }
				]
			},
			{
				filesContents: {
					// spaces around require
					file1: 'const application   = require     (  "tns-core-modules/application"   ); console.log("application");',
				},
				expectedShortImports: []
			},
			{
				filesContents: {
					// spaces in import line
					file1: "import     { run }       from    'application'       ;",
				},
				expectedShortImports: [
					{ file: "file1", line: "import     { run }       from    'application'       " }
				]
			},
			{
				filesContents: {
					// spaces in import line
					file1: "import     { run }       from    'tns-core-modules/application'       ;",
				},
				expectedShortImports: []
			},
			{
				// Incorrect behavior, currently by design
				// In case you have a multiline string and one of the lines matches our RegExp we'll detect it as short import
				filesContents: {
					file1: 'const _ = require("lodash");const application = require("application");console.log("application");console.log(`this is line\nyou should import some long words here require("application") module and other words here`)',
				},
				expectedShortImports: [
					{ file: "file1", line: 'const application = require("application")' },
					{ file: "file1", line: 'you should import some long words here require("application") module and other words here`)' },
				]
			},
		];

		it("getDeprecatedShortImportsInFiles returns correct results", () => {
			const testInjector = createTestInjector();
			const doctorService = testInjector.resolve<DoctorServiceInheritor>("doctorService");
			const fs = testInjector.resolve<IFileSystem>("fs");
			fs.getFsStats = (file) => <any>({
				isDirectory: () => true
			});

			fs.readDirectory = (dirPath) => {
				if (dirPath.indexOf(path.join("node_modules", "tns-core-modules"))) {
					return tnsCoreModulesDirs;
				}
			};

			testData.forEach(({ filesContents, expectedShortImports }) => {
				fs.readText = (filePath) => filesContents[filePath];

				const shortImports = doctorService.getDeprecatedShortImportsInFiles(_.keys(filesContents), "projectDir");
				assert.deepEqual(shortImports, expectedShortImports);
			});
		});
	});

	describe("printWarnings", () => {
		let sandbox: sinon.SinonSandbox;

		beforeEach(() => {
			sandbox = sinon.createSandbox();
		});

		afterEach(() => {
			sandbox.restore();
		});
		const successGetInfosResult = [{
			message:
				'Your ANDROID_HOME environment variable is set and points to correct directory.',
			platforms: ['Android'],
			type: 'info'
		},
		{
			message: 'Xcode is installed and is configured properly.',
			platforms: ['iOS'],
			type: 'info'
		}];

		const failedGetInfosResult = [{
			message:
				'The ANDROID_HOME environment variable is not set or it points to a non-existent directory. You will not be able to perform any build-related operations for Android.',
			additionalInformation:
				'To be able to perform Android build-related operations, set the `ANDROID_HOME` variable to point to the root of your Android SDK installation directory.',
			platforms: ['Android'],
			type: 'warning'
		},
		{
			message:
				'WARNING: adb from the Android SDK is not installed or is not configured properly. ',
			additionalInformation:
				'For Android-related operations, the NativeScript CLI will use a built-in version of adb.\nTo avoid possible issues with the native Android emulator, Genymotion or connected\nAndroid devices, verify that you have installed the latest Android SDK and\nits dependencies as described in http://developer.android.com/sdk/index.html#Requirements',
			platforms: ['Android'],
			type: 'warning'
		},
		{
			message: 'Xcode is installed and is configured properly.',
			platforms: ['iOS'],
			type: 'info'
		}];

		it("prints correct message when no issues are detected", async () => {
			const nsDoctorStub = sandbox.stub(nativescriptDoctor.doctor, "getInfos");
			nsDoctorStub.returns(successGetInfosResult);
			const testInjector = createTestInjector();
			const doctorService = testInjector.resolve<IDoctorService>("doctorService");
			const logger = testInjector.resolve<LoggerStub>("logger");
			await doctorService.printWarnings();
			assert.isTrue(logger.output.indexOf("No issues were detected.") !== -1);
		});

		it("prints correct message when issues are detected", async () => {
			const nsDoctorStub = sandbox.stub(nativescriptDoctor.doctor, "getInfos");
			nsDoctorStub.returns(failedGetInfosResult);
			const testInjector = createTestInjector();
			const doctorService = testInjector.resolve<IDoctorService>("doctorService");
			const logger = testInjector.resolve<LoggerStub>("logger");
			await doctorService.printWarnings();
			assert.isTrue(logger.output.indexOf("There seem to be issues with your configuration.") !== -1);
		});

		it("returns result from cached file when they exist and the forceCheck is not passed", async () => {
			const nsDoctorStub = sandbox.stub(nativescriptDoctor.doctor, "getInfos");
			nsDoctorStub.throws(new Error("We should not call nativescript-doctor package when we have results in the file."));

			const testInjector = createTestInjector();
			const doctorService = testInjector.resolve<IDoctorService>("doctorService");
			const jsonFileSettingsService = testInjector.resolve<IJsonFileSettingsService>("jsonFileSettingsService");
			jsonFileSettingsService.getSettingValue = async (settingName: string, cacheOpts?: ICacheTimeoutOpts): Promise<any> => successGetInfosResult;
			let saveSettingValue: any = null;
			jsonFileSettingsService.saveSetting = async (key: string, value: any, cacheOpts?: IUseCacheOpts): Promise<void> => saveSettingValue = value;
			const logger = testInjector.resolve<LoggerStub>("logger");
			await doctorService.printWarnings();
			assert.isTrue(logger.output.indexOf("No issues were detected.") !== -1);
			assert.deepEqual(saveSettingValue, successGetInfosResult);
		});

		it("saves results in cache when there are no warnings", async () => {
			const nsDoctorStub = sandbox.stub(nativescriptDoctor.doctor, "getInfos");
			nsDoctorStub.returns(successGetInfosResult);

			const testInjector = createTestInjector();
			const doctorService = testInjector.resolve<IDoctorService>("doctorService");
			const jsonFileSettingsService = testInjector.resolve<IJsonFileSettingsService>("jsonFileSettingsService");
			let saveSettingValue: any = null;
			jsonFileSettingsService.saveSetting = async (key: string, value: any, cacheOpts?: IUseCacheOpts): Promise<void> => saveSettingValue = value;
			const logger = testInjector.resolve<LoggerStub>("logger");
			await doctorService.printWarnings();
			assert.isTrue(logger.output.indexOf("No issues were detected.") !== -1);
			assert.deepEqual(saveSettingValue, successGetInfosResult);
		});

		it("returns result from nativescript-doctor and saves them in cache when the forceCheck is passed", async () => {
			const nsDoctorStub = sandbox.stub(nativescriptDoctor.doctor, "getInfos");
			nsDoctorStub.returns(successGetInfosResult);

			const testInjector = createTestInjector();
			const doctorService = testInjector.resolve<IDoctorService>("doctorService");
			const jsonFileSettingsService = testInjector.resolve<IJsonFileSettingsService>("jsonFileSettingsService");
			let saveSettingValue: any = null;
			let isGetSettingValueCalled = false;
			jsonFileSettingsService.getSettingValue = async (settingName: string, cacheOpts?: ICacheTimeoutOpts): Promise<any> => {
				isGetSettingValueCalled = true;
				return null;
			};
			jsonFileSettingsService.saveSetting = async (key: string, value: any, cacheOpts?: IUseCacheOpts): Promise<void> => saveSettingValue = value;
			const logger = testInjector.resolve<LoggerStub>("logger");
			await doctorService.printWarnings({ forceCheck: true });
			assert.isTrue(logger.output.indexOf("No issues were detected.") !== -1);
			assert.deepEqual(saveSettingValue, successGetInfosResult);
			assert.isTrue(nsDoctorStub.calledOnce);
			assert.isFalse(isGetSettingValueCalled, "When forceCheck is passed, we should not read the cache file.");
		});

		it("deletes the cache file when issues are detected", async () => {
			const nsDoctorStub = sandbox.stub(nativescriptDoctor.doctor, "getInfos");
			nsDoctorStub.returns(failedGetInfosResult);
			const testInjector = createTestInjector();
			const doctorService = testInjector.resolve<IDoctorService>("doctorService");
			const fs = testInjector.resolve<IFileSystem>("fs");
			let deletedPath = "";
			fs.deleteFile = (filePath: string): void => {deletedPath = filePath; };
			const logger = testInjector.resolve<LoggerStub>("logger");
			await doctorService.printWarnings();
			assert.isTrue(logger.output.indexOf("There seem to be issues with your configuration.") !== -1);
			assert.isTrue(deletedPath.indexOf("doctor-cache.json") !== -1);
		});
	});
});
