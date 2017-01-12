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
		private $projectData: IProjectData,
		private $mobileHelper: Mobile.IMobileHelper) {
	}

	public pick(uuidOrName: string): IFuture<mobileprovision.provision.MobileProvision> {
		return (() => {
			const match = this.queryProvisioningProfilesAndDevices().wait().match;

			return match.eligable.find(prov => prov.UUID === uuidOrName)
				|| match.eligable.find(prov => prov.Name === uuidOrName)
				|| match.nonEligable.find(prov => prov.UUID === uuidOrName)
				|| match.nonEligable.find(prov => prov.Name === uuidOrName);
		}).future<mobileprovision.provision.MobileProvision>()();
	}

	public list(): IFuture<void> {
		return (() => {
			const data = this.queryProvisioningProfilesAndDevices().wait(),
				devices = data.devices,
				match = data.match;

			function formatSupportedDeviceCount(prov: mobileprovision.provision.MobileProvision) {
				if (devices.length > 0 && prov.Type === "Development") {
					return prov.ProvisionedDevices.reduce((count, device) => count + (devices.indexOf(device) >= 0 ? 1 : 0), 0) + "/" + devices.length + " targets";
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

		}).future<void>()();
	}

	private queryProvisioningProfilesAndDevices(): IFuture<{ devices: string[], match: mobileprovision.provision.Result }> {
		return (() => {
			const certificates = mobileprovision.cert.read();
			const provisions = mobileprovision.provision.read();

			const query: mobileprovision.provision.Query = {
				Certificates: certificates.valid,
				Unique: true,
				AppId: this.$projectData.projectId
			};

			let devices: string[] = [];
			if (this.$options.device) {
				devices = [this.$options.device];
			} else {
				this.$devicesService.initialize({
					platform: "ios"
				}).wait();
				devices = _(this.$devicesService.getDeviceInstances())
					.filter(d => this.$mobileHelper.isiOSPlatform(d.deviceInfo.platform))
					.map(d => d.deviceInfo.identifier)
					.toJSON();
			}

			const match = mobileprovision.provision.select(provisions, query);

			return { devices, match };
		}).future<{ devices: string[], match: mobileprovision.provision.Result }>()();
	}
}
$injector.register("iOSProvisionService", IOSProvisionService);
