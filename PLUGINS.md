PLUGINS
=========

NativeScript plugin is a npm package that consist of the following:

* Metadata about the package itself: name, version, supported runtime versions, etc.
* CommonJS module(one or many) that expose the native API via a single JavaScript API.
* Native libraries and resources.

A package json file has the following structure:
```
{
	"name": "myplugin",
	"version": "0.0.1",
	"nativescript": {
		"platforms": {
			"ios": "1.0.0",
			"android": "1.1.0"
		}
	}
}
```
`nativescript` key is a mandatory section for a NativeScript plugin. `platforms` section describes the supported runtime versions for each platform.

A plugin directory has the following structure:
```
myPlugin/
-- index.js
-- package.json
-- platforms
  -- Android
	   -- myjar.jar
	   -- Android.manifest
  -- iOS
	   -- myFramework.framework
	   -- Info.plist
```

You can use `platforms` folder and place platform specific files in each platform directory.

Here is an example. 

Let you say that you have the following `Android.manifest` file in `platforms\android\` folder in your plugin:
```
<?xml version="1.0" encoding="UTF-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.example.android.basiccontactables"
    android:versionCode="1"
    android:versionName="1.0" >
	
	 <uses-sdk
        android:minSdkVersion="19"
        android:targetSdkVersion="21" />
 
    <uses-permission android:name="android.permission.READ_CONTACTS"/>
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_LOCATION_EXTRA_COMMANDS" />
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
    <uses-permission android:name="com.example.towntour.permission.MAPS_RECEIVE" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.CALL_PHONE" />
    <uses-permission android:name="android.permission.READ_PHONE_STATE" /> 
    <uses-permission android:name="com.google.android.providers.gsf.permission.READ_GSERVICES" />

     <application
        android:name="com.tns.NativeScriptApplication"
        android:allowBackup="true"
        android:icon="@drawable/icon"
        android:label="@string/app_name"
        android:theme="@style/AppTheme" >
        <activity
            android:name="com.tns.NativeScriptActivity"
            android:label="@string/title_activity_kimera"
            android:configChanges="keyboardHidden|orientation|screenSize">
            
             <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <action android:name="android.intent.action.EDIT" />
                <action android:name="android.intent.action.VIEW" />

                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
                 
</manifest>
```

and the default `Android.manifest` file in your app in `platforms\android\` folder.
```
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="org.nativescript.test"
    android:versionCode="1"
    android:versionName="1.0" >

   <uses-sdk
        android:minSdkVersion="17"
        android:targetSdkVersion="17" />
    
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE"/>
    <uses-permission android:name="android.permission.INTERNET"/>
    
    <application
        android:name="com.tns.NativeScriptApplication"
        android:allowBackup="true"
        android:icon="@drawable/icon"
        android:label="@string/app_name"
        android:theme="@style/AppTheme" >
        <activity
            android:name="com.tns.NativeScriptActivity"
            android:label="@string/title_activity_kimera"
            android:configChanges="keyboardHidden|orientation|screenSize">
            
             <intent-filter>
                <action android:name="android.intent.action.MAIN" />

                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>

</manifest>
```

The produced result xml will be: 
```
<?xml version="1.0" encoding="utf-8"?>
<manifest 
  xmlns:android="http://schemas.android.com/apk/res/android" package="org.nativescript.test" android:versionCode="1" android:versionName="1.0">
  <uses-sdk android:minSdkVersion="19" android:targetSdkVersion="21"/>
  <uses-permission android:name="android.permission.READ_CONTACTS"/>
  <uses-permission android:name="android.permission.INTERNET"/>
  <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION"/>
  <uses-permission android:name="android.permission.ACCESS_LOCATION_EXTRA_COMMANDS"/>
  <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION"/>
  <uses-permission android:name="com.example.towntour.permission.MAPS_RECEIVE"/>
  <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE"/>
  <uses-permission android:name="android.permission.CALL_PHONE"/>
  <uses-permission android:name="android.permission.READ_PHONE_STATE"/>
  <!-- 
		Some comment here
	-->
  <uses-permission android:name="com.google.android.providers.gsf.permission.READ_GSERVICES"/>
  <application android:name="com.tns.NativeScriptApplication" android:allowBackup="true" android:icon="@drawable/icon" android:label="@string/app_name" android:theme="@style/AppTheme">
    <activity android:name="com.tns.NativeScriptActivity" android:label="@string/title_activity_kimera" android:configChanges="keyboardHidden|orientation|screenSize">
      <intent-filter>
        <action android:name="android.intent.action.MAIN"/>
        <action android:name="android.intent.action.EDIT"/>
        <action android:name="android.intent.action.VIEW"/>
        <category android:name="android.intent.category.LAUNCHER"/>
      </intent-filter>
    </activity>
  </application>
</manifest>
```


