
# A Boxstarter script to set up Windows machine for NativeScript development
# To run it against RELEASE branch (recommended) use
# http://boxstarter.org/package/nr/url?https://raw.githubusercontent.com/NativeScript/nativescript-cli/release/setup/native-script.ps1
# To run it against MASTER branch (usually only developers of NativeScript need to) use
# http://boxstarter.org/package/nr/url?https://raw.githubusercontent.com/NativeScript/nativescript-cli/master/setup/native-script.ps1

# install dependenciess with Chocolately

write-host -BackgroundColor Black -ForegroundColor Yellow "Installing Google Chrome (required to debug NativeScript apps)"
cinst googlechrome

write-host -BackgroundColor Black -ForegroundColor Yellow "Installing node.js"
cinst nodejs.install -version 0.12.7

write-host -BackgroundColor Black -ForegroundColor Yellow "Installing Java Development Kit"
cinst jdk8

write-host -BackgroundColor Black -ForegroundColor Yellow "Installing Android SDK"
cinst android-sdk

# setup android sdk
echo yes | cmd /c $env:localappdata\Android\android-sdk\tools\android update sdk --filter "tools,platform-tools,android-23,build-tools-23.0.2,extra-android-m2repository" --all --no-ui

# setup environment

if (!$env:ANDROID_HOME) { [Environment]::SetEnvironmentVariable("ANDROID_HOME", "$env:localappdata\Android\android-sdk", "User") }
$oldPathUser = [Environment]::GetEnvironmentVariable("PATH", "User")
$pathMachine = [Environment]::GetEnvironmentVariable("PATH", "Machine")
$myPath = [Environment]::GetEnvironmentVariable("PATH")

[Environment]::SetEnvironmentVariable("PATH", "$myPath;$oldPathUser;$pathMachine;$env:localappdata\Android\android-sdk\tools;$env:localappdata\Android\android-sdk\platform-tools")
[Environment]::SetEnvironmentVariable("PATH", "$oldPathUser;$env:localappdata\Android\android-sdk\tools;$env:localappdata\Android\android-sdk\platform-tools", "User")

# install NativeScript CLI
write-host -BackgroundColor Black -ForegroundColor Yellow "Installing NativeScript CLI"
npm install -g nativescript

write-host -BackgroundColor Black -ForegroundColor Yellow "This script has modified your environment. You need to log off and log back on for the changes to take effect."
