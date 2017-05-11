import * as mobileprovision from "ios-mobileprovision-finder";
import { createTable } from "../common/helpers";

const months = ["Jan", "Feb", "Marc", "Apr", "May", "June", "July", "Aug", "Sept", "Oct", "Nov", "Dec"];
function formatDate(date: Date): string {
	return `${date.getDay()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

export class IOSProvisionService {
	constructor(
		private $logger: ILogger,
		private $options: IOptions,
		private $devicesService: Mobile.IDevicesService,
		private $mobileHelper: Mobile.IMobileHelper) {
	}

	public async pick(uuidOrName: string, projectId: string): Promise<mobileprovision.provision.MobileProvision> {
		const match = (await this.queryProvisioningProfilesAndDevices(projectId)).match;
		return match.eligable.find(prov => prov.UUID === uuidOrName)
			|| match.eligable.find(prov => prov.Name === uuidOrName)
			|| match.nonEligable.find(prov => prov.UUID === uuidOrName)
			|| match.nonEligable.find(prov => prov.Name === uuidOrName);
	}

	public async list(projectId: string): Promise<void> {
		const data = await this.queryProvisioningProfilesAndDevices(projectId);
		const devices = data.devices;
		const match = data.match;

		function formatSupportedDeviceCount(prov: mobileprovision.provision.MobileProvision) {
			if (devices.length > 0 && prov.Type === "Development") {
				return prov.ProvisionedDevices.filter(device => devices.indexOf(device) >= 0).length + "/" + devices.length + " targets";
			} else {
				return "";
			}
		}

		function formatTotalDeviceCount(prov: mobileprovision.provision.MobileProvision) {
			if (prov.Type === "Development" && prov.ProvisionedDevices) {
				return prov.ProvisionedDevices.length + " total";
			} else if (prov.Type === "AdHoc") {
				return "all";
			} else {
				return "";
			}
		}

		const table = createTable(["Provision Name / Provision UUID / App Id", "Team", "Type / Due", "Devices"], []);

		function pushProvision(prov: mobileprovision.provision.MobileProvision) {
			table.push(["", "", "", ""]);
			table.push(["\"" + prov.Name + "\"", prov.TeamName, prov.Type, formatTotalDeviceCount(prov)]);
			table.push([prov.UUID, prov.TeamIdentifier && prov.TeamIdentifier.length > 0 ? "(" + prov.TeamIdentifier[0] + ")" : "", formatDate(prov.ExpirationDate), formatSupportedDeviceCount(prov)]);
			table.push([prov.Entitlements["application-identifier"], "", "", ""]);
		}
		match.eligable.forEach(prov => pushProvision(prov));

		this.$logger.out(table.toString());
		this.$logger.out();
		this.$logger.out("There are also " + match.nonEligable.length + " non-eligable provisioning profiles.");
		this.$logger.out();

	}

	private async queryProvisioningProfilesAndDevices(projectId: string): Promise<{ devices: string[], match: mobileprovision.provision.Result }> {
		const certificates = mobileprovision.cert.read();
		const provisions = mobileprovision.provision.read();

		const query: mobileprovision.provision.Query = {
			Certificates: certificates.valid,
			Unique: true,
			AppId: projectId
		};

		let devices: string[] = [];
		if (this.$options.device) {
			devices = [this.$options.device];
		} else {
			await this.$devicesService.initialize({
				platform: "ios"
			});
			devices = _(this.$devicesService.getDeviceInstances())
				.filter(d => this.$mobileHelper.isiOSPlatform(d.deviceInfo.platform))
				.map(d => d.deviceInfo.identifier)
				.toJSON();
		}

		const match = mobileprovision.provision.select(provisions, query);

		return { devices, match };
	}
}

$injector.register("iOSProvisionService", IOSProvisionService);
