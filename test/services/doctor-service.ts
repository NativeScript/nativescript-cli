import { DoctorService } from "../../lib/services/doctor-service";
import { Yok } from "../../lib/common/yok";
import { LoggerStub } from "../stubs";
import { assert } from "chai";
import * as path from "path";

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
		testInjector.register("fs", {});
		testInjector.register("terminalSpinnerService", {});
		testInjector.register("versionsService", {});
		testInjector.register("settingsService", {
			getProfileDir: (): string => ""
		});
		testInjector.register("jsonFileSettingsService", {
			getSettingValue: async (settingName: string, cacheOpts?: ICacheTimeoutOpts): Promise<any> => undefined,
			saveSetting: async (key: string, value: any, cacheOpts?: IUseCacheOpts): Promise<void> => undefined
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
});
