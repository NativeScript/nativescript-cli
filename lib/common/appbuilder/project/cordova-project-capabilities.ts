export class CordovaProjectCapabilities implements Project.ICapabilities {
	public get build(): boolean {
		return true;
	}

	public get buildCompanion(): boolean {
		return true;
	}

	public get deploy(): boolean {
		return true;
	}

	public get simulate(): boolean {
		return true;
	}

	public get livesync(): boolean {
		return true;
	}

	public get livesyncCompanion(): boolean {
		return true;
	}

	public get updateKendo(): boolean {
		return true;
	}

	public get emulate(): boolean {
		return true;
	}

	public get publish(): boolean {
		return false;
	}

	public get uploadToAppstore(): boolean {
		return true;
	}

	public get canChangeFrameworkVersion(): boolean {
		return true;
	}

	public get imageGeneration(): boolean {
		return true;
	}

	public get wp8Supported(): boolean {
		return true;
	}
}
$injector.register("cordovaProjectCapabilities", CordovaProjectCapabilities);
