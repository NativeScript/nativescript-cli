import * as path from "path";
import { NODE_MODULES_FOLDER_NAME, PACKAGE_JSON_FILE_NAME } from "../../constants";

interface IDependencyDescription {
	parent: IDependencyDescription;
	parentDir: string;
	name: string;
	depth: number;
}

export class NodeModulesDependenciesBuilder implements INodeModulesDependenciesBuilder {
	public constructor(private $fs: IFileSystem) { }

	public getProductionDependencies(projectPath: string): IDependencyData[] {
		const rootNodeModulesPath = path.join(projectPath, NODE_MODULES_FOLDER_NAME);
		const projectPackageJsonPath = path.join(projectPath, PACKAGE_JSON_FILE_NAME);
		const packageJsonContent = this.$fs.readJson(projectPackageJsonPath);
		const dependencies = packageJsonContent && packageJsonContent.dependencies;

		const resolvedDependencies: IDependencyData[] = [];

		const queue: IDependencyDescription[] = _.map(dependencies, (version: string, dependencyName: string) => ({
			parent: null,
			parentDir: projectPath,
			name: dependencyName,
			depth: 0,
			version
		}));

		while (queue.length) {
			const currentModule = queue.shift();
			const resolvedDependency = this.findModule(rootNodeModulesPath, currentModule, resolvedDependencies);

			if (resolvedDependency && !_.some(resolvedDependencies, r => r.directory === resolvedDependency.directory)) {

				_.each(resolvedDependency.dependencies, (d, key) => {
					const dependency: IDependencyDescription = {
						parent: currentModule,
						name: d,
						parentDir: resolvedDependency.directory,
						depth: resolvedDependency.depth + 1
					};

					const shouldAdd = !_.some(queue, element =>
						element.parent === dependency.parent &&
						element.name === dependency.name &&
						element.parentDir === dependency.parentDir &&
						element.depth === dependency.depth);

					if (shouldAdd) {
						queue.push(dependency);
					}
				});

				const alreadyAddedDependency = _.find(resolvedDependencies, r => r.name === resolvedDependency.name && !r.deduped);
				if (!!alreadyAddedDependency) {
					// TODO: These checks are valid only for NativeScript plugins with existing platforms dir.
					// TODO: Consider cases when one of the versions of a plugin is a NativeScript plugin and another one is not.
					const isNativeScriptPlugin = !!alreadyAddedDependency.nativescript;
					if (isNativeScriptPlugin) {
						if (alreadyAddedDependency.version === resolvedDependency.version) {
							let dedupedLocation = "";
							let locationToBeUsed = "";
							if (alreadyAddedDependency.depth > resolvedDependency.depth) {
								// alreadyAddedDependency.deduped = true;
								dedupedLocation = alreadyAddedDependency.directory;
								locationToBeUsed = resolvedDependency.directory;
								alreadyAddedDependency.warning = `Will not add ${resolvedDependency.name} from location ${dedupedLocation} as it has already been added from ${locationToBeUsed}.
It is not expected to have the same version of a dependency in different locations. Consider removing node_modules and package-lock.json (npm-shrinkwrap.json) and installing dependencies again.`;
							} else {
								// resolvedDependency.deduped = true;
								dedupedLocation = resolvedDependency.directory;
								locationToBeUsed = alreadyAddedDependency.directory;
								resolvedDependency.warning = `Will not add ${resolvedDependency.name} from location ${dedupedLocation} as it has already been added from ${locationToBeUsed}.
It is not expected to have the same version of a dependency in different locations. Consider removing node_modules and package-lock.json (npm-shrinkwrap.json) and installing dependencies again.`;
							}

							resolvedDependencies.push(resolvedDependency);
						} else {
							throw new Error(`Unable to add dependency ${resolvedDependency.directory} as different version of the same dependency has been added from ${alreadyAddedDependency.directory}`);
						}
					} else if (alreadyAddedDependency.version === resolvedDependency.version) {
						resolvedDependency.warning = `Detected the same version of a package installed on different locations: ${alreadyAddedDependency.directory} and ${resolvedDependency.directory}
It is not expected to have the same version of a dependency in different locations. Consider removing node_modules and package-lock.json (npm-shrinkwrap.json) and installing dependencies again.`;
						resolvedDependencies.push(resolvedDependency);
					}
				} else {
					resolvedDependencies.push(resolvedDependency);
				}
			}
		}

		return resolvedDependencies;
	}

	private findModule(rootNodeModulesPath: string, depDescription: IDependencyDescription, resolvedDependencies: IDependencyData[]): IDependencyData {
		let modulePath = path.join(depDescription.parentDir, NODE_MODULES_FOLDER_NAME, depDescription.name); // node_modules/parent/node_modules/<package>
		const rootModulesPath = path.join(rootNodeModulesPath, depDescription.name);
		let depthInNodeModules = depDescription.depth;

		if (!this.moduleExists(modulePath)) {

			let moduleExists = false;
			let parent = depDescription.parent;

			while (parent && !moduleExists) {
				modulePath = path.join(depDescription.parent.parentDir, NODE_MODULES_FOLDER_NAME, depDescription.name);
				moduleExists = this.moduleExists(modulePath);
				if (!moduleExists) {
					parent = parent.parent;
				}
			}

			if (!moduleExists) {
				modulePath = rootModulesPath; // /node_modules/<package>
				if (!this.moduleExists(modulePath)) {
					return null;
				}
			}

			depthInNodeModules = 0;
		}

		if (_.some(resolvedDependencies, r => r.name === depDescription.name && r.directory === modulePath)) {
			return null;

		}

		return this.getDependencyData(depDescription.name, modulePath, depthInNodeModules);
	}

	private getDependencyData(name: string, directory: string, depth: number): IDependencyData {
		const packageJsonPath = path.join(directory, PACKAGE_JSON_FILE_NAME);
		const packageJsonExists = this.$fs.exists(packageJsonPath) && this.$fs.getLsStats(packageJsonPath).isFile();

		if (packageJsonExists) {
			const packageJsonContents = this.$fs.readJson(packageJsonPath);
			const dependency: IDependencyData = {
				name,
				directory,
				depth,
				dependencies: _.keys(packageJsonContents.dependencies),
				version: packageJsonContents.version
			};

			if (!!packageJsonContents.nativescript) {
				// add `nativescript` property, necessary for resolving plugins
				dependency.nativescript = packageJsonContents.nativescript;
			}

			return dependency;
		}

		return null;
	}

	private moduleExists(modulePath: string): boolean {
		try {
			let modulePathLsStat = this.$fs.getLsStats(modulePath);
			if (modulePathLsStat.isSymbolicLink()) {
				modulePathLsStat = this.$fs.getLsStats(this.$fs.realpath(modulePath));
			}

			return modulePathLsStat.isDirectory();
		} catch (e) {
			return false;
		}
	}
}

$injector.register("nodeModulesDependenciesBuilder", NodeModulesDependenciesBuilder);
