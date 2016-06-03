import * as path from "path";

process.on("message", (data: any) => {
	if(data.karmaConfig) {
		let pathToKarma = path.join(data.karmaConfig.projectDir, 'node_modules/karma'),
			KarmaServer = require(path.join(pathToKarma, 'lib/server')),
			karma = new KarmaServer(data.karmaConfig);

		karma.start();
	}
});
