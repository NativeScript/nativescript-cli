import { killServer, getServerAddress } from "nativescript-cli-server";

export class KillServerCommand implements ICommand {

	public allowedParameters: ICommandParameter[] = [];

	public execute(args: string[]): Promise<void> {
		return killServer();
	}
}

export class StartServerCommand implements ICommand {

	public allowedParameters: ICommandParameter[] = [];

	public execute(args: string[]): Promise<void> {
		return getServerAddress();
	}
}

$injector.registerCommand("kill-cli-server", KillServerCommand);
$injector.registerCommand("start-cli-server", StartServerCommand);
