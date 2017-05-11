import * as path from "path";
import { NODE_MODULES_FOLDER_NAME, PACKAGE_JSON_FILE_NAME } from "../../constants";

interface IDependencyDescription {
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

		let resolvedDependencies: IDependencyData[] = [];

		let queue: IDependencyDescription[] = _.keys(dependencies)
			.map(dependencyName => ({
				parentDir: projectPath,
				name: dependencyName,
				depth: 0
			}));

		while (queue.length) {
			const currentModule = queue.shift();
			const resolvedDependency = this.findModule(rootNodeModulesPath, currentModule.parentDir, currentModule.name, currentModule.depth, resolvedDependencies);

			if (resolvedDependency && !_.some(resolvedDependencies, r => r.directory === resolvedDependency.directory)) {
				_.each(resolvedDependency.dependencies, d => {
					const dependency: IDependencyDescription = { name: d, parentDir: resolvedDependency.directory, depth: resolvedDependency.depth + 1 };

					const shouldAdd = !_.some(queue, element =>
						element.name === dependency.name &&
						element.parentDir === dependency.parentDir &&
						element.depth === dependency.depth);

					if (shouldAdd) {
						queue.push(dependency);
					}
				});

				resolvedDependencies.push(resolvedDependency);
			}
		}

		return resolvedDependencies;
	}

	private findModule(rootNodeModulesPath: string, parentModulePath: string, name: string, depth: number, resolvedDependencies: IDependencyData[]): IDependencyData {
		let modulePath = path.join(parentModulePath, NODE_MODULES_FOLDER_NAME, name); // node_modules/parent/node_modules/<package>
		const rootModulesPath = path.join(rootNodeModulesPath, name);
		let depthInNodeModules = depth;

		if (!this.moduleExists(modulePath)) {
			modulePath = rootModulesPath; // /node_modules/<package>
			if (!this.moduleExists(modulePath)) {
				return null;
			}

			depthInNodeModules = 0;
		}

		if (_.some(resolvedDependencies, r => r.name === name && r.directory === modulePath)) {
			return null;

		}

		return this.getDependencyData(name, modulePath, depthInNodeModules);
	}

	private getDependencyData(name: string, directory: string, depth: number): IDependencyData {
		const dependency: IDependencyData = {
			name,
			directory,
			depth
		};

		const packageJsonPath = path.join(directory, PACKAGE_JSON_FILE_NAME);
		const packageJsonExists = this.$fs.getLsStats(packageJsonPath).isFile();

		if (packageJsonExists) {
			let packageJsonContents = this.$fs.readJson(packageJsonPath);

			if (!!packageJsonContents.nativescript) {
				// add `nativescript` property, necessary for resolving plugins
				dependency.nativescript = packageJsonContents.nativescript;
			}

			dependency.dependencies = _.keys(packageJsonContents.dependencies);
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
