import * as Registry from "winreg";

export class WinReg {
	public registryKeys: IHiveIds = {
		HKLM: { registry: Registry.HKLM },
		HKCU: { registry: Registry.HKCU },
		HKCR: { registry: Registry.HKCR },
		HKCC: { registry: Registry.HKCC },
		HKU: { registry: Registry.HKU },
	};

	public getRegistryItem(
		valueName: string,
		hive?: IHiveId,
		key?: string,
		host?: string
	): Promise<Winreg.RegistryItem> {
		return new Promise<Winreg.RegistryItem>((resolve, reject) => {
			const regKey = new Registry({
				hive: hive && hive.registry ? hive.registry : null,
				key: key,
				host: host,
			});

			regKey.get(valueName, (err: Error, value: Registry.RegistryItem) => {
				if (err) {
					reject(err);
				} else {
					resolve(value);
				}
			});
		});
	}

	public getRegistryValue(
		valueName: string,
		hive?: IHiveId,
		key?: string,
		host?: string
	): Promise<string> {
		return new Promise<string>((resolve, reject) => {
			return this.getRegistryItem(valueName, hive, key, host)
				.then((data) => {
					resolve(data.value);
				})
				.catch(() => {
					resolve(null);
				});
		});
	}
}
