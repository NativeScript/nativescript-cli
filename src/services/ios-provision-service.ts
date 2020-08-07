import * as mobileprovision from "ios-mobileprovision-finder";
import { createTable, quoteString } from "../common/helpers";
import { IOptions } from "../declarations";
import * as _ from "lodash";

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
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

	public async listProvisions(projectId: string): Promise<void> {
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
			table.push([quoteString(prov.Name), prov.TeamName, prov.Type, formatTotalDeviceCount(prov)]);
			table.push([prov.UUID, prov.TeamIdentifier && prov.TeamIdentifier.length > 0 ? "(" + prov.TeamIdentifier[0] + ")" : "", formatDate(prov.ExpirationDate), formatSupportedDeviceCount(prov)]);
			table.push([prov.Entitlements["application-identifier"], "", "", ""]);
		}
		match.eligable.forEach(prov => pushProvision(prov));

		this.$logger.info(table.toString());
		this.$logger.info();
		this.$logger.info("There are also " + match.nonEligable.length + " non-eligable provisioning profiles.");
		this.$logger.info();
	}

	public async listTeams(): Promise<void> {
		const teams = await this.getDevelopmentTeams();
		const table = createTable(["Team Name", "Team ID"], teams.map(team => [quoteString(team.name), team.id]));
		this.$logger.info(table.toString());
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
				platform: "ios",
				skipEmulatorStart: true
			});
			devices = _(this.$devicesService.getDeviceInstances())
				.filter(d => this.$mobileHelper.isiOSPlatform(d.deviceInfo.platform))
				.map(d => d.deviceInfo.identifier)
				.toJSON();
		}

		const match = mobileprovision.provision.select(provisions, query);

		return { devices, match };
	}

	public async getDevelopmentTeams(): Promise<{ id: string, name: string }[]> {
		const teams: { [teamName: string]: Set<string> } = {};
		// NOTE: We are reading all provisioning profiles and collect team information from them.
		// It would be better if we can check the Apple ID registered in Xcode and read the teams associated with it.
		mobileprovision.provision.read().forEach(provision =>
			provision.TeamIdentifier && provision.TeamIdentifier.forEach(id => {
				if (!teams[provision.TeamName]) {
					teams[provision.TeamName] = new Set();
				}
				teams[provision.TeamName].add(id);
			})
		);
		const teamsArray = Object.keys(teams).reduce((arr, name) => {
			teams[name].forEach(id => arr.push({ id, name }));
			return arr;
		}, []);
		return teamsArray;
	}

	public async getTeamIdsWithName(teamName: string): Promise<string[]> {
		const allTeams = await this.getDevelopmentTeams();
		const matchingTeamIds = allTeams.filter(team => team.name === teamName).map(team => team.id);
		return matchingTeamIds;
	}
}

$injector.register("iOSProvisionService", IOSProvisionService);
