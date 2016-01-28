
# A Boxstarter script to set up Windows machine for NativeScript development
# To run it against RELEASE branch (recommended) use
# http://boxstarter.org/package/nr/url?https://raw.githubusercontent.com/NativeScript/nativescript-cli/release/setup/native-script.ps1
# To run it against MASTER branch (usually only developers of NativeScript need to) use
# http://boxstarter.org/package/nr/url?https://raw.githubusercontent.com/NativeScript/nativescript-cli/master/setup/native-script.ps1

# install dependenciess with Chocolately

write-host -BackgroundColor Black -ForegroundColor Yellow "Installing Google Chrome (required to debug NativeScript apps)"
cinst googlechrome

write-host -BackgroundColor Black -ForegroundColor Yellow "Installing node.js"
cinst nodejs.install -version 4.2.5

write-host -BackgroundColor Black -ForegroundColor Yellow "Installing Java Development Kit"
cinst jdk8

write-host -BackgroundColor Black -ForegroundColor Yellow "Installing Android SDK"
cinst android-sdk

# setup android sdk
echo yes | cmd /c "$env:localappdata\Android\android-sdk\tools\android" update sdk --filter "tools,platform-tools,android-23" --all --no-ui
echo yes | cmd /c "$env:localappdata\Android\android-sdk\tools\android" update sdk --filter "build-tools-23.0.1,extra-android-m2repository" --all --no-ui

# setup environment

if (!$env:ANDROID_HOME) {
    [Environment]::SetEnvironmentVariable("ANDROID_HOME", "$env:localappdata\Android\android-sdk", "User")
}

if (!$env:JAVA_HOME) {
	$curVer = (Get-ItemProperty "HKLM:\SOFTWARE\JavaSoft\Java Development Kit").CurrentVersion
	$javaHome = (Get-ItemProperty "HKLM:\Software\JavaSoft\Java Development Kit\$curVer").JavaHome
	[Environment]::SetEnvironmentVariable("JAVA_HOME", $javaHome, "User")
}

# install NativeScript CLI
write-host -BackgroundColor Black -ForegroundColor Yellow "Installing NativeScript CLI"

$oldPathUser = [Environment]::GetEnvironmentVariable("PATH", "User")
$pathMachine = [Environment]::GetEnvironmentVariable("PATH", "Machine")
$myPath = [Environment]::GetEnvironmentVariable("PATH")
[Environment]::SetEnvironmentVariable("PATH", "$myPath;$oldPathUser;$pathMachine;$env:ProgramFiles\nodejs")

cmd /c "npm" install -g nativescript

write-host -BackgroundColor Black -ForegroundColor Yellow "This script has modified your environment. You need to log off and log back on for the changes to take effect."
