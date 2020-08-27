interface IUpdateController {
	update(updateOptions: IUpdateOptions): Promise<void>;
	shouldUpdate({
		projectDir,
		version,
	}: {
		projectDir: string;
		version?: string;
	}): Promise<boolean>;
}

interface IUpdateOptions {
	projectDir: string;
	version?: string;
	frameworkPath?: string;
}
