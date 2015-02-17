declare module "xcode" {
    interface FrameworkOptions {
        [key: string]: any;

        customFramework?: boolean;

        embed?: boolean;
    }

    class project {
        constructor(filename: string);

        parse(callback: () => void): void;
        parseSync(): void;

        writeSync(): string;

        addFramework(filepath: string, options?: FrameworkOptions): void;
        removeFramework(filePath: string, options?: FrameworkOptions): void;

        updateBuildProperty(key: string, value: any): void;
    }
}