require("./appbuilder-bootstrap");
$injector.require("messages", "./messages/messages");

import { OptionsBase } from "../options";
$injector.require("staticConfig", "./appbuilder/proton-static-config");
$injector.register("config", {});
// Proton will track the features and exceptions, so no need of analyticsService here.
$injector.register("analyiticsService", {});
$injector.register("options", $injector.resolve(OptionsBase, { options: {}, defaultProfileDir: "" }));
$injector.requirePublicClass("deviceEmitter", "./appbuilder/device-emitter");
$injector.requirePublicClass("deviceLogProvider", "./appbuilder/device-log-provider");
import { installUncaughtExceptionListener } from "../errors";
installUncaughtExceptionListener();

$injector.register("emulatorSettingsService", {
	canStart(platform: string): boolean {
		return true;
	},
	minVersion(): number {
		return 10;
	}
});

$injector.require("logger", "./logger");
// When debugging uncomment the lines below
// $injector.resolve("logger").setLevel("TRACE");

// Mock as it is used in LiveSync logic to deploy on devices.
// When called from Proton we'll not deploy on device, just livesync.
$injector.register("deployHelper", {
	deploy: (platform?: string) => Promise.resolve()
});

$injector.require("liveSyncProvider", "./appbuilder/providers/livesync-provider");
$injector.requirePublic("liveSyncService", "./appbuilder/services/livesync/livesync-service");
$injector.require("project", "./appbuilder/project/project");
