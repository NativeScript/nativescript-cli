import { AndroidLogFilter } from "../../mobile/android/android-log-filter";
import { LoggingLevels } from "../../mobile/logging-levels";
import { Yok } from "../../yok";
import * as assert from "assert";
import { EOL } from "os";

const androidApiLevel23TestData = [
	{ input: '12-28 10:14:15.977    99    99 D Genymotion: Received Set Clipboard', output: null },
	{ input: '12-28 10:14:31.303   779   790 I ActivityManager: START u0 {act=android.intent.action.MAIN cat=[android.intent.category.LAUNCHER] flg=0x10200000 cmp=com.telerik.app1/.TelerikCallbackActivity (has extras)} from uid 10008 on display 0', output: 'ActivityManager: START u0 {act=android.intent.action.MAIN cat=[android.intent.category.LAUNCHER] flg=0x10200000 cmp=com.telerik.app1/.TelerikCallbackActivity (has extras)} from uid 10008 on display 0' },
	{ input: '--------- beginning of main', output: null },
	{ input: '12-28 10:14:31.314  3593  3593 I art     : Late-enabling -Xcheck:jni', output: null },
	{ input: '12-28 10:14:31.348  3593  3593 W System  : ClassLoader referenced unknown path: /data/app/com.telerik.app1-1/lib/x86', output: null },
	{ input: '12-28 10:14:31.450  3593  3593 V WebViewChromiumFactoryProvider: Binding Chromium to main looper Looper (main, tid 1) {bfa9d51}', output: null },
	{
		input: '12-28 10:14:31.450  3593  3593 I chromium: [INFO:library_loader_hooks.cc(108)] Chromium logging enabled: level = 0, default verbosity = 0',
		output: 'chromium: [INFO:library_loader_hooks.cc(108)] Chromium logging enabled: level = 0, default verbosity = 0'
	},
	{
		input: '12-28 10:14:31.460  3593  3593 I BrowserStartupController: Initializing chromium process, singleProcess=true',
		output: '12-28 10:14:31.460  3593  3593 I BrowserStartupController: Initializing chromium process, singleProcess=true'
	},
	{ input: '12-28 10:14:31.486  3593  3613 W AudioManagerAndroid: Requires BLUETOOTH permission', output: null },
	{ input: '12-28 10:14:31.544  3593  3593 D libEGL  : loaded /system/lib/egl/libEGL_emulation.so', output: null },
	{ input: '12-28 10:14:31.555  3593  3593 D         : HostConnection::get() New Host Connection established 0xe99b30f0, tid 3593', output: null },
	{ input: '12-28 10:14:31.631  3593  3593 D CordovaWebView: CordovaWebView is running on device made by: Genymotion', output: null },
	{
		input: '12-28 10:16:26.239  3659  3659 I chromium: [INFO:CONSOLE(1)] "Uncaught ReferenceError: start is not defined", source: file:///data/user/0/com.telerik.app1/files/12590FAA-5EDD-4B12-856D-F52A0A1599F2/index.html (1)',
		output: 'chromium: [INFO:CONSOLE(1)] "Uncaught ReferenceError: start is not defined", source: file:///data/user/0/com.telerik.app1/files/12590FAA-5EDD-4B12-856D-F52A0A1599F2/index.html (1)'
	},
	{ input: '12-28 10:16:49.267   779  1172 I ActivityManager: Start proc 3714:org.nativescript.appDebug1/u0a60 for activity org.nativescript.appDebug1/com.tns.NativeScriptActivity', output: 'ActivityManager: Start proc 3714:org.nativescript.appDebug1/u0a60 for activity org.nativescript.appDebug1/com.tns.NativeScriptActivity' },
	{ input: '12-28 10:16:49.316  3714  3714 I TNS.Native: NativeScript Runtime Version 1.5.1, commit c27e977f059e37b3f8230722a4687e16acf43a7f', output: null },
	{ input: '12-28 10:16:49.710  3714  3714 V JS      : TAPPED: 42', output: 'JS: TAPPED: 42' },
	{ input: '12-28 10:16:49.775  3714  3714 D NativeScriptActivity: NativeScriptActivity.onCreate called', output: null },
	{
		input: '12-28 10:16:49.795  3714  3714 I Web Console: Received Event: deviceready at file:///storage/emulated/0/Icenium/com.telerik.TestApp/js/index.js:48',
		output: 'Web Console: Received Event: deviceready at file:///storage/emulated/0/Icenium/com.telerik.TestApp/js/index.js:48'
	}
];

const androidApiLevel22TestData = [
	{ input: '--------- beginning of system', output: null },
	{ input: 'D/Genymotion(   82): Received Ping', output: null },
	{ input: '--------- beginning of main', output: null },
	{ input: 'W/AudioTrack( 1804): AUDIO_OUTPUT_FLAG_FAST denied by client', output: null },
	{ input: 'I/ActivityManager( 1804): START u0 {act=android.intent.action.MAIN cat=[android.intent.category.LAUNCHER] flg=0x10200000 cmp=com.telerik.hybridApp/.TelerikCallbackActivity (has extras)} from uid 10039 on display 0', output: 'ActivityManager: START u0 {act=android.intent.action.MAIN cat=[android.intent.category.LAUNCHER] flg=0x10200000 cmp=com.telerik.hybridApp/.TelerikCallbackActivity (has extras)} from uid 10039 on display 0' },
	{ input: 'I/ActivityManager( 1804): Start proc 2971:com.telerik.hybridApp/u0a60 for activity com.telerik.hybridApp/.TelerikCallbackActivity', output: 'ActivityManager: Start proc 2971:com.telerik.hybridApp/u0a60 for activity com.telerik.hybridApp/.TelerikCallbackActivity' },
	{ input: 'I/art     ( 2971): Late-enabling -Xcheck:jni', output: null },
	{ input: 'D/        ( 1789): HostConnection::get() New Host Connection established 0xb68c9390, tid 2626', output: null },
	{ input: 'I/CordovaLog( 2971): Changing log level to DEBUG(3)', output: null },
	{ input: 'D/CordovaActivity( 2971): CordovaActivity.init()', output: null },
	{ input: 'I/WebViewFactory( 2971): Loading com.android.webview version 39 (eng.buildbot-x86) (code 399997)', output: null },
	{ input: 'I/LibraryLoader( 2971): Time to load native libraries: 24 ms (timestamps 2169-2193)', output: null },
	{ input: 'I/LibraryLoader( 2971): Expected native library version number "",actual native library version number ""', output: null },
	{ input: 'V/WebViewChromiumFactoryProvider( 2971): Binding Chromium to main looper Looper (main, tid 1) {18cd5cc2}', output: null },
	{ input: 'I/LibraryLoader( 2971): Expected native library version number "",actual native library version number ""', output: null },
	{
		input: 'I/chromium( 2971): [INFO:library_loader_hooks.cc(104)] Chromium logging enabled: level = 0, default verbosity = 0',
		output: 'chromium: [INFO:library_loader_hooks.cc(104)] Chromium logging enabled: level = 0, default verbosity = 0'
	},
	{
		input: 'I/BrowserStartupController( 2971): Initializing chromium process, singleProcess=true',
		output: 'I/BrowserStartupController( 2971): Initializing chromium process, singleProcess=true'
	},
	{ input: 'W/art     ( 2971): Attempt to remove local handle scope entry from IRT, ignoring', output: null },
	{ input: 'W/AudioManagerAndroid( 2971): Requires BLUETOOTH permission', output: null },
	{
		input: 'W/chromium( 2971): [WARNING:resource_bundle.cc(304)] locale_file_path.empty()',
		output: 'chromium: [WARNING:resource_bundle.cc(304)] locale_file_path.empty()'
	},
	{
		input: 'I/chromium( 2971): [INFO:aw_browser_main_parts.cc(65)] Load from apk succesful, fd=30 off=46184 len=3037',
		output: 'chromium: [INFO:aw_browser_main_parts.cc(65)] Load from apk succesful, fd=30 off=46184 len=3037'
	},
	{
		input: 'I/chromium( 2971): [INFO:aw_browser_main_parts.cc(78)] Loading webviewchromium.pak from, fd:31 off:229484 len:1089587',
		output: 'chromium: [INFO:aw_browser_main_parts.cc(78)] Loading webviewchromium.pak from, fd:31 off:229484 len:1089587'
	},
	{ input: 'D/CordovaWebView( 2971): CordovaWebView is running on device made by: Genymotion', output: null },
	{ input: 'D/CordovaWebViewClient( 2971): onPageStarted(file:///android_asset/www/index.html)', output: null },
	{ input: 'D/CordovaActivity( 2971): onMessage(onPageStarted,file:///android_asset/www/index.html)', output: null },
	{ input: 'D/CordovaWebView( 2971): >>> loadUrl(file:///data/data/com.telerik.hybridApp/files/12590FAA-5EDD-4B12-856D-F52A0A1599F2/index.html)', output: null },
	{
		input: 'I/chromium( 2971): [INFO:CONSOLE(1)] "Uncaught ReferenceError: start is not defined", source: file:///data/data/com.telerik.hybridApp/files/12590FAA-5EDD-4B12-856D-F52A0A1599F2/index.html (1)',
		output: 'chromium: [INFO:CONSOLE(1)] "Uncaught ReferenceError: start is not defined", source: file:///data/data/com.telerik.hybridApp/files/12590FAA-5EDD-4B12-856D-F52A0A1599F2/index.html (1)'
	},
	{ input: 'D/CordovaWebView( 2971): The current URL is: file:///data/data/com.telerik.hybridApp/files/12590FAA-5EDD-4B12-856D-F52A0A1599F2/index.html', output: null },
	{ input: 'E/EGL_emulation( 1789): tid 1789: eglCreateSyncKHR(1209): error 0x3004 (EGL_BAD_ATTRIBUTE)', output: null },
	{ input: 'V/JS      ( 3930): TAPPED: 42', output: 'JS: TAPPED: 42' },
	{
		input: 'I/Web Console(    4438): Received Event: deviceready at file:///storage/emulated/0/Icenium/com.telerik.TestApp/js/index.js:48',
		output: 'Web Console: Received Event: deviceready at file:///storage/emulated/0/Icenium/com.telerik.TestApp/js/index.js:48'
	}
];

const androidApiLevel23MapForPid8141 = [
	{ input: "--------- beginning of main", output: null },
	{ input: "07-25 06:36:22.590  8141  8141 D TNS.Native: lenNodes=71568, lenNames=824195, lenValues=963214", output: null },
	{ input: "07-25 06:36:22.590  8141  8141 D TNS.Native: time=1", output: null },
	{ input: "07-25 06:36:23.065   739   760 I Choreographer: Skipped 54 frames!  The application may be doing too much work on its main thread.", output: null },
	{ input: "07-25 06:36:23.149  8141  8141 W art     : Before Android 4.1, method android.graphics.PorterDuffColorFilter android.support.graphics.drawable.VectorDrawableCompat.updateTintFilter(android.graphics.PorterDuffColorFilter, android.content.res.ColorStateList, android.graphics.PorterDuff$Mode) would have incorrectly overridden the package-private method in android.graphics.drawable.Drawable", output: null },
	{ input: "07-25 06:36:23.298  8141  8141 D         : HostConnection::get() New Host Connection established 0xd3916970, tid 8141", output: null },
	{ input: "07-25 06:36:23.364  8141  8173 D libEGL  : Emulator has host GPU support, qemu.gles is set to 1.", output: null },
	{ input: "07-25 06:36:23.365  8141  8173 E libEGL  : load_driver(/system/lib/egl/libGLES_emulation.so): dlopen failed: library \"/system/lib/egl/libGLES_emulation.so\" not found", output: null },
	{ input: "07-25 06:36:23.376  8141  8173 D libEGL  : loaded /system/lib/egl/libEGL_emulation.so", output: null },
	{ input: "07-25 06:36:23.386  8141  8173 D libEGL  : loaded /system/lib/egl/libGLESv1_CM_emulation.so", output: null },
	{ input: "07-25 06:36:23.397  8141  8173 D libEGL  : loaded /system/lib/egl/libGLESv2_emulation.so", output: null },
	{ input: "07-25 06:36:23.422  8141  8173 D         : HostConnection::get() New Host Connection established 0xf17879f0, tid 8173", output: null },
	{ input: "07-25 06:36:23.463  8141  8173 I OpenGLRenderer: Initialized EGL, version 1.4", output: null },
	{ input: "07-25 06:36:23.464  8141  8173 D OpenGLRenderer: Swap behavior 1", output: null },
	{ input: "07-25 06:36:23.862   739   760 I ActivityManager: Displayed org.nativescript.personalalarm/com.tns.NativeScriptActivity: +1s830ms", output: null },
	{ input: "--------- beginning of system", output: null },
	{ input: "07-25 06:36:23.913   739   963 I WindowManager: Destroying surface Surface(name=com.android.launcher3/com.android.launcher3.Launcher) called by com.android.server.wm.WindowStateAnimator.destroySurface:2014 com.android.server.wm.WindowStateAnimator.destroySurfaceLocked:881 com.android.server.wm.WindowState.destroyOrSaveSurface:2073 com.android.server.wm.AppWindowToken.destroySurfaces:363 com.android.server.wm.AppWindowToken.notifyAppStopped:389 com.android.server.wm.WindowManagerService.notifyAppStopped:4456 ", output: null },
	{ input: "07-25 06:36:27.877  8141  8141 V JS      : Set up an alarm for: 1500978987875", output: "JS: Set up an alarm for: 1500978987875" },
	{ input: "07-25 06:36:30.830   739   775 I ActivityManager: START u0 {act=android.intent.action.MAIN cat=[android.intent.category.HOME] flg=0x10200000 cmp=com.android.launcher3/.Launcher (has extras)} from uid 1000 on display 0", output: null },
	{ input: "07-25 06:36:30.882   493   493 E EGL_emulation: tid 493: eglCreateSyncKHR(1285): error 0x3004 (EGL_BAD_ATTRIBUTE)", output: null },
	{ input: "07-25 06:36:31.095   739   751 W art     : Long monitor contention with owner InputDispatcher (775) at int com.android.server.am.ActivityStarter.startActivityMayWait(android.app.IApplicationThread, int, java.lang.String, android.content.Intent, java.lang.String, android.service.voice.IVoiceInteractionSession, com.android.internal.app.IVoiceInteractor, android.os.IBinder, java.lang.String, int, int, android.app.ProfilerInfo, android.app.IActivityManager$WaitResult, android.content.res.Configuration, android.os.Bundle, boolean, int, android.app.IActivityContainer, com.android.server.am.TaskRecord)(ActivityStarter.java:725) waiters=2 in android.app.ActivityOptions com.android.server.am.ActivityManagerService.getActivityOptions(android.os.IBinder) for 258ms", output: null },
	{ input: "07-25 06:36:31.103  1181  1333 I OpenGLRenderer: Initialized EGL, version 1.4", output: null },
	{ input: "07-25 06:36:31.103  1181  1333 D OpenGLRenderer: Swap behavior 1", output: null },
	{ input: "07-25 06:36:31.896  1181  1333 W OpenGLRenderer: Incorrectly called buildLayer on View: ShortcutAndWidgetContainer, destroying layer...", output: null },
	{ input: "07-25 06:36:38.320   739  1092 I ActivityManager: START u0 {act=android.intent.action.MAIN cat=[android.intent.category.LAUNCHER] flg=0x10200000 cmp=org.nativescript.a2test/com.tns.NativeScriptActivity (has extras)} from uid 10014 on display 0", output: null },
	{ input: "07-25 06:36:38.327  8183  8183 I art     : Late-enabling -Xcheck:jni", output: null },
	{ input: "07-25 06:36:38.327  8183  8183 W art     : Unexpected CPU variant for X86 using defaults: x86", output: null },
	{ input: "07-25 06:36:38.335   739  1212 I ActivityManager: Start proc 8183:org.nativescript.a2test/u0a122 for activity org.nativescript.a2test/com.tns.NativeScriptActivity", output: null },
	{ input: "07-25 06:36:38.406  8183  8183 I TNS.Native: NativeScript Runtime Version 3.0.1, commit 733bfa5fab5d4c156eab156eaf01946eb36dab1e", output: null },
	{ input: "07-25 06:36:38.406  8183  8183 D TNS.Native: JNI_ONLoad", output: null },
	{ input: "07-25 06:36:38.406  8183  8183 D TNS.Native: JNI_ONLoad END", output: null },
	{ input: "07-25 06:36:38.424  8183  8183 D TNS.Native: Failed to load snapshot: dlopen failed: library \"libsnapshot.so\" not found", output: null },
	{ input: "07-25 06:36:38.534  8183  8183 D TNS.Native: V8 version 5.5.372.32", output: null },
	{ input: "07-25 06:36:38.675  8183  8183 D TNS.Native: lenNodes=66492, lenNames=775380, lenValues=899324", output: null },
	{ input: "07-25 06:36:38.675  8183  8183 D TNS.Native: time=24", output: null },
	{ input: "07-25 06:36:39.376   739   760 I Choreographer: Skipped 55 frames!  The application may be doing too much work on its main thread.", output: null },
	{ input: "07-25 06:36:39.638  8183  8183 W art     : Before Android 4.1, method android.graphics.PorterDuffColorFilter android.support.graphics.drawable.VectorDrawableCompat.updateTintFilter(android.graphics.PorterDuffColorFilter, android.content.res.ColorStateList, android.graphics.PorterDuff$Mode) would have incorrectly overridden the package-private method in android.graphics.drawable.Drawable", output: null },
	{ input: "07-25 06:36:39.701  8183  8183 D         : HostConnection::get() New Host Connection established 0xd39aad30, tid 8183", output: null },
	{ input: "07-25 06:36:39.807  8183  8207 D libEGL  : Emulator has host GPU support, qemu.gles is set to 1.", output: null },
	{ input: "07-25 06:36:39.807  8183  8207 E libEGL  : load_driver(/system/lib/egl/libGLES_emulation.so): dlopen failed: library \"/system/lib/egl/libGLES_emulation.so\" not found", output: null },
	{ input: "07-25 06:36:39.811  8183  8207 D libEGL  : loaded /system/lib/egl/libEGL_emulation.so", output: null },
	{ input: "07-25 06:36:39.914  8183  8207 I OpenGLRenderer: Initialized EGL, version 1.4", output: null },
	{ input: "07-25 06:36:39.914  8183  8207 D OpenGLRenderer: Swap behavior 1", output: null },
	{ input: "07-25 06:36:40.136   739   760 I ActivityManager: Displayed org.nativescript.a2test/com.tns.NativeScriptActivity: +1s812ms", output: null },
	{ input: "07-25 06:36:42.455   739   750 I ActivityManager: START u0 {flg=0x10804000 cmp=com.android.systemui/.recents.RecentsActivity} from uid 10023 on display 0", output: null },
	{ input: "07-25 06:36:42.505   493   493 E EGL_emulation: tid 493: eglCreateSyncKHR(1285): error 0x3004 (EGL_BAD_ATTRIBUTE)", output: null },
	{ input: "07-25 06:36:44.189   739  1213 E ActivityManager: applyOptionsLocked: Unknown animationType=0", output: null },
	{ input: "07-25 06:36:44.386  8141  8173 I OpenGLRenderer: Initialized EGL, version 1.4", output: null },
	{ input: "07-25 06:36:44.386  8141  8173 D OpenGLRenderer: Swap behavior 1", output: null },
	{ input: "07-25 06:36:44.978   739  1213 I WindowManager: Destroying surface Surface(name=com.android.systemui/com.android.systemui.recents.RecentsActivity) called by com.android.server.wm.WindowStateAnimator.destroySurface:2014 com.android.server.wm.WindowStateAnimator.destroySurfaceLocked:881 com.android.server.wm.WindowState.destroyOrSaveSurface:2073 com.android.server.wm.WindowManagerService.tryStartExitingAnimation:3017 com.android.server.wm.WindowManagerService.relayoutWindow:2897 com.android.server.wm.Session.relayout:215 android.view.IWindowSession$Stub.onTransact:286 com.android.server.wm.Session.onTransact:136 ", output: null },
	{ input: "07-25 06:36:54.367   137   137 D Genyd   : Received Set Clipboard", output: null },
	{ input: "07-25 06:36:54.367   137   137 D Genymotion: Received Set Clipboard", output: null },
	{ input: "07-25 06:36:59.432  8216  8216 D AndroidRuntime: >>>>>> START com.android.internal.os.RuntimeInit uid 0 <<<<<<", output: null },
	{ input: "07-25 06:36:59.434  8216  8216 D AndroidRuntime: CheckJNI is OFF", output: null },
	{ input: "07-25 06:36:59.447  8216  8216 W art     : Unexpected CPU variant for X86 using defaults: x86", output: null },
	{ input: "07-25 06:36:59.449  8216  8216 D ICU     : No timezone override file found: /data/misc/zoneinfo/current/icu/icu_tzdata.dat", output: null },
	{ input: "07-25 06:36:59.460  8216  8216 E memtrack: Couldn't load memtrack module (No such file or directory)", output: null },
	{ input: "07-25 06:36:59.461  8216  8216 E android.os.Debug: failed to load memtrack module: -2", output: null },
	{ input: "07-25 06:36:59.461  8216  8216 I Radio-JNI: register_android_hardware_Radio DONE", output: null },
	{ input: "07-25 06:36:59.465  8216  8216 D AndroidRuntime: Calling main entry com.android.commands.pm.Pm", output: null },
	{ input: "07-25 06:36:59.472  8216  8216 I art     : System.exit called, status: 0", output: null },
	{ input: "07-25 06:36:59.472  8216  8216 I AndroidRuntime: VM exiting with result code 0.", output: null },
	{ input: "07-25 06:37:00.051   739   753 I ProcessStatsService: Prepared write state in 1ms", output: null },
	{ input: "07-25 06:37:00.233  8141  8144 I art     : Do partial code cache collection, code=30KB, data=29KB", output: null },
	{ input: "07-25 06:37:00.237  8141  8144 I art     : After code cache collection, code=30KB, data=29KB", output: null },
	{ input: "07-25 06:37:00.237  8141  8144 I art     : Increasing code cache capacity to 128KB", output: null },
	{ input: "07-25 06:37:04.993  8141  8141 D AndroidRuntime: Shutting down VM", output: null },
	{ input: "07-25 06:37:04.995  8141  8141 W System.err: com.tns.NativeScriptException: ", output: "System.err: com.tns.NativeScriptException: " },
	{ input: "07-25 06:37:04.997  8141  8141 W System.err: Calling js method onClick failed", output: "System.err: Calling js method onClick failed" },
	{ input: "07-25 06:37:04.998  8141  8141 W System.err: ", output: "System.err: " },
	{ input: "07-25 06:37:04.998  8141  8141 W System.err: TypeError: Cannot read property 'stop' of undefined", output: "System.err: TypeError: Cannot read property 'stop' of undefined" },
	{ input: "07-25 06:37:04.998  8141  8141 W System.err: File: \"file:///data/data/org.nativescript.personalalarm/files/app/main-view-model.js, line: 23, column: 18", output: "System.err: File: \"file:///data/data/org.nativescript.personalalarm/files/app/main-view-model.js, line: 23, column: 18" },
	{ input: "07-25 06:37:04.998  8141  8141 W System.err: ", output: "System.err: " },
	{ input: "07-25 06:37:04.998  8141  8141 W System.err: StackTrace: ", output: "System.err: StackTrace: " },
	{ input: "07-25 06:37:04.998  8141  8141 W System.err: 	Frame: function:'viewModel.snooze', file:'file:///data/data/org.nativescript.personalalarm/files/app/main-view-model.js', line: 23, column: 19", output: "System.err: 	Frame: function:'viewModel.snooze', file:'file:///data/data/org.nativescript.personalalarm/files/app/main-view-model.js', line: 23, column: 19" },
	{ input: "07-25 06:37:04.998  8141  8141 W System.err: 	Frame: function:'Observable.notify', file:'file:///data/data/org.nativescript.personalalarm/files/app/tns_modules/tns-core-modules/data/observable/observable.js', line: 100, column: 32", output: "System.err: 	Frame: function:'Observable.notify', file:'file:///data/data/org.nativescript.personalalarm/files/app/tns_modules/tns-core-modules/data/observable/observable.js', line: 100, column: 32" },
	{ input: "07-25 06:37:04.998  8141  8141 W System.err: 	Frame: function:'Observable._emit', file:'file:///data/data/org.nativescript.personalalarm/files/app/tns_modules/tns-core-modules/data/observable/observable.js', line: 120, column: 18", output: "System.err: 	Frame: function:'Observable._emit', file:'file:///data/data/org.nativescript.personalalarm/files/app/tns_modules/tns-core-modules/data/observable/observable.js', line: 120, column: 18" },
	{ input: "07-25 06:37:04.998  8141  8141 W System.err: 	Frame: function:'ClickListenerImpl.onClick', file:'file:///data/data/org.nativescript.personalalarm/files/app/tns_modules/tns-core-modules/ui/button/button.js', line: 23, column: 24", output: "System.err: 	Frame: function:'ClickListenerImpl.onClick', file:'file:///data/data/org.nativescript.personalalarm/files/app/tns_modules/tns-core-modules/ui/button/button.js', line: 23, column: 24" },
	{ input: "07-25 06:37:04.998  8141  8141 W System.err: ", output: "System.err: " },
	{ input: "07-25 06:37:04.998  8141  8141 W System.err: 	at com.tns.Runtime.callJSMethodNative(Native Method)", output: "System.err: 	at com.tns.Runtime.callJSMethodNative(Native Method)" },
	{ input: "07-25 06:37:04.998  8141  8141 W System.err: 	at com.tns.Runtime.dispatchCallJSMethodNative(Runtime.java:1043)", output: "System.err: 	at com.tns.Runtime.dispatchCallJSMethodNative(Runtime.java:1043)" },
	{ input: "07-25 06:37:04.998  8141  8141 W System.err: 	at com.tns.Runtime.callJSMethodImpl(Runtime.java:925)", output: "System.err: 	at com.tns.Runtime.callJSMethodImpl(Runtime.java:925)" },
	{ input: "07-25 06:37:04.998  8141  8141 W System.err: 	at com.tns.Runtime.callJSMethod(Runtime.java:912)", output: "System.err: 	at com.tns.Runtime.callJSMethod(Runtime.java:912)" },
	{ input: "07-25 06:37:04.998  8141  8141 W System.err: 	at com.tns.Runtime.callJSMethod(Runtime.java:896)", output: "System.err: 	at com.tns.Runtime.callJSMethod(Runtime.java:896)" },
	{ input: "07-25 06:37:04.998  8141  8141 W System.err: 	at com.tns.Runtime.callJSMethod(Runtime.java:888)", output: "System.err: 	at com.tns.Runtime.callJSMethod(Runtime.java:888)" },
	{ input: "07-25 06:37:04.998  8141  8141 W System.err: 	at com.tns.gen.java.lang.Object_frnal_ts_helpers_l58_c38__ClickListenerImpl.onClick(Object_frnal_ts_helpers_l58_c38__ClickListenerImpl.java:12)", output: "System.err: 	at com.tns.gen.java.lang.Object_frnal_ts_helpers_l58_c38__ClickListenerImpl.onClick(Object_frnal_ts_helpers_l58_c38__ClickListenerImpl.java:12)" },
	{ input: "07-25 06:37:04.998  8141  8141 W System.err: 	at android.view.View.performClick(View.java:5609)", output: "System.err: 	at android.view.View.performClick(View.java:5609)" },
	{ input: "07-25 06:37:04.998  8141  8141 W System.err: 	at android.view.View$PerformClick.run(View.java:22259)", output: "System.err: 	at android.view.View$PerformClick.run(View.java:22259)" },
	{ input: "07-25 06:37:04.998  8141  8141 W System.err: 	at android.os.Handler.handleCallback(Handler.java:751)", output: "System.err: 	at android.os.Handler.handleCallback(Handler.java:751)" },
	{ input: "07-25 06:37:04.998  8141  8141 W System.err: 	at android.os.Handler.dispatchMessage(Handler.java:95)", output: "System.err: 	at android.os.Handler.dispatchMessage(Handler.java:95)" },
	{ input: "07-25 06:37:04.998  8141  8141 W System.err: 	at android.os.Looper.loop(Looper.java:154)", output: "System.err: 	at android.os.Looper.loop(Looper.java:154)" },
	{ input: "07-25 06:37:04.998  8141  8141 W System.err: 	at android.app.ActivityThread.main(ActivityThread.java:6077)", output: "System.err: 	at android.app.ActivityThread.main(ActivityThread.java:6077)" },
	{ input: "07-25 06:37:04.998  8141  8141 W System.err: 	at java.lang.reflect.Method.invoke(Native Method)", output: "System.err: 	at java.lang.reflect.Method.invoke(Native Method)" },
	{ input: "07-25 06:37:04.998  8141  8141 W System.err: 	at com.android.internal.os.ZygoteInit$MethodAndArgsCaller.run(ZygoteInit.java:865)", output: "System.err: 	at com.android.internal.os.ZygoteInit$MethodAndArgsCaller.run(ZygoteInit.java:865)" },
	{ input: "07-25 06:37:04.998  8141  8141 W System.err: 	at com.android.internal.os.ZygoteInit.main(ZygoteInit.java:755)", output: "System.err: 	at com.android.internal.os.ZygoteInit.main(ZygoteInit.java:755)" },
	{ input: "07-25 06:37:05.009   739  1087 I ActivityManager: START u0 {flg=0x14008000 cmp=org.nativescript.personalalarm/com.tns.ErrorReportActivity (has extras)} from uid 10064 on display 0", output: null },
	{ input: "07-25 06:37:05.022  8141  8141 I Process : Sending signal. PID: 8141 SIG: 9", output: null },
	{ input: "07-25 06:37:05.056   739   775 W InputDispatcher: channel '7f802e0 org.nativescript.personalalarm/com.tns.NativeScriptActivity (server)' ~ Consumer closed input channel or an error occurred.  events=0x9", output: null },
	{ input: "07-25 06:37:05.056   739   775 E InputDispatcher: channel '7f802e0 org.nativescript.personalalarm/com.tns.NativeScriptActivity (server)' ~ Channel is unrecoverably broken and will be disposed!", output: null },
	{ input: "07-25 06:37:05.058   739  1212 D GraphicsStats: Buffer count: 4", output: null },
	{ input: "07-25 06:37:05.060   739   751 I ActivityManager: Process org.nativescript.personalalarm (pid 8141) has died", output: "ActivityManager: Process org.nativescript.personalalarm (pid 8141) has died" },
	{ input: "07-25 06:37:05.063   739  1092 I WindowManager: WIN DEATH: Window{7f802e0 u0 org.nativescript.personalalarm/com.tns.NativeScriptActivity}", output: null },
	{ input: "07-25 06:37:05.063   739  1092 W InputDispatcher: Attempted to unregister already unregistered input channel '7f802e0 org.nativescript.personalalarm/com.tns.NativeScriptActivity (server)'", output: null },
	{ input: "07-25 06:37:05.064   739  1092 I WindowManager: Destroying surface Surface(name=org.nativescript.personalalarm/com.tns.NativeScriptActivity) called by com.android.server.wm.WindowStateAnimator.destroySurface:2014 com.android.server.wm.WindowStateAnimator.destroySurfaceLocked:881 com.android.server.wm.WindowState.removeLocked:1449 com.android.server.wm.WindowManagerService.removeWindowInnerLocked:2478 com.android.server.wm.WindowManagerService.removeWindowLocked:2436 com.android.server.wm.WindowState$DeathRecipient.binderDied:1780 android.os.BinderProxy.sendDeathNotice:688 <bottom of call stack> ", output: null },
	{ input: "07-25 06:37:05.084   739   751 I ActivityManager: Start proc 8244:org.nativescript.personalalarm/u0a64 for activity org.nativescript.personalalarm/com.tns.ErrorReportActivity", output: null },
	{ input: "07-25 06:37:05.084  8244  8244 I art     : Late-enabling -Xcheck:jni", output: null },
	{ input: "07-25 06:37:05.085  8244  8244 W art     : Unexpected CPU variant for X86 using defaults: x86", output: null },
	{ input: "07-25 06:37:05.212  8244  8244 I TNS.Native: NativeScript Runtime Version 3.1.1, commit 253c76f850b88b0119fda04e413626872f223de5", output: null },
	{ input: "07-25 06:37:05.213  8244  8244 D TNS.Native: JNI_ONLoad", output: null },
	{ input: "07-25 06:37:05.213  8244  8244 D TNS.Native: JNI_ONLoad END", output: null },
];

describe("androidLogFilter", () => {

	const assertFiltering = (inputData: string, expectedOutput: string, logLevel?: string, pid?: string) => {
		const testInjector = new Yok();
		testInjector.register("loggingLevels", LoggingLevels);
		const androidLogFilter = <Mobile.IPlatformLogFilter>testInjector.resolve(AndroidLogFilter);
		const filteredData = androidLogFilter.filterData(inputData, { logLevel, applicationPid: pid });
		assert.deepEqual(filteredData, expectedOutput, `The actual result '${filteredData}' did NOT match expected output '${expectedOutput}'.`);
	};

	let logLevel = "INFO";

	describe("filterData", () => {
		describe("when log level is full", () => {
			beforeEach(() => logLevel = "FULL");
			it("when API level 23 or later is used", () => {
				_.each(androidApiLevel23TestData, testData => {
					assertFiltering(testData.input, testData.input + EOL, logLevel);
				});
			});

			it("when API level 22 is used", () => {
				_.each(androidApiLevel22TestData, testData => {
					assertFiltering(testData.input, testData.input + EOL, logLevel);
				});
			});
		});

		describe("when log level is info", () => {
			beforeEach(() => logLevel = "info");
			it("when API level 23 or later is used", () => {
				_.each(androidApiLevel23TestData, testData => {
					assertFiltering(testData.input, testData.output ? testData.output + EOL : testData.output, logLevel);
				});
			});

			it("when API level 22 is used", () => {
				_.each(androidApiLevel22TestData, testData => {
					assertFiltering(testData.input, testData.output ? testData.output + EOL : testData.output, logLevel);
				});
			});

			it("when API level 23 or later is used, and application process matches logcat pids", () => {
				const appPid = "8141";
				_.each(androidApiLevel23MapForPid8141, testData => {
					assertFiltering(testData.input, testData.output ? testData.output + EOL : testData.output, logLevel, appPid);
				});
			});

			it("when API level 23 or later is used, and application pid doesn't match any logcat pids", () => {
				const appPid = "99999";
				const expectedOutputMap = androidApiLevel23MapForPid8141.map(testData => ({ input: testData.input, output: null }));
				_.each(expectedOutputMap, testData => {
					assertFiltering(testData.input, testData.output ? testData.output + EOL : testData.output, logLevel, appPid);
				});
			});
		});

		describe("when log level is not specified", () => {
			beforeEach(() => logLevel = "");
			it("when API level 23 or later is used", () => {
				_.each(androidApiLevel22TestData, testData => {
					assertFiltering(testData.input, testData.input + EOL, null);
				});
			});

			it("when API level 22 is used", () => {
				_.each(androidApiLevel22TestData, testData => {
					assertFiltering(testData.input, testData.input + EOL, null);
				});
			});
		});
	});
});
