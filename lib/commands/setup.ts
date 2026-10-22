import { IDoctorService } from "../common/declarations";
import { defineCommand } from "../common/define-command";
import { inject } from "../common/di";

export const setupCommandDefinition = defineCommand({
	name: "setup|*",
	description:
		"Run the setup script to try to automatically configure your environment.",
	params: "none",
	run(): Promise<any> {
		return inject<IDoctorService>("doctorService").runSetupScript();
	},
});
