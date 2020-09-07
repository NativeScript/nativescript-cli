// This is a WIP declaration file and it is not being used yet

interface IPackageJSON {
	name?: string;
	version?: string;
	dependencies?: any;
	devDependencies?: any;

	[key: string]: any;
}

interface IPackageInfo {
	name: string;
	version: string;
}

/**
 * A package identifier can be any of the following:
 *  - <package name>
 *  - <package name>@<version>
 *  - <package name>@<version range>
 *  - <package name>@<tag>
 *  - <git repo url>
 *  - <tarball url>
 *  - <tarball file>
 *  - <folder>
 */
type IPackageIdentifier = string;

interface IPackageManagerOptions {
	projectPath?: string;
}
interface IPackageManagerAddOptions extends IPackageManagerOptions {
	version?: string;
	exact?: boolean;
	scripts?: boolean;

	// these 3 are shared with the remove options, however
	// they are duplicated as they don't quite make sense
	// to be added to IPackageManagerOptions as they are
	// specific to add and remove operations
	save?: boolean;
	dev?: boolean;
	optional?: boolean;
}
interface IPackageManagerRemoveOptions extends IPackageManagerOptions {
	save?: boolean;
	dev?: boolean;
	optional?: boolean;
}

interface IPackageManager {
	add(
		packageIdentifier: IPackageIdentifier,
		options?: IPackageManagerAddOptions
	): Promise<IPackageInfo>;
	install(
		packageIdentifier: IPackageIdentifier,
		options?: IPackageManagerAddOptions
	): Promise<IPackageInfo>;

	remove(
		packageIdentifier: IPackageIdentifier,
		options?: IPackageManagerRemoveOptions
	): Promise<IPackageInfo>;
	uninstall(
		packageIdentifier: IPackageIdentifier,
		options?: IPackageManagerRemoveOptions
	): Promise<IPackageInfo>;

	getInstalledPackage(
		packageIdentifier: IPackageIdentifier
	): Promise<IPackageInfo>;
	getPackageJson(packageIdentifier: IPackageIdentifier): Promise<IPackageJSON>;
}
