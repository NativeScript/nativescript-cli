import * as npmconfig from "libnpmconfig";

export class NpmConfigService implements INpmConfigService {
	private config: IDictionary<any> = { };

	constructor() {
		this.readConfig();
	}

	public getConfig(): IDictionary<any> {
		return this.config;
	}

	private readConfig(): void {
		const data = npmconfig.read();
		data.forEach((value: any, key: string) => {
			// replace env ${VARS} in strings with the process.env value
			this.config[key] = typeof value !== 'string' ? value : value.replace(/\${([^}]+)}/, (_, envVar) => process.env[envVar]);
		});
	}
}
$injector.register("npmConfigService", NpmConfigService);
