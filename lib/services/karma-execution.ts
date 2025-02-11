import * as path from "path";
import { resolvePackagePath } from "../helpers/package-path-helper";

process.on("message", (data: any) => {
	if (data.karmaConfig) {
		const pathToKarma = resolvePackagePath("karma", {
			paths: [data.karmaConfig.projectDir]
		});

		const KarmaServer = require(path.join(pathToKarma, "lib/server"));
		const karma = new KarmaServer(data.karmaConfig, (exitCode: number) => {
			// Exit with the correct exit code and signal the manager process.
			process.exit(exitCode);
		});

		karma.start();
	}
});
