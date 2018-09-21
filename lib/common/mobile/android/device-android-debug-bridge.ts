import { AndroidDebugBridge } from "./android-debug-bridge";

interface IComposeCommandResult {
	command: string;
	args: string[];
}

export class DeviceAndroidDebugBridge extends AndroidDebugBridge implements Mobile.IDeviceAndroidDebugBridge {
	constructor(private identifier: string,
		protected $childProcess: IChildProcess,
		protected $errors: IErrors,
		protected $logger: ILogger,
		protected $staticConfig: Config.IStaticConfig,
		protected $androidDebugBridgeResultHandler: Mobile.IAndroidDebugBridgeResultHandler) {
		super($childProcess, $errors, $logger, $staticConfig, $androidDebugBridgeResultHandler);
	}

	public async sendBroadcastToDevice(action: string, extras?: IStringDictionary): Promise<number> {
		extras = extras || {};
		const broadcastCommand = ["am", "broadcast", "-a", `${action}`];
		_.each(extras, (value, key) => broadcastCommand.push("-e", key, value));

		const result = await this.executeShellCommand(broadcastCommand);
		this.$logger.trace(`Broadcast result ${result} from ${broadcastCommand}`);

		const match = result.match(/Broadcast completed: result=(\d+)/);
		if (match) {
			return +match[1];
		}

		this.$errors.failWithoutHelp("Unable to broadcast to android device:\n%s", result);
	}

	protected async composeCommand(params: string[]): Promise<IComposeCommandResult> {
		return super.composeCommand(params, this.identifier);
	}
}
