import { IDoctorService, IProjectHelper } from "../declarations";
import { CommandName, defineCommand } from "../define-command";
import { inject } from "../di";
import { PlatformTypes } from "../../constants";

export function setupDoctorCommand(platform?: PlatformTypes) {
	return {
		platform,
		$doctorService: inject<IDoctorService>("doctorService"),
		$projectHelper: inject<IProjectHelper>("projectHelper"),
	};
}

export type IDoctorCommandServices = ReturnType<typeof setupDoctorCommand>;

const defineDoctorCommand = <const TName extends CommandName>(
	name: TName,
	platform?: PlatformTypes,
) =>
	defineCommand({
		name,
		description:
			"Checks the local environment for configuration issues, and prints what it finds.",
		arguments: "none",
		setup: () => setupDoctorCommand(platform),
		run(context, services): Promise<void> {
			return services.$doctorService.printWarnings({
				trackResult: false,
				projectDir: services.$projectHelper.projectDir,
				forceCheck: true,
				...(services.platform ? { platform: services.platform } : {}),
			});
		},
	});

export const doctorCommandDefinition = defineDoctorCommand("doctor|*all");

export const iosDoctorCommand = defineDoctorCommand(
	"doctor|ios",
	PlatformTypes.ios,
);

export const androidDoctorCommand = defineDoctorCommand(
	"doctor|android",
	PlatformTypes.android,
);
