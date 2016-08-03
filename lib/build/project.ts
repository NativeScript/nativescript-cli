import { existsSync, writeFileSync, readFileSync, readdirSync, lstatSync, mkdirSync, unlinkSync, rmdirSync } from "fs";
import { join, sep, dirname, basename } from "path";
import * as semver from "semver";

function track<T>(label: string, task: () => T): T {
    console.log(label + "...");
    console.time(label);
    let result = task();
    console.timeEnd(label);
    return result;
}

export class Project {

    public source: Project.Source;

    constructor(public path: string) {
        console.log("new project at: " + this.path);
        // TODO: Test all with --path projectpath, the current code assumes cwd is at the project root.
    }

    public rebuild() {
        track("rebuild", () => {
            this.source = new Project.Source(this.path, ["ios", "android"]);

            let platforms = {
                ios: new Project.Target.iOS(this),
                android: new Project.Target.Android(this)
            }

            platforms.ios.rebuild();
            platforms.android.rebuild();
        });
    }
}

export namespace Project {
    export namespace Package {
        export interface Json {
            name?: string;
            version?: string;
            dependencies?: { [key: string]: string };
            devDependencies?: { [key: string]: string };
            nativescript: {
                id: string;
            }
        }
        export const enum Type {
            App,
            Package,
            Nested
        }

        export const enum Availability {
            Available,
            NotInstalled,
            ShadowedByAncestor,
            ShadowedByDiverged
        }
    }

    export interface Package {
        type: Package.Type;
        name: string;
        path: string;
        packageJson: Package.Json;
        version: string;
        requiredVersion: string;
        resolvedAtParent: { [key: string]: any; };
        resolvedAtGrandparent: { [key: string]: any; };
        children: Package[];
        scriptFiles: string[];
        directories: string[];
        availability: Package.Availability;
    }

    export interface PackageMap {
        [dependency: string]: Package;
    }

    export class Source {

        public app: Package;
        public packages: PackageMap;

        constructor(private path: string, public platforms: string[]) {
            this.app = {
                type: Package.Type.App,
                name: ".",
                path: ".",
                packageJson: null,
                requiredVersion: "*",
                version: null,
                resolvedAtParent: {},
                resolvedAtGrandparent: {},
                children: [],
                scriptFiles: [],
                directories: [],
                availability: Package.Availability.Available
            }
            this.packages = {};

            track("read dependencies", () => this.selectDependencyPackages(this.app));
            track("read dependency files", () => this.listPackageFiles(this.app));
            track("read app files", () => this.listAppFiles());

            // TODO: If verbose...
            // TODO: Implement diagnostics and warn problems even in non-verbose mode.
            // this.printPackages();

            // TODO: If extremely verbose
            // this.printFiles();
        }

        private selectDependencyPackages(pack: Package) {

            let packageJsonPath = join(pack.path, "package.json");

            if (!existsSync(packageJsonPath)) {
                pack.availability = Package.Availability.NotInstalled;
                return;
            }

            if (pack.name in pack.resolvedAtGrandparent) {
                pack.availability = Package.Availability.ShadowedByAncestor;
                return;
            }

            // TODO: mind BOM
            pack.packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
            pack.version = pack.packageJson.version;

            if (pack.type === Package.Type.App) {
                if (pack.packageJson.nativescript && pack.packageJson.nativescript.id) {
                    pack.name = pack.packageJson.nativescript.id;
                }
            } else if (pack.name in this.packages) {
                // Resolve conflicts
                let other = this.packages[pack.name];
                // Get the one with higher version...
                let packVersion = pack.packageJson.version;
                let otherVersion = other.packageJson.version;
                if (semver.gt(packVersion, otherVersion)) {
                    pack.availability = Package.Availability.Available;
                    other.availability = Package.Availability.ShadowedByDiverged;
                    this.packages[pack.name] = pack;
                } else {
                    pack.availability = Package.Availability.ShadowedByDiverged;
                }
            } else {
                pack.availability = Package.Availability.Available;
                this.packages[pack.name] = pack;
            }

            let resolved: { [key: string]: any; } = {};
            for (let key in pack.resolvedAtParent) {
                resolved[key] = pack.resolvedAtParent[key];
            }
            for (var dependency in pack.packageJson.dependencies) {
                resolved[dependency] = true;
            }

            for (var dependency in pack.packageJson.dependencies) {
                let requiredVersion = pack.packageJson.dependencies[dependency];
                let dependencyPath = join(pack.path, "node_modules", dependency);
                let child: Package = {
                    type: Package.Type.Package,
                    name: dependency,
                    path: dependencyPath,
                    packageJson: null,
                    version: null,
                    requiredVersion,
                    resolvedAtGrandparent: pack.resolvedAtParent,
                    resolvedAtParent: resolved,
                    children: [],
                    scriptFiles: [],
                    directories: [],
                    availability: Package.Availability.NotInstalled
                }
                pack.children.push(child);
                this.selectDependencyPackages(child);
            }
        }

        private listAppFiles() {
            let appPath = "app";
            let ignoreFiles = {
                ["app" + sep + "App_Resources"]: true
            };

            if (existsSync(appPath)) {
                this.app.directories.push("app/");
                let listAppFiles = (path: string) => {
                    readdirSync(path).forEach(f => {
                        let filePath = path + sep + f;
                        if (filePath in ignoreFiles) {
                            return;
                        }
                        let dirPath = filePath + sep;
                        let lstat = lstatSync(filePath);
                        if (lstat.isDirectory()) {
                            this.app.directories.push(dirPath);
                            listAppFiles(filePath);
                        } else if (lstat.isFile()) {
                            this.app.scriptFiles.push(filePath);
                        }
                    });
                }
                listAppFiles(appPath);
            }
        }

        private listPackageFiles(pack: Package) {
            if (pack.type === Package.Type.Package && pack.availability === Package.Availability.Available) {
                this.listNestedPackageFiles(pack, pack.path, pack);
            }
            pack.children.forEach(child => this.listPackageFiles(child));
        }

        private listNestedPackageFiles(pack: Package, dirPath: string, fileScope: Package) {
            // TODO: Once per pack:
            let modulePackageJson = pack.path + sep + "package.json";
            let ignorePaths: { [key:string]: boolean } = {
                [pack.path + sep + "node_modules"]: true,
                [pack.path + sep + "platforms"]: true
            };
            let scopePathLength = fileScope.path.length + sep.length;
            readdirSync(dirPath).forEach(childPath => {
                let path = dirPath + sep + childPath;
                if (path in ignorePaths) {
                    return;
                }
                let stat = lstatSync(path);
                if (stat.isDirectory()) {
                    let packageJsonPath = path + sep + "package.json";
                    if (modulePackageJson != packageJsonPath && existsSync(packageJsonPath)) {
                        let packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));

                        let nestedPackage: Package = {
                            type: Package.Type.Nested,
                            name: path.substr(pack.path.length + sep.length),
                            path,
                            packageJson,
                            version: null,
                            requiredVersion: null,
                            resolvedAtParent: null,
                            resolvedAtGrandparent: null,
                            children: [],
                            scriptFiles: [],
                            directories: [],
                            availability: Package.Availability.Available
                        };

                        pack.children.push(nestedPackage);

                        if (nestedPackage.name in this.packages) {
                            let other = this.packages[pack.name];
                            pack.availability = Package.Availability.ShadowedByDiverged;
                        } else {
                            this.packages[nestedPackage.name] = nestedPackage;
                        }
                        this.listNestedPackageFiles(pack, path, nestedPackage);
                    } else {
                        let relativePath = path.substr(scopePathLength);
                        fileScope.directories.push(relativePath);
                        this.listNestedPackageFiles(pack, path, fileScope);
                    }
                } else if (stat.isFile()) {
                    let relativePath = path.substr(scopePathLength);
                    fileScope.scriptFiles.push(relativePath);
                }
            });
        }

        private printPackages() {
            let avLabel: { [key: number]: string } = {
                [Package.Availability.Available]: "",
                [Package.Availability.NotInstalled]: "(not installed)",
                [Package.Availability.ShadowedByAncestor]: "(shadowed by ancestor)",
                [Package.Availability.ShadowedByDiverged]: "(shadowed by diverged)"
            }

            let avSign: { [key: number]: string } = {
                [Package.Availability.Available]: "✔",
                [Package.Availability.NotInstalled]: "✘",
                [Package.Availability.ShadowedByAncestor]: "✘",
                [Package.Availability.ShadowedByDiverged]: "✘"
            }

            let printPackagesRecursive = (pack: Package, ident: string, parentIsLast: boolean) => {
                console.log(ident + (this.app === pack ? "" : (parentIsLast ? "└── " : "├── ")) + avSign[pack.availability] + " " + pack.name + (pack.version ? "@" + pack.version : "") + " " + avLabel[pack.availability] + (pack.scriptFiles.length > 0 ? "(" + pack.scriptFiles.length + ")" : ""));
                pack.children.forEach((child, index, children) => {
                    let isLast = index === children.length - 1;
                    printPackagesRecursive(child, ident + (this.app === pack ? "" : (parentIsLast ? "    " : "│   ")), isLast);
                });
            }

            printPackagesRecursive(this.app, "", true);
        }

        private printFiles() {
            console.log("app: " + this.app.name);
            this.app.scriptFiles.forEach(f => console.log("  " + f));
            Object.keys(this.packages).forEach(dependecy => {
                let pack = this.packages[dependecy];
                console.log("dependency: " + pack.name + " at " + pack.path);
                pack.scriptFiles.forEach(f => console.log("  " + f));
            })
        }
    }

    export class Target {

        private source: Source;

        constructor(private project: Project, private platform: string, private output: Target.OutPaths) {
            this.source = project.source;
        }

        public rebuild() {
            track("rebuild " + this.platform, () => {
                let delta = track("rebuild delta", () => this.rebuildDelta());

                // Very verbose:
                // this.printDelta(delta);

                track("apply delta", () => this.applyDelta(delta));
            });
        }

        private printDelta(delta: Target.Delta) {
            console.log("mkdir:");
            Object.keys(delta.mkdir).sort().forEach(d => console.log("    " + d));

            console.log("copy:");
            Object.keys(delta.copy).sort().forEach(f => console.log("    " + f + " < " + delta.copy[f]));

            console.log("rmfile:");
            Object.keys(delta.rmfile).sort().forEach(f => console.log("    " + f));

            console.log("rmdir:");
            Object.keys(delta.rmdir).sort().reverse().forEach(d => console.log("    " + d));
        }

        private buildDelta(): Target.Delta {
            let platformSuffix = "." + this.platform + ".";
            let platformSuffixFilter = this.source.platforms.filter(p => p != this.platform).map(p => "." + p + ".");

            let delta: Target.Delta = {
                mkdir: {},
                copy: {},
                rmfile: {},
                rmdir: {}
            }

            function mkdirRecursive(dir: string) {
                utils.path.basedirs(dir).forEach(dir => delta.mkdir[dir] = true);
            }

            mkdirRecursive(this.output.app);
            mkdirRecursive(this.output.modules);

            let appPrefixLength = ("app" + sep).length;
            let mapPath = (path: string): string => {
                let relativePath = path.substr(appPrefixLength);
                if (relativePath.length > 0) {
                    return this.output.app + sep + relativePath;
                } else {
                    return null;
                }
            }

            this.source.app.directories.map(mapPath).filter(f => f != null).forEach(file => delta.mkdir[file] = true);
            this.source.app.scriptFiles.forEach(file => delta.copy[mapPath(file)] = file);

            let copyAll = (pack: Package): void => {
                pack.scriptFiles.forEach(file => {
                    if (platformSuffixFilter.some(f => file.indexOf(f) >= 0)) {
                        return;
                    }
                    let from = pack.path + sep + file;
                    let to = this.output.modules + sep + pack.name + sep + file.replace(platformSuffix, ".");
                    // TODO: If `to in delta.copy`, log collision.
                    delta.copy[to] = from;
                });
            }

            let mkdirAll = (pack: Package): void => {
                if (pack.type === Package.Type.App) {
                    return;
                }

                let path = this.output.modules + sep;
                pack.name.split(sep).forEach(dir => {
                    path = path + dir + sep;
                    delta.mkdir[path] = true;
                });

                pack.directories.forEach(dir => {
                    let path = this.output.modules + sep + pack.name + sep + dir + sep;
                    delta.mkdir[path] = true;
                });
            }

            for (let key in this.source.packages) {
                let pack = this.source.packages[key];
                copyAll(pack);
                mkdirAll(pack);
            }

            return delta;
        }

        private rebuildDelta(): Target.Delta {
            let buildDelta = this.buildDelta();

            let delta: Target.Delta = {
                copy: buildDelta.copy,
                mkdir: buildDelta.mkdir,
                rmdir: {},
                rmfile: {}
            };

            let diffed: { [path: string]: boolean } = {};
            let diff = (filePath: string) => {
                if (filePath in diffed) {
                    return;
                }
                diffed[filePath] = true;

                let dirPath = filePath + sep;
                let targetStat = lstatSync(filePath);
                if (targetStat.isDirectory()) {
                    if (dirPath in delta.mkdir) {
                        delete delta.mkdir[dirPath];
                    } else {
                        delta.rmdir[dirPath] = true;
                    }
                    readdirSync(filePath).forEach(f => diff(dirPath + f));
                } else if (targetStat.isFile()) {
                    if (filePath in delta.copy) {
                        let source = delta.copy[filePath];
                        let srcStat = lstatSync(source);
                        let newer = targetStat.mtime.getTime() < srcStat.mtime.getTime();
                        if (!newer) {
                            delete delta.copy[filePath];
                        }
                    } else {
                        delta.rmfile[filePath] = true;
                    }
                }
            };

            if (existsSync(this.output.app)) {
                diff(this.output.app);
            }
            utils.path.basedirs(this.output.app).filter(dir => existsSync(dir) && dir in delta.mkdir).forEach(dir => delete delta.mkdir[dir]);
            if (existsSync(this.output.modules)) {
                diff(this.output.modules);
            }
            utils.path.basedirs(this.output.modules).filter(dir => existsSync(dir) && dir in delta.mkdir).forEach(dir => delete delta.mkdir[dir]);

            return delta;
        }

        private applyDelta(delta: Target.Delta) {
            Object.keys(delta.mkdir).sort().forEach(dir => mkdirSync(dir));
            Object.keys(delta.copy).forEach(to => {
                let from = delta.copy[to];
                writeFileSync(to, readFileSync(from)); // TODO: Profile with fs.link here.
            });
            Object.keys(delta.rmfile).forEach(file => unlinkSync(file));
            Object.keys(delta.rmdir).sort().reverse().forEach(dir => rmdirSync(dir));
        }
    }

    export namespace Target {
        export interface Delta {
            copy: { [to: string]: /* from: */ string },
            mkdir: { [dir: string]: boolean } /* Set<string> */
            rmfile: { [dir: string]: boolean } /* Set<string> */,
            rmdir: { [dir: string]: boolean } /* Set<string> */,
        }

        export interface OutPaths {
            app: string;
            modules: string;
        }

        export class iOS extends Target {
            constructor(project: Project) {
                super(project, "ios", {
                    app: join("platforms", "ios", basename(project.path), "app"),
                    modules: join("platforms", "ios", basename(project.path), "app", "tns_modules")
                });
            }
        }

        export class Android extends Target {
            constructor(project: Project) {
                super(project, "android", {
                    app: join("platforms", "android", "src", "main", "assets", "app"),
                    modules: join("platforms", "android", "src", "main", "assets", "app", "tns_modules")
                });
            }
        }
    }
}

namespace utils {
    export namespace path {
        /**
         * Return all base directories in ascending order.
         * For example basedirs("platforms/ios/test/") will yield ["platforms/", "platforms/ios/", "platforms/ios/tests/"]. 
         */
        export function basedirs(dir: string): string[] {
            let result: string[] = [];
            let path: string = "";
            dir.split(sep).forEach(f => result.push(path += f + sep));
            return result;
        }
    }
}
