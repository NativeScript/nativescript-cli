export class Constants {
	public static ANDROID_PLATFORM_NAME = "Android";
	public static IOS_PLATFORM_NAME = "iOS";
	public static SUPPORTED_PLATFORMS = [Constants.ANDROID_PLATFORM_NAME, Constants.IOS_PLATFORM_NAME];
	public static SYSTEM_REQUIREMENTS_LINKS: IDictionary<string> = {
		"win32": "http://docs.nativescript.org/setup/ns-cli-setup/ns-setup-win.html#system-requirements",
		"linux": "http://docs.nativescript.org/setup/ns-cli-setup/ns-setup-linux.html#system-requirements",
		"darwin": "http://docs.nativescript.org/setup/ns-cli-setup/ns-setup-os-x.html#system-requirements",
	};
	public static INFO_TYPE_NAME = "info";
	public static WARNING_TYPE_NAME = "warning";

	public static PACKAGE_JSON = "package.json";
	public static NATIVESCRIPT_KEY = "nativescript";
	public static ANDROID_RUNTIME = "tns-android";
	public static VERSION_PROPERTY_NAME = "version";
	public static XCODE_MIN_REQUIRED_VERSION = 10;
	public static JAVAC_EXECUTABLE_NAME = "javac";
	public static JAVA_EXECUTABLE_NAME = "java";
}
