import * as os from "os";
import { IOsInfo } from "./declarations";
import { $injector } from "./definitions/yok";

export class OsInfo implements IOsInfo {
	public type(): string {
		return os.type();
	}

	public release(): string {
		return os.release();
	}

	public arch(): string {
		return os.arch();
	}

	public platform(): string {
		return os.platform();
	}
}

$injector.register("osInfo", OsInfo);
