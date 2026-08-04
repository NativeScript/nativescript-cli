import { Yok } from "../../lib/common/yok";
import { assert } from "chai";
import * as _ from "lodash";
import { LoggerStub, ProjectHelperStub, ErrorsStub } from "../stubs";
import { CONFIG_FILE_NAME_JS, CONFIG_FILE_NAME_TS } from "../../lib/constants";
import { basename, join } from "path";
import * as os from "os";
import * as fs from "fs";
import { IInjector } from "../../lib/common/definitions/yok";
import { IReadFileOptions, IFsStats } from "../../lib/common/declarations";
import { ProjectConfigService } from "../../lib/services/project-config-service";
import { IProjectConfigService } from "../../lib/definitions/project";
import { Options } from "../../lib/options";
import { SettingsService } from "../../lib/common/test/unit-tests/stubs";

const createTestInjector = (
	readTextCallback: (filename: string) => string,
	existsCallback: (filePath: string) => boolean,
	projectDir: string = "/my/project",
): IInjector => {
	const testInjector = new Yok();

	testInjector.register("settingsService", SettingsService);
	testInjector.register("errors", ErrorsStub);
	testInjector.register("options", Options);
	testInjector.register(
		"projectHelper",
		new ProjectHelperStub(null, projectDir),
	);
	testInjector.register("fs", {
		writeJson: (
			filename: string,
			data: any,
			space?: string,
			encoding?: string,
		): void => {
			/** intentionally left blank */
		},

		readText: (
			filename: string,
			encoding?: IReadFileOptions | string,
		): string => {
			return readTextCallback(filename);
		},

		exists: (filePath: string): boolean => existsCallback(filePath),

		readJson: (filePath: string): any => null,

		isRelativePath: (filePath: string): any => true,

		enumerateFilesInDirectorySync: (
			directoryPath: string,
			filterCallback?: (_file: string, _stat: IFsStats) => boolean,
			opts?: {
				enumerateDirectories?: boolean;
				includeEmptyDirectories?: boolean;
			},
			foundFiles?: string[],
		): string[] => [],
	});
	testInjector.register("logger", LoggerStub);
	testInjector.register("injector", testInjector);
	testInjector.register("projectConfigService", ProjectConfigService);
	testInjector.register("cleanupService", {});

	return testInjector;
};

const sampleJSConfig = `module.exports = {
  id: 'io.test.app',
  appResourcesPath: 'App_Resources',
  ios: {
    discardUncaughtJsExceptions: true
  },
  android: {
    discardUncaughtJsExceptions: true,
    v8Flags: '--expose-gc'
  }
}`;

const sampleTSConfig = `export default {
  id: 'io.test.app',
  appResourcesPath: 'App_Resources',
  ios: {
    discardUncaughtJsExceptions: true
  },
  android: {
    discardUncaughtJsExceptions: true,
    v8Flags: '--expose-gc'
  }
} as any;`;

describe("projectConfigService", () => {
	describe("readConfig", () => {
		it("works with JS config", () => {
			const testInjector = createTestInjector(
				(filename) => sampleJSConfig,
				(filePath) => basename(filePath) === CONFIG_FILE_NAME_JS,
			);
			const projectConfigService: IProjectConfigService = testInjector.resolve(
				"projectConfigService",
			);

			const actualValue = projectConfigService.getValue("id");
			assert.deepStrictEqual(actualValue, "io.test.app");
		});

		it("JS config parse deep key path", () => {
			const testInjector = createTestInjector(
				(filename) => sampleJSConfig,
				(filePath) => basename(filePath) === CONFIG_FILE_NAME_JS,
			);
			const projectConfigService: IProjectConfigService = testInjector.resolve(
				"projectConfigService",
			);

			const actualValue = projectConfigService.getValue("android.v8Flags");
			assert.deepStrictEqual(actualValue, "--expose-gc");
		});

		it("works with TS config", () => {
			const testInjector = createTestInjector(
				(filename) => sampleTSConfig,
				(filePath) => basename(filePath) === CONFIG_FILE_NAME_TS,
			);
			const projectConfigService: IProjectConfigService = testInjector.resolve(
				"projectConfigService",
			);

			const actualValue = projectConfigService.getValue("id");
			assert.deepStrictEqual(actualValue, "io.test.app");
		});

		it("TS config parse deep key path", () => {
			const testInjector = createTestInjector(
				(filename) => sampleTSConfig,
				(filePath) => basename(filePath) === CONFIG_FILE_NAME_TS,
			);
			const projectConfigService: IProjectConfigService = testInjector.resolve(
				"projectConfigService",
			);

			const actualValue = projectConfigService.getValue("android.v8Flags");
			assert.deepStrictEqual(actualValue, "--expose-gc");
		});

		it("can read a named JS config file when passing --config", async () => {
			const testInjector = createTestInjector(
				(filename) => sampleJSConfig,
				(filePath) => basename(filePath) === "custom.config.js",
			);

			// mock "--config custom.config.js"
			const options: Options = testInjector.resolve("options") as Options;
			// @ts-ignore
			options.config = "custom.config.js";

			const projectConfigService: IProjectConfigService = testInjector.resolve(
				"projectConfigService",
			);

			const actualValue = projectConfigService.getValue("id");
			assert.deepStrictEqual(actualValue, "io.test.app");
		});

		it("can read a named TS config file when passing --config", async () => {
			const testInjector = createTestInjector(
				(filename) => sampleTSConfig,
				(filePath) => basename(filePath) === "custom.config.ts",
			);

			// mock "--config custom.config.ts"
			const options: Options = testInjector.resolve("options") as Options;
			// @ts-ignore
			options.config = "custom.config.ts";

			const projectConfigService: IProjectConfigService = testInjector.resolve(
				"projectConfigService",
			);

			const actualValue = projectConfigService.getValue("id");
			assert.deepStrictEqual(actualValue, "io.test.app");
		});

		it("can read a named JS config file when passing --config without extension", async () => {
			const testInjector = createTestInjector(
				(filename) => sampleJSConfig,
				(filePath) => basename(filePath) === "custom.config.js",
			);

			// mock "--config custom.config"
			const options: Options = testInjector.resolve("options") as Options;
			// @ts-ignore
			options.config = "custom.config";

			const projectConfigService: IProjectConfigService = testInjector.resolve(
				"projectConfigService",
			);

			const actualValue = projectConfigService.getValue("id");
			assert.deepStrictEqual(actualValue, "io.test.app");
		});

		it("can read a named TS config file when passing --config without extension", async () => {
			const testInjector = createTestInjector(
				(filename) => sampleTSConfig,
				(filePath) => basename(filePath) === "custom.config.ts",
			);

			// mock "--config custom.config"
			const options: Options = testInjector.resolve("options") as Options;
			// @ts-ignore
			options.config = "custom.config";

			const projectConfigService: IProjectConfigService = testInjector.resolve(
				"projectConfigService",
			);

			const actualValue = projectConfigService.getValue("id");
			assert.deepStrictEqual(actualValue, "io.test.app");
		});

		// it("Throws error if no config file found", () => {
		// 	const testInjector = createTestInjector(
		// 		(filename) => null,
		// 		(filePath) => false
		// 	);
		// 	const projectConfigService: IProjectConfigService = testInjector.resolve(
		// 		"projectConfigService"
		// 	);
		// 	assert.throws(() => projectConfigService.getValue("id"));
		// });
		//
		// it("Warns if no config file found", () => {
		// 	const testInjector = createTestInjector(
		// 		(filename) => sampleTSConfig,
		// 		(filePath) =>
		// 			basename(filePath) === CONFIG_FILE_NAME_TS ||
		// 			basename(filePath) === CONFIG_FILE_NAME_JS
		// 	);
		// 	const projectConfigService: IProjectConfigService = testInjector.resolve(
		// 		"projectConfigService"
		// 	);
		// 	const logger: LoggerStub = testInjector.resolve("logger");
		// 	const actualValue = projectConfigService.getValue("id");
		// 	assert.deepStrictEqual(actualValue, "io.test.app");
		// 	assert.deepStrictEqual(
		// 		logger.warnOutput,
		// 		`You have both a ${CONFIG_FILE_NAME_JS} and ${CONFIG_FILE_NAME_TS} file. Defaulting to ${CONFIG_FILE_NAME_TS}.\n`
		// 	);
		// });
	});

	describe("setValue", () => {
		const tempProjectDirs: string[] = [];

		const createProjectDir = (prettierSource?: string): string => {
			const projectDir = fs.mkdtempSync(
				join(os.tmpdir(), "ns-config-service-"),
			);
			tempProjectDirs.push(projectDir);

			if (prettierSource) {
				const prettierDir = join(projectDir, "node_modules", "prettier");
				fs.mkdirSync(prettierDir, { recursive: true });
				fs.writeFileSync(
					join(prettierDir, "package.json"),
					JSON.stringify({ name: "prettier", main: "index.js" }),
				);
				fs.writeFileSync(join(prettierDir, "index.js"), prettierSource);
			}

			return projectDir;
		};

		const setup = (projectDir: string) => {
			let content = sampleTSConfig;
			const writes: string[] = [];
			const testInjector = createTestInjector(
				() => content,
				(filePath) => basename(filePath) === CONFIG_FILE_NAME_TS,
				projectDir,
			);
			const fsStub: any = testInjector.resolve("fs");
			fsStub.writeFile = (filePath: string, data: string) => {
				writes.push(data);
				content = data;
			};

			return {
				writes,
				logger: testInjector.resolve<LoggerStub>("logger"),
				projectConfigService: testInjector.resolve<IProjectConfigService>(
					"projectConfigService",
				),
			};
		};

		afterEach(() => {
			while (tempProjectDirs.length) {
				fs.rmSync(tempProjectDirs.pop(), { recursive: true, force: true });
			}
		});

		it("formats with the prettier installed in the project", async () => {
			const { writes, projectConfigService } = setup(
				createProjectDir(`module.exports = {
					resolveConfig: () => Promise.resolve(null),
					format: (source) => "// project prettier\\n" + source,
				};`),
			);

			const result = await projectConfigService.setValue(
				"id",
				"io.test.updated",
			);

			assert.isTrue(result);
			assert.equal(writes.length, 1);
			assert.include(writes[0], "// project prettier");
			assert.include(writes[0], "io.test.updated");
		});

		it("awaits the project prettier when its format is async", async () => {
			const { writes, projectConfigService } = setup(
				createProjectDir(`module.exports = {
					resolveConfig: () => Promise.resolve(null),
					format: async (source) => "// project prettier\\n" + source,
				};`),
			);

			const result = await projectConfigService.setValue(
				"id",
				"io.test.updated",
			);

			assert.isTrue(result);
			assert.include(writes[0], "// project prettier");
			assert.include(writes[0], "io.test.updated");
		});

		it("writes the unformatted config when prettier fails", async () => {
			const { writes, logger, projectConfigService } = setup(
				createProjectDir(`module.exports = {
					resolveConfig: () => Promise.resolve(null),
					format: () => {
						throw new Error("prettier is broken");
					},
				};`),
			);

			const result = await projectConfigService.setValue(
				"id",
				"io.test.updated",
			);

			assert.isTrue(result);
			assert.equal(writes.length, 1);
			assert.include(writes[0], "io.test.updated");
			assert.include(logger.warnOutput, "Could not format the config");
		});

		it("falls back to the bundled prettier when the project has none", async () => {
			const { writes, logger, projectConfigService } =
				setup(createProjectDir());

			const result = await projectConfigService.setValue(
				"id",
				"io.test.updated",
			);

			assert.isTrue(result);
			assert.equal(writes.length, 1);
			assert.include(writes[0], "io.test.updated");
			assert.notInclude(logger.warnOutput, "Could not format the config");
		});
	});
});
