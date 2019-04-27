export class PlatformWorkflowDataFactory implements IPlatformWorkflowDataFactory {
	public createPlatformWorkflowData(platformParam: string, options: IOptions, nativePrepare?: INativePrepare): IPlatformWorkflowData {
		if (platformParam.toLowerCase() === "ios") {
			return (new IOSWorkflowData(platformParam, options, nativePrepare)).data;
		} else if (platformParam.toLowerCase() === "android") {
			return (new AndroidWorkflowData(platformParam, options, nativePrepare)).data;
		} else {
			throw new Error("Invalid workflowData!!!");
		}
	}
}
$injector.register("platformWorkflowDataFactory", PlatformWorkflowDataFactory);

abstract class WorkflowDataBase<TSigningOptions> {
	constructor(protected platformParam: string, protected $options: IOptions, protected nativePrepare?: INativePrepare) { }

	public abstract signingOptions: TSigningOptions;

	public get data() {
		return { ...this.baseData, signingOptions: this.signingOptions };
	}

	private baseData = {
		platformParam: this.platformParam,
		release: this.$options.release,
		useHotModuleReload: this.$options.hmr,
		env: this.$options.env,
		nativePrepare: this.nativePrepare
	};
}

class AndroidWorkflowData extends WorkflowDataBase<IAndroidSigningOptions> {
	constructor(platformParam: string, $options: IOptions, nativePrepare?: INativePrepare) {
		super(platformParam, $options, nativePrepare);
	}

	public signingOptions: IAndroidSigningOptions = {
		keyStoreAlias: this.$options.keyStoreAlias,
		keyStorePath: this.$options.keyStorePath,
		keyStoreAliasPassword: this.$options.keyStoreAliasPassword,
		keyStorePassword: this.$options.keyStorePassword,
	};
}

class IOSWorkflowData extends WorkflowDataBase<IiOSSigningOptions> {
	constructor(platformParam: string, $options: IOptions, nativePrepare?: INativePrepare) {
		super(platformParam, $options, nativePrepare);
	}

	public signingOptions: IiOSSigningOptions = {
		teamId: this.$options.teamId,
		provision: this.$options.provision,
	};
}
