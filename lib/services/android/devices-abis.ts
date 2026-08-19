import * as _ from "lodash";

/**
 * The ABIs of the devices a build is about to be deployed to - the first (most
 * preferred) ABI of every device, deduplicated. `device`/`emulator` narrow the
 * set down the same way they narrow the run itself.
 */
export function getDevicesAbis(
	$devicesService: Mobile.IDevicesService,
	platform: string,
	filter: { device?: string; emulator?: boolean } = {}
): string[] {
	let devices = $devicesService.getDevicesForPlatform(platform);
	if (filter.device) {
		devices = devices.filter((d) => d.deviceInfo.identifier === filter.device);
	} else if (filter.emulator) {
		devices = devices.filter((d) => d.isEmulator);
	}

	return _.uniq(
		devices.map((d) => (d.deviceInfo.abis || [])[0]).filter((abi) => !!abi)
	);
}
