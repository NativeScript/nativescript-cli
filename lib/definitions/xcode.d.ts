declare module "nativescript-dev-xcode" {
    interface Options {
        [key: string]: any;

        customFramework?: boolean;
        embed?: boolean;
        relativePath?: string;
    }

    class project {
        constructor(filename: string);

        parse(callback: () => void): void;
        parseSync(): void;

        writeSync(): string;

        addFramework(filepath: string, options?: Options): void;
        removeFramework(filePath: string, options?: Options): void;
        
        addPbxGroup(filePathsArray: any[], name: string, path: string, sourceTree: string): void;
        
        removePbxGroup(groupName: string, path: string): void;
        
        addToHeaderSearchPaths(options?: Options): void;
        removeFromHeaderSearchPaths(options?: Options): void;
        updateBuildProperty(key: string, value: any): void;

        pbxXCBuildConfigurationSection(): any;
    }
}