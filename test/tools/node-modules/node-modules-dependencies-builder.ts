import { Yok } from "../../../lib/common/yok";
import { assert } from "chai";
import { NodeModulesDependenciesBuilder } from "../../../lib/tools/node-modules/node-modules-dependencies-builder";
import * as path from "path";
import * as _ from "lodash";
import * as constants from "../../../lib/constants";
import { IDependencyData } from "../../../lib/declarations";
import { INodeModulesDependenciesBuilder } from "../../../lib/definitions/platform";
import { IInjector } from "../../../lib/common/definitions/yok";
import {
	IFileSystem,
	IStringDictionary,
} from "../../../lib/common/declarations";
import * as os from "os";
import * as fs from "fs";
import { FileSystem } from "../../../lib/common/file-system";

interface IDependencyInfo {
	name: string;
	version: string;
	depth: number;
	dependencies?: IDependencyInfo[];
	nativescript?: any;
	isDevDependency?: boolean;
}

// TODO: Add integration tests.
// The tests assumes npm 3 or later is used, so all dependencies (and their dependencies) will be installed at the root node_modules
describe("nodeModulesDependenciesBuilder", () => {
	let pathToProject: string = "test-project";

	beforeEach(() => {
		// we use realpath because os.tmpdir points to a symlink on macos
		// and require.resolve resolves the symlink causing test failures
		const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "test-project-"));
		pathToProject = fs.realpathSync(tmpDir);
	});

	const getTestInjector = (): IInjector => {
		const testInjector = new Yok();
		testInjector.register("fs", FileSystem);

		return testInjector;
	};

	describe("getProductionDependencies", () => {
		describe("returns empty array", () => {
			const validateResultIsEmpty = async (resultOfReadJson: any) => {
				const testInjector = getTestInjector();
				const fs = testInjector.resolve<IFileSystem>("fs");
				fs.readJson = (filename: string, encoding?: string): any => {
					return resultOfReadJson;
				};

				const nodeModulesDependenciesBuilder =
					testInjector.resolve<INodeModulesDependenciesBuilder>(
						NodeModulesDependenciesBuilder,
					);
				const result =
					await nodeModulesDependenciesBuilder.getProductionDependencies(
						pathToProject,
					);

				assert.deepStrictEqual(result, []);
			};

			it("when package.json does not have any data", async () => {
				await validateResultIsEmpty(null);
			});

			it("when package.json does not have dependencies section", async () => {
				await validateResultIsEmpty({
					name: "some name",
					devDependencies: { a: "1.0.0" },
				});
			});
		});

		describe("returns correct dependencies", () => {
			/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
			 * Helper functions for easier writing of consecutive tests in the suite.  *
			 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

			const getPathToDependencyInNodeModules = (
				dependencyName: string,
				parentDir?: string,
			): string => {
				return path.join(
					parentDir ?? pathToProject,
					constants.NODE_MODULES_FOLDER_NAME,
					dependencyName,
				);
			};

			const getNodeModuleInfoForExpectedDependency = (
				dir: string,
				depth: number,
				nativescript?: any,
				dependencies?: string[],
				name?: string,
				version?: string,
			): IDependencyData => {
				const packageName = name ?? path.basename(dir);
				const result: IDependencyData = {
					name: packageName,
					directory: getPathToDependencyInNodeModules(dir),
					depth,
					dependencies: dependencies || [],
					version: version,
				};

				if (nativescript) {
					result.nativescript = nativescript;
				}

				return result;
			};

			const getPathToPackageJsonOfDependency = (
				dependencyName: string,
				parentDir?: string,
			): string => {
				return path.join(
					getPathToDependencyInNodeModules(dependencyName, parentDir),
					constants.PACKAGE_JSON_FILE_NAME,
				);
			};

			const getDependenciesObjectFromDependencyInfo = (
				depInfos: IDependencyInfo[],
				nativescript: any,
				version: string,
			): {
				dependencies: IStringDictionary;
				nativescript?: any;
				devDependencies: IStringDictionary;
				version: string;
			} => {
				const dependencies: any = {};
				const devDependencies: any = {};
				_.each(depInfos, (innerDependency) => {
					if (innerDependency.isDevDependency) {
						devDependencies[innerDependency.name] = innerDependency.version;
					} else {
						dependencies[innerDependency.name] = innerDependency.version;
					}
				});

				const result: any = {
					dependencies,
					devDependencies,
				};

				if (nativescript) {
					result.nativescript = nativescript;
				}

				if (version) {
					result.version = version;
				}

				return result;
			};

			const getDependenciesObject = (
				filename: string,
				deps: IDependencyInfo[],
				parentDir: string,
			): {
				dependencies: IStringDictionary;
				nativescript?: any;
				devDependencies: IStringDictionary;
			} => {
				let result: {
					dependencies: IStringDictionary;
					nativescript?: any;
					devDependencies: IStringDictionary;
				} = null;
				for (const dependencyInfo of deps) {
					const pathToPackageJson = getPathToPackageJsonOfDependency(
						dependencyInfo.name,
						parentDir,
					);
					if (filename === pathToPackageJson) {
						return getDependenciesObjectFromDependencyInfo(
							dependencyInfo.dependencies,
							dependencyInfo.nativescript,
							dependencyInfo.version,
						);
					}

					if (dependencyInfo.dependencies) {
						result = getDependenciesObject(
							filename,
							dependencyInfo.dependencies,
							path.join(
								parentDir,
								constants.NODE_MODULES_FOLDER_NAME,
								dependencyInfo.name,
							),
						);
						if (result) {
							break;
						}
					}
				}

				return result;
			};

			const generatePackageJsonData = (dep: IDependencyInfo) => {
				const data: any = {
					name: dep.name,
					version: dep.version,
					dependencies: dep.dependencies?.reduce(
						(deps, dep) => {
							if (!dep.isDevDependency) {
								deps[dep.name] = dep.version;
							}
							return deps;
						},
						{} as { [name: string]: string },
					),
					devDependencies: dep.dependencies?.reduce(
						(deps, dep) => {
							if (dep.isDevDependency) {
								deps[dep.name] = dep.version;
							}
							return deps;
						},
						{} as { [name: string]: string },
					),
				};

				if (dep.nativescript) {
					data.nativescript = dep.nativescript;
				}

				return data;
			};

			const generateNodeModules = (dep: IDependencyInfo, rootPath: string) => {
				// ensure dep directory
				fs.mkdirSync(rootPath, { recursive: true });

				// generate package.json contents
				const packageJsonData = generatePackageJsonData(dep);

				// write package.json
				fs.writeFileSync(
					path.join(rootPath, "package.json"),
					JSON.stringify(packageJsonData),
				);

				// recurse into sub-dependencies if any
				if (dep.dependencies) {
					for (const subDep of dep.dependencies) {
						generateNodeModules(
							subDep,
							path.join(rootPath, "node_modules", subDep.name),
						);
					}
				}
			};

			const generateTest = (
				rootDeps: IDependencyInfo[],
			): INodeModulesDependenciesBuilder => {
				const testInjector = getTestInjector();
				const nodeModulesDependenciesBuilder =
					testInjector.resolve<INodeModulesDependenciesBuilder>(
						NodeModulesDependenciesBuilder,
					);

				generateNodeModules(
					{
						name: "test-project",
						version: "1.0.0",
						depth: 0,
						dependencies: rootDeps,
					},
					pathToProject,
				);

				return nodeModulesDependenciesBuilder;
			};

			const generateDependency = (
				name: string,
				version: string,
				depth: number,
				dependencies: IDependencyInfo[],
				nativescript?: any,
				opts?: { isDevDependency: boolean },
			): IDependencyInfo => {
				return {
					name,
					version,
					depth,
					dependencies,
					nativescript,
					isDevDependency: !!(opts && opts.isDevDependency),
				};
			};

			/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
			 * END of helper functions for easier writing of consecutive tests in the suite. *
			 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

			const firstPackage = "firstPackage";
			const secondPackage = "secondPackage";
			const thirdPackage = "thirdPackage";

			it("when there are both dependencies and devDependencies installed", async () => {
				// The test validates the following dependency tree, when npm 3+ is used.
				// <project dir>
				// ├── firstPackage@1.0.0
				// ├── secondPackage@1.1.0
				// └── thirdPackage@1.2.0 // this is devDependency

				const rootDeps: IDependencyInfo[] = [
					generateDependency(firstPackage, "1.0.0", 0, null),
					generateDependency(secondPackage, "1.1.0", 0, null),
					generateDependency(thirdPackage, "1.2.0", 0, null, null, {
						isDevDependency: true,
					}),
				];

				const nodeModulesDependenciesBuilder = generateTest(rootDeps);
				const actualResult =
					await nodeModulesDependenciesBuilder.getProductionDependencies(
						pathToProject,
					);

				const expectedResult: IDependencyData[] = [
					getNodeModuleInfoForExpectedDependency(
						firstPackage,
						0,
						null,
						null,
						null,
						"1.0.0",
					),
					getNodeModuleInfoForExpectedDependency(
						secondPackage,
						0,
						null,
						null,
						null,
						"1.1.0",
					),
				];

				assert.deepStrictEqual(actualResult, expectedResult);
			});

			it("when there are both dependencies and devDependencies installed, does not handle dependencies of devDependencies", async () => {
				// The test validates the following dependency tree, when npm 3+ is used.
				// <project dir>
				// ├─┬ firstPackage@1.0.0 // this is devDependency
				// │ └── secondPackage@1.2.0
				// └── secondPackage@1.1.0

				const rootDeps: IDependencyInfo[] = [
					generateDependency(
						firstPackage,
						"1.0.0",
						0,
						[generateDependency(secondPackage, "1.2.0", 1, null)],
						null,
						{ isDevDependency: true },
					),
					generateDependency(secondPackage, "1.1.0", 0, null),
				];

				const expectedResult: IDependencyData[] = [
					getNodeModuleInfoForExpectedDependency(
						secondPackage,
						0,
						null,
						null,
						null,
						"1.1.0",
					),
				];

				const nodeModulesDependenciesBuilder = generateTest(rootDeps);
				const actualResult =
					await nodeModulesDependenciesBuilder.getProductionDependencies(
						pathToProject,
					);
				assert.deepStrictEqual(actualResult, expectedResult);
			});

			it("when there are scoped dependencies", async () => {
				// The test validates the following dependency tree, when npm 3+ is used.
				// <project dir>
				// ├─┬ @scope/firstPackage@1.0.0
				// │ └── secondPackage@1.2.0
				// └── secondPackage@1.1.0

				const scopedPackageName = `@scope/${firstPackage}`;
				const rootDeps: IDependencyInfo[] = [
					generateDependency(scopedPackageName, "1.0.0", 0, [
						generateDependency(secondPackage, "1.2.0", 1, null),
					]),
					generateDependency(secondPackage, "1.1.0", 0, null),
				];

				const expectedResult: IDependencyData[] = [
					getNodeModuleInfoForExpectedDependency(
						scopedPackageName,
						0,
						null,
						[secondPackage],
						scopedPackageName,
						"1.0.0",
					),
					getNodeModuleInfoForExpectedDependency(
						secondPackage,
						0,
						null,
						null,
						null,
						"1.1.0",
					),
					getNodeModuleInfoForExpectedDependency(
						path.join(
							scopedPackageName,
							constants.NODE_MODULES_FOLDER_NAME,
							secondPackage,
						),
						1,
						null,
						null,
						null,
						"1.2.0",
					),
				];

				const nodeModulesDependenciesBuilder = generateTest(rootDeps);
				const actualResult =
					await nodeModulesDependenciesBuilder.getProductionDependencies(
						pathToProject,
					);
				assert.deepStrictEqual(actualResult, expectedResult);
			});

			it("when there are scoped dependencies as dependency of other non-scoped dependency", async () => {
				// The test validates the following dependency tree, when npm 3+ is used.
				// <project dir>
				// ├─┬ firstPackage@1.0.0
				// │ └── @scope/secondPackage@1.2.0
				// └── thirdPackage@1.1.0

				const scopedPackageName = `@scope/${secondPackage}`;
				const rootDeps: IDependencyInfo[] = [
					generateDependency(firstPackage, "1.0.0", 0, [
						generateDependency(scopedPackageName, "1.2.0", 1, null),
					]),
					generateDependency(thirdPackage, "1.1.0", 0, null),
				];

				const expectedResult: IDependencyData[] = [
					getNodeModuleInfoForExpectedDependency(
						firstPackage,
						0,
						null,
						[scopedPackageName],
						null,
						"1.0.0",
					),
					getNodeModuleInfoForExpectedDependency(
						thirdPackage,
						0,
						null,
						null,
						null,
						"1.1.0",
					),
					getNodeModuleInfoForExpectedDependency(
						path.join(
							firstPackage,
							constants.NODE_MODULES_FOLDER_NAME,
							scopedPackageName,
						),
						1,
						null,
						null,
						scopedPackageName,
						"1.2.0",
					),
				];

				const nodeModulesDependenciesBuilder = generateTest(rootDeps);
				const actualResult =
					await nodeModulesDependenciesBuilder.getProductionDependencies(
						pathToProject,
					);
				assert.deepStrictEqual(actualResult, expectedResult);
			});

			it("when all dependencies are installed at the root level of the project", async () => {
				// The test validates the following dependency tree, when npm 3+ is used.
				// <project dir>
				// ├── firstPackage@1.0.0
				// ├── secondPackage@1.1.0
				// └── thirdPackage@1.2.0

				const rootDeps: IDependencyInfo[] = [
					generateDependency(firstPackage, "1.0.0", 0, null),
					generateDependency(secondPackage, "1.1.0", 0, null),
					generateDependency(thirdPackage, "1.2.0", 0, null),
				];

				const nodeModulesDependenciesBuilder = generateTest(rootDeps);
				const actualResult =
					await nodeModulesDependenciesBuilder.getProductionDependencies(
						pathToProject,
					);

				const expectedResult: IDependencyData[] = [
					getNodeModuleInfoForExpectedDependency(
						firstPackage,
						0,
						null,
						null,
						null,
						"1.0.0",
					),
					getNodeModuleInfoForExpectedDependency(
						secondPackage,
						0,
						null,
						null,
						null,
						"1.1.0",
					),
					getNodeModuleInfoForExpectedDependency(
						thirdPackage,
						0,
						null,
						null,
						null,
						"1.2.0",
					),
				];

				assert.deepStrictEqual(actualResult, expectedResult);
			});

			it("when the project has a dependency to a package and one of the other packages has dependency to other version of this package", async () => {
				// The test validates the following dependency tree, when npm 3+ is used.
				// <project dir>
				// ├─┬ firstPackage@1.0.0
				// │ └── secondPackage@1.2.0
				// └── secondPackage@1.1.0

				const rootDeps: IDependencyInfo[] = [
					generateDependency(firstPackage, "1.0.0", 0, [
						generateDependency(secondPackage, "1.2.0", 1, null),
					]),
					generateDependency(secondPackage, "1.1.0", 0, null),
				];

				const expectedResult: IDependencyData[] = [
					getNodeModuleInfoForExpectedDependency(
						firstPackage,
						0,
						null,
						[secondPackage],
						null,
						"1.0.0",
					),
					getNodeModuleInfoForExpectedDependency(
						secondPackage,
						0,
						null,
						null,
						null,
						"1.1.0",
					),
					getNodeModuleInfoForExpectedDependency(
						path.join(
							firstPackage,
							constants.NODE_MODULES_FOLDER_NAME,
							secondPackage,
						),
						1,
						null,
						null,
						null,
						"1.2.0",
					),
				];

				const nodeModulesDependenciesBuilder = generateTest(rootDeps);
				const actualResult =
					await nodeModulesDependenciesBuilder.getProductionDependencies(
						pathToProject,
					);
				assert.deepStrictEqual(actualResult, expectedResult);
			});

			it("when several package depend on different versions of other packages", async () => {
				// The test validates the following dependency tree, when npm 3+ is used.
				// <project dir>
				// ├─┬ firstPackage@1.0.0
				// │ ├─┬ secondPackage@1.1.0
				// │ │ └── thirdPackage@1.2.0
				// │ └── thirdPackage@1.1.0
				// ├── secondPackage@1.0.0
				// └── thirdPackage@1.0.0

				const rootDeps: IDependencyInfo[] = [
					generateDependency(firstPackage, "1.0.0", 0, [
						generateDependency(secondPackage, "1.1.0", 1, [
							generateDependency(thirdPackage, "1.2.0", 2, null),
						]),
						generateDependency(thirdPackage, "1.1.0", 1, null),
					]),
					generateDependency(secondPackage, "1.0.0", 0, null),
					generateDependency(thirdPackage, "1.0.0", 0, null),
				];

				const pathToSecondPackageInsideFirstPackage = path.join(
					firstPackage,
					constants.NODE_MODULES_FOLDER_NAME,
					secondPackage,
				);
				const expectedResult: IDependencyData[] = [
					getNodeModuleInfoForExpectedDependency(
						firstPackage,
						0,
						null,
						[secondPackage, thirdPackage],
						null,
						"1.0.0",
					),
					getNodeModuleInfoForExpectedDependency(
						secondPackage,
						0,
						null,
						null,
						null,
						"1.0.0",
					),
					getNodeModuleInfoForExpectedDependency(
						thirdPackage,
						0,
						null,
						null,
						null,
						"1.0.0",
					),
					getNodeModuleInfoForExpectedDependency(
						pathToSecondPackageInsideFirstPackage,
						1,
						null,
						[thirdPackage],
						null,
						"1.1.0",
					),
					getNodeModuleInfoForExpectedDependency(
						path.join(
							firstPackage,
							constants.NODE_MODULES_FOLDER_NAME,
							thirdPackage,
						),
						1,
						null,
						null,
						null,
						"1.1.0",
					),
					getNodeModuleInfoForExpectedDependency(
						path.join(
							pathToSecondPackageInsideFirstPackage,
							constants.NODE_MODULES_FOLDER_NAME,
							thirdPackage,
						),
						2,
						null,
						null,
						null,
						"1.2.0",
					),
				];

				const nodeModulesDependenciesBuilder = generateTest(rootDeps);
				const actualResult =
					await nodeModulesDependenciesBuilder.getProductionDependencies(
						pathToProject,
					);
				assert.deepStrictEqual(actualResult, expectedResult);
			});

			it("when the installed packages have nativescript data in their package.json", async () => {
				// The test validates the following dependency tree, when npm 3+ is used.
				// <project dir>
				// ├── firstPackage@1.0.0
				// ├── secondPackage@1.1.0
				// └── thirdPackage@1.2.0

				const getNativeScriptDataForPlugin = (pluginName: string): any => {
					return {
						platforms: {
							"tns-android": "x.x.x",
							"tns-ios": "x.x.x",
						},

						customPropertyUsedForThisTestOnly: pluginName,
					};
				};

				const rootDeps: IDependencyInfo[] = [
					generateDependency(
						firstPackage,
						"1.0.0",
						0,
						null,
						getNativeScriptDataForPlugin(firstPackage),
					),
					generateDependency(
						secondPackage,
						"1.1.0",
						0,
						null,
						getNativeScriptDataForPlugin(secondPackage),
					),
					generateDependency(
						thirdPackage,
						"1.2.0",
						0,
						null,
						getNativeScriptDataForPlugin(thirdPackage),
					),
				];

				const nodeModulesDependenciesBuilder = generateTest(rootDeps);
				const actualResult =
					await nodeModulesDependenciesBuilder.getProductionDependencies(
						pathToProject,
					);

				const expectedResult: IDependencyData[] = [
					getNodeModuleInfoForExpectedDependency(
						firstPackage,
						0,
						getNativeScriptDataForPlugin(firstPackage),
						null,
						null,
						"1.0.0",
					),
					getNodeModuleInfoForExpectedDependency(
						secondPackage,
						0,
						getNativeScriptDataForPlugin(secondPackage),
						null,
						null,
						"1.1.0",
					),
					getNodeModuleInfoForExpectedDependency(
						thirdPackage,
						0,
						getNativeScriptDataForPlugin(thirdPackage),
						null,
						null,
						"1.2.0",
					),
				];

				assert.deepStrictEqual(actualResult, expectedResult);
			});

			it("ignoring dependencies", async () => {
				// The test validates the following dependency tree, when npm 3+ is used.
				// <project dir>
				// ├── firstPackage@1.0.0
				// ├── secondPackage@1.1.0
				// └── thirdPackage@1.2.0

				const rootDeps: IDependencyInfo[] = [
					generateDependency(firstPackage, "1.0.0", 0, null),
					generateDependency(secondPackage, "1.1.0", 0, null),
					generateDependency(thirdPackage, "1.2.0", 0, null),
				];

				const nodeModulesDependenciesBuilder = generateTest(rootDeps);
				const actualResult =
					await nodeModulesDependenciesBuilder.getProductionDependencies(
						pathToProject,
						[firstPackage],
					);

				const expectedResult: IDependencyData[] = [
					getNodeModuleInfoForExpectedDependency(
						secondPackage,
						0,
						null,
						null,
						null,
						"1.1.0",
					),
					getNodeModuleInfoForExpectedDependency(
						thirdPackage,
						0,
						null,
						null,
						null,
						"1.2.0",
					),
				];

				assert.deepStrictEqual(actualResult, expectedResult);
			});
		});
	});
});
