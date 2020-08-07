export class LoggingLevels implements Mobile.ILoggingLevels {
	public info = "INFO";
	public full = "FULL";
}
$injector.register("loggingLevels", LoggingLevels);
