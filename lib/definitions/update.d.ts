interface IUpdateController {
	update(projectDir: string, version?: string, frameworkPath?: string): Promise<void>;
	shouldUpdate({projectDir, version}: {projectDir: string, version?: string}): Promise<boolean>
}