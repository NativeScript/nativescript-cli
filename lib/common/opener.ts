import * as xopen from "open";
import { IOpener } from "../declarations";
import { injector } from "./yok";

/**
 * Launching a browser or an external app is unwanted wherever nobody is
 * watching a desktop: CI, test runs, and agents driving the CLI. Opting out
 * has to live here because this is the only place the CLI opens anything.
 */
export function isOpeningExternallyDisabled(): boolean {
	const flag = (process.env.NS_NO_OPEN || "").toLowerCase();
	if (flag) {
		return !["0", "false", "off", "no"].includes(flag);
	}

	return !!(process.env.CI || process.env.JENKINS_HOME);
}

export class Opener implements IOpener {
	public open(target: string, appname?: string): any {
		if (isOpeningExternallyDisabled()) {
			return undefined;
		}

		return xopen(target, {
			app: {
				name: appname,
			},
		});
	}
}
injector.register("opener", Opener);
