import * as path from "path";
import { PACKAGE_JSON_FILE_NAME } from "../../constants";
import { INodeModulesDependenciesBuilder } from "../../definitions/platform";
import { IDependencyData } from "../../declarations";
import { IFileSystem } from "../../common/declarations";
import * as _ from "lodash";
import { injector } from "../../common/yok";
import { resolvePackagePath } from "@rigor789/resolve-package-path";

interface IDependencyDescription {
	parent: IDependencyDescription;
	parentDir: string;
	name: string;
	depth: number;
}

export class NodeModulesDependenciesBuilder
	implements INodeModulesDependenciesBuilder {
	public constructor(private $fs: IFileSystem) {}

	public getProductionDependencies(
		projectPath: string,
		ignore?: string[]
	): IDependencyData[] {
		const projectPackageJsonPath = path.join(
			projectPath,
			PACKAGE_JSON_FILE_NAME
		);
		const packageJsonContent = this.$fs.readJson(projectPackageJsonPath);
		const dependencies = packageJsonContent && packageJsonContent.dependencies;

		const resolvedDependencies: IDependencyData[] = [];

		const queue: IDependencyDescription[] = _.keys(dependencies).map(
			(dependencyName) => ({
				parent: null,
				parentDir: projectPath,
				name: dependencyName,
				depth: 0,
			})
		);

		while (queue.length) {
			const currentModule = queue.shift();
			const resolvedDependency = this.findModule(
				currentModule,
				resolvedDependencies,
				projectPath
			);

			if (
				resolvedDependency &&
				!_.some(
					resolvedDependencies,
					(r) => r.directory === resolvedDependency.directory
				)
			) {
				_.each(resolvedDependency.dependencies, (d) => {
					const dependency: IDependencyDescription = {
						parent: currentModule,
						name: d,
						parentDir: resolvedDependency.directory,
						depth: resolvedDependency.depth + 1,
					};

					const shouldAdd = !_.some(
						queue,
						(element) =>
							element.parent === dependency.parent &&
							element.name === dependency.name &&
							element.parentDir === dependency.parentDir &&
							element.depth === dependency.depth
					);

					if (shouldAdd) {
						queue.push(dependency);
					}
				});

				resolvedDependencies.push(resolvedDependency);
			}
		}
		if (ignore && ignore.length > 0) {
			return resolvedDependencies.filter((d) => ignore.indexOf(d.name) === -1);
		}
		return resolvedDependencies;
	}

	private findModule(
		depDescription: IDependencyDescription,
		resolvedDependencies: IDependencyData[],
		rootPath: string
	): IDependencyData {
		try {
			const parentModulesPath =
				depDescription?.parentDir ?? depDescription?.parent?.parentDir;

			let modulePath: string = resolvePackagePath(depDescription.name, {
				paths: [parentModulesPath],
			});

			// perhaps traverse up the tree here?
			if (!modulePath) {
				// fallback to searching in the root path
				modulePath = resolvePackagePath(depDescription.name, {
					paths: [rootPath],
				});
			}

			// if we failed to find the module...
			if (!modulePath) {
				return null;
			}

			// if we already resolved this dependency, we return null to avoid a duplicate resolution
			if (
				resolvedDependencies.some((r) => {
					return r.name === depDescription.name && r.directory === modulePath;
				})
			) {
				return null;
			}

			return this.getDependencyData(
				depDescription.name,
				modulePath,
				depDescription.depth
			);
		} catch (err) {
			return null;
		}
	}

	private getDependencyData(
		name: string,
		directory: string,
		depth: number
	): IDependencyData {
		const dependency: IDependencyData = {
			name,
			directory,
			depth,
			version: null,
		};

		const packageJsonPath = path.join(directory, PACKAGE_JSON_FILE_NAME);
		const packageJsonExists = this.$fs.getLsStats(packageJsonPath).isFile();

		if (packageJsonExists) {
			const packageJsonContents = this.$fs.readJson(packageJsonPath);

			dependency.version = packageJsonContents.version;
			if (!!packageJsonContents.nativescript) {
				// add `nativescript` property, necessary for resolving plugins
				dependency.nativescript = packageJsonContents.nativescript;
			}

			dependency.dependencies = _.keys(packageJsonContents.dependencies);
			return dependency;
		}

		return null;
	}
}

injector.register(
	"nodeModulesDependenciesBuilder",
	NodeModulesDependenciesBuilder
);
