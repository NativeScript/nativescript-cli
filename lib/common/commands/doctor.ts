import { IDoctorService, IProjectHelper } from "../declarations";
import { defineCommand } from "../define-command";
import { inject, InjectionToken } from "../di";
import { registerCommand } from "../services/command-definition-adapter";
import { getInjector } from "../yok";
import { PlatformTypes } from "../../constants";

/** Which platform this registration checks; absent for the whole environment. */
const DOCTOR_PLATFORM = new InjectionToken<PlatformTypes>(
	"doctorCommandPlatform",
);

export interface IDoctorCommandServices {
	platform: PlatformTypes;
	$doctorService: IDoctorService;
	$projectHelper: IProjectHelper;
}

export function setupDoctorCommand(): IDoctorCommandServices {
	return {
		platform: inject(DOCTOR_PLATFORM, { optional: true }),
		$doctorService: inject<IDoctorService>("doctorService"),
		$projectHelper: inject<IProjectHelper>("projectHelper"),
	};
}

export const doctorCommandDefinition = defineCommand({
	name: "doctor|*all",
	description:
		"Checks the local environment for configuration issues, and prints what it finds.",
	arguments: "none",
	setup: setupDoctorCommand,
	run(context, services): Promise<void> {
		return services.$doctorService.printWarnings({
			trackResult: false,
			projectDir: services.$projectHelper.projectDir,
			forceCheck: true,
			...(services.platform ? { platform: services.platform } : {}),
		});
	},
});

const doctorPlatforms: [string, PlatformTypes][] = [
	["doctor|ios", PlatformTypes.ios],
	["doctor|android", PlatformTypes.android],
];

registerCommand(doctorCommandDefinition);

for (const [name, platform] of doctorPlatforms) {
	registerCommand(
		{ ...doctorCommandDefinition, name },
		getInjector().createChild([
			{ provide: DOCTOR_PLATFORM, useValue: platform },
		]),
	);
}
