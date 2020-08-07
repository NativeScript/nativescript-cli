import xopen from "open";

import { IOpener } from "./declarations";

export class Opener implements IOpener {

	public open(target: string, appname?: string): any {
		return xopen(target, appname);
	}
}
$injector.register("opener", Opener);
