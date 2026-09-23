declare module "nativescript-dev-xcode" {
	interface Options {
		[key: string]: any;

		customFramework?: boolean;
		embed?: boolean;
		relativePath?: string;
	}

	class project {
		hash: any;
		filepath: string;
		constructor(filename: string);

		parse(callback: () => void): void;
		parseSync(): void;

		generateUuid(): string;

		writeSync(options: any): string;

		addFramework(filepath: string, options?: Options): void;
		removeFramework(filePath: string, options?: Options): void;


		getProductFile(watchApptarget: target): any;
		addToPbxFrameworksBuildPhase(file);
		addToPbxCopyfilesBuildPhase(file, comment: string, targetid: string);
		pbxFrameworksBuildPhaseObj(targetid: string): any;
		pbxBuildFileSection(): {[k: string] : any};

		addPbxGroup(
			filePathsArray: any[],
			name: string,
			path: string,
			sourceTree: string
		): void;

		removePbxGroup(groupName: string, path: string): void;

		addTargetDependency(target: string, dependencyTargets: string[]);

		findTargetKey(name: string);
		pbxTargetByName(name: string): target;
		pbxNativeTargetSection(): {[key: string]: any};

		addToHeaderSearchPaths(options?: Options): void;
		removeFromHeaderSearchPaths(options?: Options): void;
		updateBuildProperty(key: string, value: any): void;

		pbxXCBuildConfigurationSection(): any;

		buildPhaseObject(
			buildPhaseType: string,
			comment: string,
			target: tstring
		)

		addTarget(
			targetName: string,
			targetType: string,
			targetPath?: string,
			parentTarget?: string,
			productTargetType?: string
		): target;
		addBuildPhase(
			filePathsArray: string[],
			buildPhaseType: string,
			comment: string,
			target?: string,
			optionsOrFolderType?: Object | string,
			subfolderPath?: string
		): any;
		addToBuildSettings(
			buildSetting: string,
			value: any,
			targetUuid?: string
		): void;
		addPbxGroup(
			filePathsArray: string[],
			name: string,
			path: string,
			sourceTree: string,
			opt: {
				filesRelativeToProject?: boolean;
				target?: string;
				uuid?: string;
				isMain?: boolean;
			}
		): group;
		addBuildProperty(
			prop: string,
			value: any,
			build_name?: string,
			productName?: string
		): void;
		addToHeaderSearchPaths(file: string | Object, productName?: string): void;
		removeTargetsByProductType(targetType: string): void;
		getFirstTarget(): { uuid: string };
	}

	class target {
		uuid: string;
		pbxNativeTarget: { productName: string };
	}

	class group {
		uuid: string;
		pbxGroup: Object;
	}
}
