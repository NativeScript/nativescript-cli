import { IDoctorService, IProjectHelper } from "../declarations";
import { CommandName, defineCommand } from "../define-command";
import { inject } from "../di";
import { PlatformTypes } from "../../constants";

const defineDoctorCommand = <const TName extends CommandName>(
	name: TName,
	platform?: PlatformTypes,
) =>
	defineCommand({
		name,
		description:
			"Checks the local environment for configuration issues, and prints what it finds.",
		arguments: "none",
		run(): Promise<void> {
			const $doctorService = inject<IDoctorService>("doctorService");
			const $projectHelper = inject<IProjectHelper>("projectHelper");

			return $doctorService.printWarnings({
				trackResult: false,
				projectDir: $projectHelper.projectDir,
				forceCheck: true,
				...(platform ? { platform } : {}),
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
