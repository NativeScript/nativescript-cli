import { ExtensibilityService } from "../../lib/services/extensibility-service";
import { Yok } from "../../lib/common/yok";
import * as stubs from "../stubs";
import { assert } from "chai";
import * as constants from "../../lib/constants";
import { SettingsService } from "../../lib/common/test/unit-tests/stubs";
const path = require("path");
const originalResolve = path.resolve;

describe("extensibilityService", () => {
	before(() => {
		path.resolve = (p: string) => p;
	});

	after(() => {
		path.resolve = originalResolve;
	});

	const getTestInjector = (): IInjector => {
		const testInjector = new Yok();
		testInjector.register("fs", {
			readJson: (pathToFile: string): any => ({})
		});
		testInjector.register("logger", stubs.LoggerStub);
		testInjector.register("npm", {});
		testInjector.register("settingsService", SettingsService);
		testInjector.register("requireService", {
			require: (pathToRequire: string): any => undefined
		});
		return testInjector;
	};

	const getExpectedInstallationPathForExtension = (testInjector: IInjector, extensionName: string): string => {
		const settingsService = testInjector.resolve<ISettingsService>("settingsService");
		const profileDir = settingsService.getProfileDir();

		return path.join(profileDir, "extensions", "node_modules", extensionName);
	};

	const mockFsReadJson = (testInjector: IInjector, extensionNames: string[]): void => {
		const fs = testInjector.resolve<IFileSystem>("fs");
		fs.readJson = (filename: string, encoding?: string): any => {
			const extensionName = _.find(extensionNames, extName => filename.indexOf(extName) !== -1);
			if (extensionName) {
				return {
					name: extensionName,
					version: "1.0.0"
				};
			}

			const dependencies: any = {};
			_.each(extensionNames, name => {
				dependencies[name] = "1.0.0";
			});

			return { dependencies };
		};
	};

	describe("installExtension", () => {
		describe("fails", () => {
			it("when extensions dir does not exist and trying to create it fails", async () => {
				const expectedErrorMessage = "Unable to create dir";
				const testInjector = getTestInjector();
				const fs: IFileSystem = testInjector.resolve("fs");
				fs.exists = (pathToCheck: string): boolean => false;
				fs.createDirectory = (dirToCreate: string): void => {
					throw new Error(expectedErrorMessage);
				};

				const extensibilityService: IExtensibilityService = testInjector.resolve(ExtensibilityService);
				await assert.isRejected(extensibilityService.installExtension("extensionToInstall"), expectedErrorMessage);
			});

			it("when extensions dir exists, but default package.json is missing and trying to create it fails", async () => {
				const expectedErrorMessage = "Unable to write json";
				const testInjector = getTestInjector();
				const fs: IFileSystem = testInjector.resolve("fs");
				fs.exists = (pathToCheck: string): boolean => path.basename(pathToCheck) !== constants.PACKAGE_JSON_FILE_NAME;
				fs.writeJson = (pathToFile: string, content: any) => {
					throw new Error(expectedErrorMessage);
				};

				const extensibilityService: IExtensibilityService = testInjector.resolve(ExtensibilityService);
				await assert.isRejected(extensibilityService.installExtension("extensionToInstall"), expectedErrorMessage);
			});

			it("when npm install fails", async () => {
				const expectedErrorMessage = "Unable to install package";
				const testInjector = getTestInjector();
				const fs: IFileSystem = testInjector.resolve("fs");
				fs.exists = (pathToCheck: string): boolean => true;
				const npm: INodePackageManager = testInjector.resolve("npm");
				npm.install = async (packageName: string, pathToSave: string, config?: any): Promise<any> => {
					throw new Error(expectedErrorMessage);
				};

				const extensibilityService: IExtensibilityService = testInjector.resolve(ExtensibilityService);
				await assert.isRejected(extensibilityService.installExtension("extensionToInstall"), expectedErrorMessage);
			});
		});

		describe("passes correct arguments to npm install", () => {
			const getArgsPassedToNpmInstallDuringInstallExtensionCall = async (userSpecifiedValue: string, testInjector?: IInjector): Promise<any> => {
				testInjector = testInjector || getTestInjector();
				const fs: IFileSystem = testInjector.resolve("fs");
				fs.exists = (pathToCheck: string): boolean => true;

				fs.readDirectory = (dir: string): string[] => [userSpecifiedValue];

				const npm: INodePackageManager = testInjector.resolve("npm");
				const argsPassedToNpmInstall: any = {};
				npm.install = async (packageName: string, pathToSave: string, config?: any): Promise<any> => {
					argsPassedToNpmInstall.packageName = packageName;
					argsPassedToNpmInstall.pathToSave = pathToSave;
					argsPassedToNpmInstall.config = config;
					return { name: userSpecifiedValue };
				};

				const extensibilityService: IExtensibilityService = testInjector.resolve(ExtensibilityService);
				await extensibilityService.installExtension(userSpecifiedValue);

				return argsPassedToNpmInstall;
			};

			const assertPackageNamePassedToNpmInstall = async (userSpecifiedValue: string, expectedValue: string): Promise<void> => {
				const argsPassedToNpmInstall = await getArgsPassedToNpmInstallDuringInstallExtensionCall(userSpecifiedValue);
				assert.deepEqual(argsPassedToNpmInstall.packageName, expectedValue);
			};

			it("passes full path for installation, when trying to install local package (user specifies relative path)", async () => {
				const extensionName = "../extension1";
				await assertPackageNamePassedToNpmInstall(extensionName, path.resolve(extensionName));
			});

			it("passes the value specified by user for installation, when the local path does not exist", async () => {
				const extensionName = "extension1";
				await assertPackageNamePassedToNpmInstall(extensionName, path.resolve(extensionName));
			});

			it("passes save and save-exact options to npm install", async () => {
				const extensionName = "extension1";
				const argsPassedToNpmInstall = await getArgsPassedToNpmInstallDuringInstallExtensionCall(extensionName);
				const expectedNpmConfg: any = { save: true };
				expectedNpmConfg["save-exact"] = true;
				assert.deepEqual(argsPassedToNpmInstall.config, expectedNpmConfg);
			});

			it("passes full path to extensions dir for installation", async () => {
				const extensionName = "extension1";
				const testInjector = getTestInjector();
				const settingsService: ISettingsService = testInjector.resolve("settingsService");
				const profileDir = "my-profile-dir";
				settingsService.getProfileDir = () => profileDir;

				const expectedDirForInstallation = path.join(profileDir, "extensions");
				const argsPassedToNpmInstall = await getArgsPassedToNpmInstallDuringInstallExtensionCall(extensionName, testInjector);
				assert.deepEqual(argsPassedToNpmInstall.pathToSave, expectedDirForInstallation);
			});
		});

		it("returns the name of the installed extension", async () => {
			const extensionName = "extension1";
			const testInjector = getTestInjector();

			const fs: IFileSystem = testInjector.resolve("fs");
			fs.exists = (pathToCheck: string): boolean => path.basename(pathToCheck) !== extensionName;

			fs.readDirectory = (dir: string): string[] => [extensionName];

			fs.readJson = () => ({ name: extensionName, version: "1.0.0" });

			const npm: INodePackageManager = testInjector.resolve("npm");
			npm.install = async (packageName: string, pathToSave: string, config?: any): Promise<any> => ({ name: extensionName, version: "1.0.0" });

			const extensibilityService: IExtensibilityService = testInjector.resolve(ExtensibilityService);
			const actualResult = await extensibilityService.installExtension(extensionName);
			assert.deepEqual(actualResult, { extensionName, version: "1.0.0", docs: undefined, pathToExtension: getExpectedInstallationPathForExtension(testInjector, extensionName) });
		});
	});

	describe("loadExtensions", () => {
		describe("returns correct results for each extension", () => {
			it("resolves all Promises with correct values when all extensions can be loaded", async () => {
				const testInjector = getTestInjector();
				const fs: IFileSystem = testInjector.resolve("fs");
				const extensionNames = ["extension1", "extension2", "extension3"];
				fs.exists = (pathToCheck: string): boolean => true;
				fs.readDirectory = (dir: string): string[] => {
					assert.deepEqual(path.basename(dir), constants.NODE_MODULES_FOLDER_NAME);
					// Simulates extensions are installed in node_modules
					return extensionNames;
				};

				mockFsReadJson(testInjector, extensionNames);

				const expectedResults: IExtensionData[] = _.map(extensionNames, extensionName => (
					{
						extensionName,
						version: "1.0.0",
						pathToExtension: getExpectedInstallationPathForExtension(testInjector, extensionName),
						docs: undefined
					}
				));

				const extensibilityService: IExtensibilityService = testInjector.resolve(ExtensibilityService);
				const actualResult = await Promise.all(extensibilityService.loadExtensions());
				assert.deepEqual(actualResult, expectedResults);
			});

			it("installs extensions that are available in package.json, but are not available in node_modules", async () => {
				const testInjector = getTestInjector();
				const fs: IFileSystem = testInjector.resolve("fs");
				const extensionNames = ["extension1", "extension2", "extension3"];
				fs.exists = (pathToCheck: string): boolean => path.basename(pathToCheck) !== extensionNames[0];

				let isFirstReadDirExecution = true;
				fs.readDirectory = (dir: string): string[] => {
					assert.deepEqual(path.basename(dir), constants.NODE_MODULES_FOLDER_NAME);
					// Simulates extensions are installed in node_modules
					if (isFirstReadDirExecution) {
						isFirstReadDirExecution = false;
						return extensionNames.filter(ext => ext !== "extension1");
					} else {
						return extensionNames;
					}
				};

				mockFsReadJson(testInjector, extensionNames);

				let isNpmInstallCalled = false;
				const npm: INodePackageManager = testInjector.resolve("npm");
				npm.install = async (packageName: string, pathToSave: string, config?: any): Promise<any> => {
					assert.deepEqual(packageName, extensionNames[0]);
					isNpmInstallCalled = true;
					return { name: packageName };
				};

				const expectedResults: IExtensionData[] = _.map(extensionNames, extensionName => ({ extensionName, version: "1.0.0", pathToExtension: getExpectedInstallationPathForExtension(testInjector, extensionName), docs: undefined }));

				const extensibilityService: IExtensibilityService = testInjector.resolve(ExtensibilityService);
				const actualResult = await Promise.all(extensibilityService.loadExtensions());
				assert.deepEqual(actualResult, expectedResults);
				assert.isTrue(isNpmInstallCalled);
			});

			it("rejects only promises for extensions that cannot be loaded", async () => {
				const testInjector = getTestInjector();
				const fs: IFileSystem = testInjector.resolve("fs");
				const extensionNames = ["extension1", "extension2", "extension3"];
				fs.exists = (pathToCheck: string): boolean => true;
				fs.readDirectory = (dir: string): string[] => {
					assert.deepEqual(path.basename(dir), constants.NODE_MODULES_FOLDER_NAME);
					// Simulates extensions are installed in node_modules
					return extensionNames;
				};

				mockFsReadJson(testInjector, extensionNames);

				const requireService: IRequireService = testInjector.resolve("requireService");
				requireService.require = (module: string) => {
					if (path.basename(module) === extensionNames[0]) {
						throw new Error("Unable to load module.");
					}
				};

				const expectedResults: any[] = _.map(extensionNames, extensionName => ({ extensionName, version: "1.0.0", pathToExtension: getExpectedInstallationPathForExtension(testInjector, extensionName), docs: undefined }));
				expectedResults[0] = new Error("Unable to load extension extension1. You will not be able to use the functionality that it adds. Error: Unable to load module.");
				const extensibilityService: IExtensibilityService = testInjector.resolve(ExtensibilityService);
				const promises = extensibilityService.loadExtensions();
				assert.deepEqual(promises.length, extensionNames.length);

				for (let index = 0; index < promises.length; index++) {
					const loadExtensionPromise = promises[index];
					await loadExtensionPromise
						.then(result => assert.deepEqual(result, expectedResults[index]),
						err => {
							assert.deepEqual(err.message, expectedResults[index].message);
							assert.deepEqual(err.extensionName, extensionNames[index]);
						});
				}
			});

			it("rejects all promises when unable to read node_modules dir (simulate EPERM error)", async () => {
				const testInjector = getTestInjector();
				const extensionNames = ["extension1", "extension2", "extension3"];
				const fs: IFileSystem = testInjector.resolve("fs");
				const expectedErrorMessage = `Unable to read ${constants.NODE_MODULES_FOLDER_NAME} dir.`;
				fs.exists = (pathToCheck: string): boolean => path.basename(pathToCheck) === "extensions" || path.basename(pathToCheck) === constants.PACKAGE_JSON_FILE_NAME;
				mockFsReadJson(testInjector, extensionNames);

				let isReadDirCalled = false;
				fs.readDirectory = (dir: string): string[] => {
					isReadDirCalled = true;
					assert.deepEqual(path.basename(dir), constants.NODE_MODULES_FOLDER_NAME);
					throw new Error(expectedErrorMessage);
				};

				const extensibilityService: IExtensibilityService = testInjector.resolve(ExtensibilityService);
				const promises = extensibilityService.loadExtensions();

				for (let index = 0; index < promises.length; index++) {
					const loadExtensionPromise = promises[index];
					await loadExtensionPromise.then(res => { throw new Error("Shouldn't get here!"); },
						err => {
							const extensionName = extensionNames[index];
							assert.deepEqual(err.message, `Unable to load extension ${extensionName}. You will not be able to use the functionality that it adds. Error: ${expectedErrorMessage}`);
							assert.deepEqual(err.extensionName, extensionName);
						});
				}

				assert.deepEqual(promises.length, extensionNames.length);
				assert.isTrue(isReadDirCalled, "readDirectory should have been called for the extensions.");
			});

			it("rejects all promises when unable to install extensions to extension dir (simulate EPERM error)", async () => {
				const testInjector = getTestInjector();
				const extensionNames = ["extension1", "extension2", "extension3"];
				const expectedErrorMessages = ["Unable to install to node_modules dir.",
					"expected 'extension2' to deeply equal 'extension1'",
					"expected 'extension3' to deeply equal 'extension1'"];
				const fs: IFileSystem = testInjector.resolve("fs");
				fs.exists = (pathToCheck: string): boolean => path.basename(pathToCheck) === "extensions" || path.basename(pathToCheck) === constants.PACKAGE_JSON_FILE_NAME;
				mockFsReadJson(testInjector, extensionNames);

				let isReadDirCalled = false;
				fs.readDirectory = (dir: string): string[] => {
					isReadDirCalled = true;
					assert.deepEqual(path.basename(dir), constants.NODE_MODULES_FOLDER_NAME);
					return [];
				};

				let isNpmInstallCalled = false;
				const npm: INodePackageManager = testInjector.resolve("npm");
				const expectedErrorMessage = `Unable to install to ${constants.NODE_MODULES_FOLDER_NAME} dir.`;
				npm.install = async (packageName: string, pathToSave: string, config?: any): Promise<any> => {
					assert.deepEqual(packageName, extensionNames[0]);
					isNpmInstallCalled = true;
					throw new Error(expectedErrorMessage);
				};

				const extensibilityService: IExtensibilityService = testInjector.resolve(ExtensibilityService);
				const promises = extensibilityService.loadExtensions();

				for (let index = 0; index < promises.length; index++) {
					const loadExtensionPromise = promises[index];
					await loadExtensionPromise.then(res => {
						throw new Error("Shouldn't get here!");
					},

						err => {
							const extensionName = extensionNames[index];
							assert.deepEqual(err.message, `Unable to load extension ${extensionName}. You will not be able to use the functionality that it adds. Error: ${expectedErrorMessages[index]}`);
							assert.deepEqual(err.extensionName, extensionName);
						});
				}

				assert.deepEqual(promises.length, extensionNames.length);
				assert.isTrue(isNpmInstallCalled, "Npm install should have been called for the extensions.");
				assert.isTrue(isReadDirCalled, "readDirectory should have been called for the extensions.");
			});

			it("does not return any promises when its unable to create extensions dir", () => {

				const testInjector = getTestInjector();
				const fs: IFileSystem = testInjector.resolve("fs");
				fs.exists = (pathToCheck: string): boolean => false;
				const expectedErrorMessage = "Unable to create dir";
				fs.createDirectory = (dirToCreate: string): void => {
					throw new Error(expectedErrorMessage);
				};

				const extensibilityService: IExtensibilityService = testInjector.resolve(ExtensibilityService);
				const promises = extensibilityService.loadExtensions();

				assert.deepEqual(promises.length, 0);
			});

			it("does not return any promises when its unable to read extensions package.json", () => {

				const testInjector = getTestInjector();
				const fs: IFileSystem = testInjector.resolve("fs");
				fs.exists = (pathToCheck: string): boolean => true;
				const expectedErrorMessage = "Unable to read json";
				fs.readJson = (filename: string, encoding?: string): any => {
					throw new Error(expectedErrorMessage);
				};

				const extensibilityService: IExtensibilityService = testInjector.resolve(ExtensibilityService);
				const promises = extensibilityService.loadExtensions();

				assert.deepEqual(promises.length, 0);
			});

			it("does not fail when package.json in extension dir does not exist", async () => {
				const testInjector = getTestInjector();
				const fs: IFileSystem = testInjector.resolve("fs");
				fs.exists = (pathToCheck: string): boolean => {
					// Add the assert here, so we are sure the only call to fs.exists is for package.json of the extensions dir.
					assert.deepEqual(path.basename(pathToCheck), constants.PACKAGE_JSON_FILE_NAME);
					return false;
				};

				const expectedResults: IExtensionData[] = [];
				const extensibilityService: IExtensibilityService = testInjector.resolve(ExtensibilityService);
				const actualResult = await Promise.all(extensibilityService.loadExtensions());
				assert.deepEqual(actualResult, expectedResults, "When there's no package.json in extensions dir, there's nothing for loading.");
			});

			it("does not fail when unable to read extensions dir package.json", async () => {
				const testInjector = getTestInjector();
				const fs: IFileSystem = testInjector.resolve("fs");
				fs.exists = (pathToCheck: string): boolean => {
					// Add the assert here, so we are sure the only call to fs.exists is for package.json of the extensions dir.
					assert.deepEqual(path.basename(pathToCheck), constants.PACKAGE_JSON_FILE_NAME);
					return true;
				};

				fs.readJson = (filename: string, encoding?: string): any => {
					throw new Error("Unable to read JSON");
				};

				const expectedResults: IExtensionData[] = [];
				const extensibilityService: IExtensibilityService = testInjector.resolve(ExtensibilityService);
				const actualResult = await Promise.all(extensibilityService.loadExtensions());
				assert.deepEqual(actualResult, expectedResults, "When unable to read package.json in extensions dir, there's nothing for loading.");
			});

		});
	});

	describe("uninstallExtension", () => {
		describe("fails", () => {
			it("when extensions dir does not exist and trying to create it fails", async () => {
				const expectedErrorMessage = "Unable to create dir";
				const testInjector = getTestInjector();
				const fs: IFileSystem = testInjector.resolve("fs");
				fs.exists = (pathToCheck: string): boolean => false;
				fs.createDirectory = (dirToCreate: string): void => {
					throw new Error(expectedErrorMessage);
				};

				const extensibilityService: IExtensibilityService = testInjector.resolve(ExtensibilityService);
				await assert.isRejected(extensibilityService.uninstallExtension("extensionToInstall"), expectedErrorMessage);
			});

			it("when extensions dir exists, but default package.json is missing and trying to create it fails", async () => {
				const expectedErrorMessage = "Unable to write json";
				const testInjector = getTestInjector();
				const fs: IFileSystem = testInjector.resolve("fs");
				fs.exists = (pathToCheck: string): boolean => path.basename(pathToCheck) !== constants.PACKAGE_JSON_FILE_NAME;
				fs.writeJson = (pathToFile: string, content: any) => {
					throw new Error(expectedErrorMessage);
				};

				const extensibilityService: IExtensibilityService = testInjector.resolve(ExtensibilityService);
				await assert.isRejected(extensibilityService.uninstallExtension("extensionToInstall"), expectedErrorMessage);
			});

			it("when npm uninstall fails", async () => {
				const expectedErrorMessage = "Unable to install package";
				const testInjector = getTestInjector();
				const fs: IFileSystem = testInjector.resolve("fs");
				fs.exists = (pathToCheck: string): boolean => true;
				const npm: INodePackageManager = testInjector.resolve("npm");
				npm.uninstall = async (packageName: string, config?: any, p?: string): Promise<any> => {
					throw new Error(expectedErrorMessage);
				};

				const extensibilityService: IExtensibilityService = testInjector.resolve(ExtensibilityService);
				await assert.isRejected(extensibilityService.uninstallExtension("extensionToInstall"), expectedErrorMessage);
			});
		});

		describe("passes correct arguments to npm uninstall", () => {
			const getArgsPassedToNpmUninstallDuringUninstallExtensionCall = async (userSpecifiedValue: string, testInjector?: IInjector): Promise<any> => {
				testInjector = testInjector || getTestInjector();
				const fs: IFileSystem = testInjector.resolve("fs");
				fs.exists = (pathToCheck: string): boolean => true;

				fs.readDirectory = (dir: string): string[] => [userSpecifiedValue];

				const npm: INodePackageManager = testInjector.resolve("npm");
				const argsPassedToNpmInstall: any = {};
				npm.uninstall = async (packageName: string, config?: any, p?: string): Promise<any> => {
					argsPassedToNpmInstall.packageName = packageName;
					argsPassedToNpmInstall.pathToSave = p;
					argsPassedToNpmInstall.config = config;
					return [userSpecifiedValue];
				};

				const extensibilityService: IExtensibilityService = testInjector.resolve(ExtensibilityService);
				await extensibilityService.uninstallExtension(userSpecifiedValue);

				return argsPassedToNpmInstall;
			};

			const assertPackageNamePassedToNpmUninstall = async (userSpecifiedValue: string, expectedValue: string): Promise<void> => {
				const argsPassedToNpmInstall = await getArgsPassedToNpmUninstallDuringUninstallExtensionCall(userSpecifiedValue);
				assert.deepEqual(argsPassedToNpmInstall.packageName, expectedValue);
			};

			it("passes the value specified by user for installation", async () => {
				const extensionName = "extension1";
				await assertPackageNamePassedToNpmUninstall(extensionName, extensionName);

				const relativePathToExtension = "../extension1";
				await assertPackageNamePassedToNpmUninstall(relativePathToExtension, relativePathToExtension);
			});

			it("passes save option to npm uninstall", async () => {
				const extensionName = "extension1";
				const argsPassedToNpmUninstall = await getArgsPassedToNpmUninstallDuringUninstallExtensionCall(extensionName);
				const expectedNpmConfg: any = { save: true };
				assert.deepEqual(argsPassedToNpmUninstall.config, expectedNpmConfg);
			});

			it("passes full path to extensions dir for uninstallation", async () => {
				const extensionName = "extension1";
				const testInjector = getTestInjector();
				const settingsService: ISettingsService = testInjector.resolve("settingsService");
				const profileDir = "my-profile-dir";
				settingsService.getProfileDir = () => profileDir;

				const expectedDirForUninstall = path.join(profileDir, "extensions");
				const argsPassedToNpmUninstall = await getArgsPassedToNpmUninstallDuringUninstallExtensionCall(extensionName, testInjector);
				assert.deepEqual(argsPassedToNpmUninstall.pathToSave, expectedDirForUninstall);
			});
		});

		it("executes successfully uninstall operation", async () => {
			const extensionName = "extension1";
			const testInjector = getTestInjector();
			const fs: IFileSystem = testInjector.resolve("fs");
			fs.exists = (pathToCheck: string): boolean => path.basename(pathToCheck) !== extensionName;

			fs.readDirectory = (dir: string): string[] => [extensionName];

			const npm: INodePackageManager = testInjector.resolve("npm");
			npm.uninstall = async (packageName: string, config?: any, p?: string): Promise<any> => [extensionName];

			const extensibilityService: IExtensibilityService = testInjector.resolve(ExtensibilityService);
			await extensibilityService.uninstallExtension(extensionName);
		});

	});

	describe("getInstalledExtensions", () => {
		it("fails when unable to read package.json from extensions dir", () => {
			const testInjector = getTestInjector();
			const fs: IFileSystem = testInjector.resolve("fs");
			fs.exists = (pathToCheck: string) => true;
			const expectedErrorMessage = "Failed to read package.json";
			fs.readJson = (filename: string, encoding?: string): any => {
				throw new Error(expectedErrorMessage);
			};

			const extensibilityService: IExtensibilityService = testInjector.resolve(ExtensibilityService);
			assert.throws(() => extensibilityService.getInstalledExtensions(), expectedErrorMessage);
		});

		it("returns null when there's no package.json dir", () => {
			const testInjector = getTestInjector();
			const fs: IFileSystem = testInjector.resolve("fs");
			fs.exists = (pathToCheck: string) => false;

			const extensibilityService: IExtensibilityService = testInjector.resolve(ExtensibilityService);
			assert.isNull(extensibilityService.getInstalledExtensions());
		});

		it("returns undefined when package.json does not have dependencies section", () => {
			const testInjector = getTestInjector();
			const fs: IFileSystem = testInjector.resolve("fs");
			fs.exists = (pathToCheck: string) => true;
			fs.readJson = (filename: string, encoding?: string): any => {
				return {};
			};

			const extensibilityService: IExtensibilityService = testInjector.resolve(ExtensibilityService);
			assert.isUndefined(extensibilityService.getInstalledExtensions());
		});

		it("returns dependencies section of package.json", () => {
			const testInjector = getTestInjector();
			const fs: IFileSystem = testInjector.resolve("fs");
			fs.exists = (pathToCheck: string) => true;
			const dependencies = {
				"dep1": "1.0.0",
				"dep2": "~1.0.0",
				"dep3": "^1.0.0"
			};

			fs.readJson = (filename: string, encoding?: string): any => {
				return { dependencies };
			};

			const extensibilityService: IExtensibilityService = testInjector.resolve(ExtensibilityService);
			assert.deepEqual(extensibilityService.getInstalledExtensions(), dependencies);
		});
	});

	describe("loadExtension", () => {
		it("throws error that has extensionName property when unable to load extension", async () => {
			const expectedErrorMessage = "Require failed";

			const extensionName = "extension1";
			const testInjector = getTestInjector();
			const fs: IFileSystem = testInjector.resolve("fs");
			fs.exists = (pathToCheck: string): boolean => path.basename(pathToCheck) !== extensionName;

			fs.readDirectory = (dir: string): string[] => [extensionName];

			const npm: INodePackageManager = testInjector.resolve("npm");
			npm.install = async (packageName: string, pathToSave: string, config?: any): Promise<any> => ({ name: extensionName });

			const requireService: IRequireService = testInjector.resolve("requireService");
			requireService.require = (pathToRequire: string) => {
				throw new Error(expectedErrorMessage);
			};

			const extensibilityService: IExtensibilityService = testInjector.resolve(ExtensibilityService);
			let isErrorRaised = false;
			try {
				await extensibilityService.loadExtension(extensionName);
			} catch (err) {
				isErrorRaised = true;
				assert.deepEqual(err.message, `Unable to load extension ${extensionName}. You will not be able to use the functionality that it adds. Error: ${expectedErrorMessage}`);
				assert.deepEqual(err.extensionName, extensionName);
			}

			assert.isTrue(isErrorRaised);
		});
	});
});
