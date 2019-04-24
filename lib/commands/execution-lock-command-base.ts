export abstract class ExecutionLockCommandBase implements IExecutionLockCommandBase {
	constructor (
		protected $projectData: IProjectData,
		protected $errors: IErrors,
		protected $logger: ILogger,
		protected $lockService: ILockService,
		protected $processService: IProcessService){
		this.$processService.attachToProcessExitSignals(this, this.unlockExecution);
	}
	private releaseHandle:  () => Promise<void>

	public async lockExecution(): Promise<void> {
		try {
			this.releaseHandle = await this.$lockService.lock(this.$projectData.projectDir, {onCompromised: ()=>{}});
		} catch (e) {
			this.$logger.trace("Failed to lock execution.");
		}
	}

	public async checkExecutionLock(): Promise<void> {
		const isLocked = await this.$lockService.check(this.$projectData.projectDir);
		if(isLocked) {
			this.$errors.failWithoutHelp("Another CLI process is currently working on this project.");
		}
	}

	public async unlockExecution(): Promise<void> {
		if(this.releaseHandle) {
			await this.releaseHandle();
		}
	}

	public async dispose(): Promise<void> {
		this.unlockExecution();
	}
}
