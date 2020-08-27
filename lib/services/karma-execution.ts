import * as path from "path";

process.on("message", (data: any) => {
	if (data.karmaConfig) {
		const pathToKarma = path.join(
				data.karmaConfig.projectDir,
				"node_modules/karma"
			),
			KarmaServer = require(path.join(pathToKarma, "lib/server")),
			karma = new KarmaServer(data.karmaConfig, (exitCode: number) => {
				//Exit with the correct exit code and signal the manager process.
				process.exit(exitCode);
			});

		karma.start();
	}
});
