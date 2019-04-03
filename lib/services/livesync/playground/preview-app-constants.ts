export class PreviewSdkEventNames {
	public static CHANGE_EVENT_NAME = "change";
	public static UNLINK_EVENT_NAME = "unlink";
}

export class PubnubKeys {
	public static PUBLISH_KEY = "pub-c-d7893276-cc78-4d18-8ab0-becba06e43de";
	public static SUBSCRIBE_KEY = "sub-c-3dad1ebe-aaa3-11e8-8027-363023237e0b";
}

export class PluginComparisonMessages {
	public static PLUGIN_NOT_INCLUDED_IN_PREVIEW_APP = "Plugin %s is not included in preview app on device %s and will not work.";
	public static LOCAL_PLUGIN_WITH_DIFFERENCE_IN_MAJOR_VERSION = "Local plugin %s differs in major version from plugin in preview app. The local plugin has version %s and the plugin in preview app has version %s. Some features might not work as expected.";
	public static LOCAL_PLUGIN_WITH_GREATHER_MINOR_VERSION = "Local plugin %s differs in minor version from plugin in preview app. The local plugin has version %s and the plugin in preview app has version %s. Some features might not work as expected.";
}

export class PreviewAppLiveSyncEvents {
	public static PREVIEW_APP_LIVE_SYNC_ERROR = "previewAppLiveSyncError";
}
