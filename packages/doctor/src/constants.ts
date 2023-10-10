export class Constants {
	public static ANDROID_PLATFORM_NAME = "Android";
	public static IOS_PLATFORM_NAME = "iOS";
	public static SUPPORTED_PLATFORMS = [
		Constants.ANDROID_PLATFORM_NAME,
		Constants.IOS_PLATFORM_NAME,
	];
	public static SYSTEM_REQUIREMENTS_LINKS =
		"https://docs.nativescript.org/setup";
	public static INFO_TYPE_NAME = "info";
	public static WARNING_TYPE_NAME = "warning";

	public static PACKAGE_JSON = "package.json";
	public static NATIVESCRIPT_KEY = "nativescript";
	public static ANDROID_OLD_RUNTIME = "tns-android";
	public static ANDROID_SCOPED_RUNTIME = "@nativescript/android";
	public static VERSION_PROPERTY_NAME = "version";
	public static XCODE_MIN_REQUIRED_VERSION = 10;
	public static JAVAC_EXECUTABLE_NAME = "javac";
	public static JAVA_EXECUTABLE_NAME = "java";
}
