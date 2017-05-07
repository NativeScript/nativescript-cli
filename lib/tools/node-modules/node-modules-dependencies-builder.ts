import * as path from "path";
import { NODE_MODULES_FOLDER_NAME, PACKAGE_JSON_FILE_NAME } from "../../constants";

export class NodeModulesDependenciesBuilder implements INodeModulesDependenciesBuilder {
	public constructor(private $fs: IFileSystem) { }

	public getProductionDependencies(projectPath: string): IDependencyData[] {
		const rootNodeModulesPath = path.join(projectPath, NODE_MODULES_FOLDER_NAME);
		const projectPackageJsonPath = path.join(projectPath, PACKAGE_JSON_FILE_NAME);
		const packageJsonContent = this.$fs.readJson(projectPackageJsonPath);
		const dependencies = packageJsonContent && packageJsonContent.dependencies;

		let resolvedDependencies: IDependencyData[] = [];

		_.keys(dependencies)
			.forEach(dependencyName => {
				const depth = 0;
				const directory = path.join(rootNodeModulesPath, dependencyName);

				// find and traverse child with name `key`, parent's directory -> dep.directory
				this.traverseDependency(resolvedDependencies, rootNodeModulesPath, dependencyName, directory, depth);
			});

		return resolvedDependencies;
	}

	private traverseDependency(resolvedDependencies: IDependencyData[], rootNodeModulesPath: string, name: string, currentModulePath: string, depth: number): void {
		// Check if child has been extracted in the parent's node modules, AND THEN in `node_modules`
		// Slower, but prevents copying wrong versions if multiple of the same module are installed
		// Will also prevent copying project's devDependency's version if current module depends on another version
		const modulePath = path.join(currentModulePath, NODE_MODULES_FOLDER_NAME, name); // node_modules/parent/node_modules/<package>
		const alternativeModulePath = path.join(rootNodeModulesPath, name);

		this.findModule(resolvedDependencies, rootNodeModulesPath, modulePath, alternativeModulePath, name, depth);
	}

	private findModule(resolvedDependencies: IDependencyData[], rootNodeModulesPath: string, modulePath: string, rootModulesPath: string, name: string, depth: number): void {
		let exists = this.moduleExists(modulePath);
		let depthInNodeModules = depth + 1;

		if (!exists) {
			modulePath = rootModulesPath; // /node_modules/<package>
			exists = this.moduleExists(modulePath);

			depthInNodeModules = 0;
		}

		if (!exists || _.some(resolvedDependencies, deps => deps.directory === modulePath)) {
			return;
		}

		const dependency = this.getDependencyInfo(name, modulePath, depthInNodeModules);
		resolvedDependencies.push(dependency);

		this.readModuleDependencies(resolvedDependencies, rootNodeModulesPath, modulePath, depthInNodeModules, dependency);
	}

	private readModuleDependencies(resolvedDependencies: IDependencyData[], rootNodeModulesPath: string, modulePath: string, depth: number, currentModule: IDependencyData): void {
		const packageJsonPath = path.join(modulePath, PACKAGE_JSON_FILE_NAME);
		const packageJsonExists = this.$fs.getLsStats(packageJsonPath).isFile();

		if (packageJsonExists) {
			let packageJsonContents = this.$fs.readJson(packageJsonPath);

			if (!!packageJsonContents.nativescript) {
				// add `nativescript` property, necessary for resolving plugins
				currentModule.nativescript = packageJsonContents.nativescript;
			}

			_.keys(packageJsonContents.dependencies)
				.forEach((dependencyName) => {
					this.traverseDependency(resolvedDependencies, rootNodeModulesPath, dependencyName, modulePath, depth);
				});
		}
	}

	private getDependencyInfo(name: string, directory: string, depth: number): IDependencyData {
		const dependency: IDependencyData = {
			name,
			directory,
			depth
		};

		return dependency;
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
