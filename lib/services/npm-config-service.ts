import { INpmConfigService } from "../declarations";
import { IDictionary } from "../common/declarations";
import { injector } from "../common/yok";
import { execSync } from "child_process";
import { cache } from "../common/decorators";

export class NpmConfigService implements INpmConfigService {
	private config: IDictionary<any> = {};

	constructor() {
		this.readConfig();
	}

	public getConfig(): IDictionary<any> {
		return this.config;
	}

	@cache()
	private readConfig(): void {
		try {
			const res = execSync("npm config list --json");
			// const data: any = npmconfig.read();
			const data: Record<string, any> = JSON.parse(res.toString());

			// todo: remove if not needed with npm config list --json?
			Object.entries(data).forEach(([key, value]) => {
				// replace env ${VARS} in strings with the process.env value
				this.config[key] =
					typeof value !== "string"
						? value
						: value.replace(/\${([^}]+)}/, (_, envVar) => process.env[envVar]);
			});
		} catch (e) {}
	}
}
injector.register("npmConfigService", NpmConfigService);
