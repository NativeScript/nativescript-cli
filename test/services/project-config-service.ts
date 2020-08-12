import { Yok } from "../../lib/common/yok";
import { assert } from "chai";
import * as _ from 'lodash';
import { LoggerStub, ProjectDataStub } from "../stubs";
import { CONFIG_FILE_NAME_JS, CONFIG_FILE_NAME_TS } from '../../lib/constants';
import { basename } from "path";
import { IInjector } from "../../lib/common/definitions/yok";
import { IReadFileOptions, IFsStats } from "../../lib/common/declarations";
import { ProjectConfigService } from "../../lib/services/project-config-service";
import { IProjectConfigService } from "../../lib/definitions/project";

const createTestInjector = (readTextCallback: (filename: string) => string, existsCallback: (filePath: string) => boolean): IInjector => {
  const testInjector = new Yok();
  const projectStub = new ProjectDataStub();
  projectStub.projectDir = '/my/project';
	testInjector.register("projectData", projectStub);

	testInjector.register("fs", {
		writeJson: (filename: string, data: any, space?: string, encoding?: string): void => {
			/** intentionally left blank */
		},

		readText: (filename: string, encoding?: IReadFileOptions | string): string => {
			return readTextCallback(filename);
		},

		exists: (filePath: string): boolean => existsCallback(filePath),

		readJson: (filePath: string): any => null,

		enumerateFilesInDirectorySync: (directoryPath: string,
			filterCallback?: (_file: string, _stat: IFsStats) => boolean,
			opts?: { enumerateDirectories?: boolean, includeEmptyDirectories?: boolean },
			foundFiles?: string[]): string[] => []
	});

	testInjector.register("logger", LoggerStub);

  testInjector.register("injector", testInjector);
  
  testInjector.register("projectConfigService", ProjectConfigService);

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
				const testInjector = createTestInjector((filename) => sampleJSConfig, (filePath) => basename(filePath) === CONFIG_FILE_NAME_JS);
				const projectConfigService: IProjectConfigService = testInjector.resolve("projectConfigService");

				const actualValue = projectConfigService.getValue("id");
				assert.deepEqual(actualValue, "io.test.app");
      });

      it("JS config parse deep key path", () => {
				const testInjector = createTestInjector((filename) => sampleJSConfig, (filePath) => basename(filePath) === CONFIG_FILE_NAME_JS);
				const projectConfigService: IProjectConfigService = testInjector.resolve("projectConfigService");

				const actualValue = projectConfigService.getValue("android.v8Flags");
				assert.deepEqual(actualValue, "--expose-gc");
      });
      
      it("works with TS config", () => {
				const testInjector = createTestInjector((filename) => sampleTSConfig, (filePath) => basename(filePath) === CONFIG_FILE_NAME_TS);
				const projectConfigService: IProjectConfigService = testInjector.resolve("projectConfigService");

				const actualValue = projectConfigService.getValue("id");
				assert.deepEqual(actualValue, "io.test.app");
      });
      
      it("TS config parse deep key path", () => {
				const testInjector = createTestInjector((filename) => sampleTSConfig, (filePath) => basename(filePath) === CONFIG_FILE_NAME_TS);
				const projectConfigService: IProjectConfigService = testInjector.resolve("projectConfigService");

				const actualValue = projectConfigService.getValue("android.v8Flags");
				assert.deepEqual(actualValue, "--expose-gc");
      });
      
      it("Throws error if no config file found", () => {
				const testInjector = createTestInjector((filename) => null, (filePath) => false);
				const projectConfigService: IProjectConfigService = testInjector.resolve("projectConfigService");
        assert.throws(() => projectConfigService.getValue("id"));
      });
      
      it("Warns if no config file found", () => {
				const testInjector = createTestInjector((filename) => sampleTSConfig, (filePath) => basename(filePath) === CONFIG_FILE_NAME_TS || basename(filePath) === CONFIG_FILE_NAME_JS);
        const projectConfigService: IProjectConfigService = testInjector.resolve("projectConfigService");
        const logger: LoggerStub = testInjector.resolve("logger");
        const actualValue = projectConfigService.getValue("id");
				assert.deepEqual(actualValue, "io.test.app");
        assert.deepEqual(logger.warnOutput, `You have both a ${CONFIG_FILE_NAME_JS} and ${CONFIG_FILE_NAME_TS} file. Defaulting to ${CONFIG_FILE_NAME_TS}.\n`)
			});

	});
});
