import open from "open";
import { IOpener } from "../declarations";
import { injector } from "./yok";

export class Opener implements IOpener {
	public open(target: string, appname?: string): any {
		return open(target, {
			app: {
				name: appname
			}
		});
	}
}
injector.register("opener", Opener);
