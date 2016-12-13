import * as path from "path";
import * as fs from "fs";

export class NodeModulesDependenciesBuilder implements INodeModulesDependenciesBuilder {
    private projectPath: string;
    private rootNodeModulesPath: string;
    private resolvedDependencies: any[];
    private seen: any;

    public constructor(private $fs: IFileSystem) {
        this.seen = {};
        this.resolvedDependencies = [];
    }

    public getProductionDependencies(projectPath: string): any[] {
        this.projectPath = projectPath;
        this.rootNodeModulesPath = path.join(this.projectPath, "node_modules");

        let projectPackageJsonpath = path.join(this.projectPath, "package.json");
        let packageJsonContent = this.$fs.readJson(projectPackageJsonpath);

        _.keys(packageJsonContent.dependencies).forEach(dependencyName => {
            let depth = 0;
            let directory = path.join(this.rootNodeModulesPath, dependencyName);

            // find and traverse child with name `key`, parent's directory -> dep.directory
            this.traverseDependency(dependencyName, directory, depth);
        });

        return this.resolvedDependencies;
    }

    private traverseDependency(name: string, currentModulePath: string, depth: number): void {
        // Check if child has been extracted in the parent's node modules, AND THEN in `node_modules`
        // Slower, but prevents copying wrong versions if multiple of the same module are installed
        // Will also prevent copying project's devDependency's version if current module depends on another version
        let modulePath = path.join(currentModulePath, "node_modules", name); // node_modules/parent/node_modules/<package>
        let alternativeModulePath = path.join(this.rootNodeModulesPath, name);

        this.findModule(modulePath, alternativeModulePath, name, depth);
    }

    private findModule(modulePath: string, alternativeModulePath: string, name: string, depth: number) {
        let exists = this.moduleExists(modulePath);

        if (exists) {
            if (this.seen[modulePath]) {
                return;
            }

            let dependency = this.addDependency(name, modulePath, depth + 1);
            this.readModuleDependencies(modulePath, depth + 1, dependency);
        } else {
            modulePath = alternativeModulePath; // /node_modules/<package>
            exists = this.moduleExists(modulePath);

            if (!exists) {
                return;
            }

            if (this.seen[modulePath]) {
                return;
            }

            let dependency = this.addDependency(name, modulePath, 0);
            this.readModuleDependencies(modulePath, 0, dependency);
        }

        this.seen[modulePath] = true;
    }

    private readModuleDependencies(modulePath: string, depth: number, currentModule: any): void {
        let packageJsonPath = path.join(modulePath, 'package.json');
        let packageJsonExists = fs.lstatSync(packageJsonPath).isFile();

        if (packageJsonExists) {
            let packageJsonContents = this.$fs.readJson(packageJsonPath);

            if (!!packageJsonContents.nativescript) {
                // add `nativescript` property, necessary for resolving plugins
                currentModule.nativescript = packageJsonContents.nativescript;
            }

            _.keys(packageJsonContents.dependencies).forEach((dependencyName) => {
                this.traverseDependency(dependencyName, modulePath, depth);
            });
        }
    }

    private addDependency(name: string, directory: string, depth: number): any {
        let dependency: any = {
            name,
            directory,
            depth
        };

        this.resolvedDependencies.push(dependency);

        return dependency;
    }

    private moduleExists(modulePath: string): boolean {
        try {
            let exists = fs.lstatSync(modulePath);
            if (exists.isSymbolicLink()) {
                exists = fs.lstatSync(fs.realpathSync(modulePath));
            }
            return exists.isDirectory();
        } catch (e) {
            return false;
        }
    }
}

$injector.register("nodeModulesDependenciesBuilder", NodeModulesDependenciesBuilder);
