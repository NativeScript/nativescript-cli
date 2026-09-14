import { IDoctorService } from "../common/declarations";
import { defineCommand } from "../common/define-command";
import { inject } from "../common/di";
import { registerCommand } from "../common/services/command-definition-adapter";

export const setupCommandDefinition = defineCommand({
	name: "setup|*",
	description:
		"Run the setup script to try to automatically configure your environment.",
	arguments: "none",
	setup: () => ({
		$doctorService: inject<IDoctorService>("doctorService"),
	}),
	run(context, services): Promise<any> {
		return services.$doctorService.runSetupScript();
	},
});

registerCommand(setupCommandDefinition);
