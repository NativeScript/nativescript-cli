
# A PowerShell script to set up Windows machine for NativeScript development
# To run it against the PRODUCTION branch (only one supported with self-elevation) use
# @powershell -NoProfile -ExecutionPolicy Bypass -Command "iex ((new-object net.webclient).DownloadString('https://raw.githubusercontent.com/NativeScript/nativescript-cli/production/setup/native-script.ps1'))" 

# Self-elevate
$isElevated = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]"Administrator")
if (-not $isElevated) {
    start-process -FilePath PowerShell.exe -NoProfile -ExecutionPolicy Bypass -Verb Runas -Wait -Command "iex ((new-object net.webclient).DownloadString('https://raw.githubusercontent.com/NativeScript/nativescript-cli/production/setup/native-script.ps1'))"
    exit 0
}

# Install Chocolately
iex ((new-object net.webclient).DownloadString('https://chocolatey.org/install.ps1'))

# install dependenciess with Chocolately

write-host "To ensure consistent environment, this script will re-install all NativeScript dependencies."

write-host -BackgroundColor Black -ForegroundColor Yellow "Installing Google Chrome (required to debug NativeScript apps)"
cinst googlechrome --force --yes

write-host -BackgroundColor Black -ForegroundColor Yellow "Installing node.js"
cinst nodejs.install -version 4.2.6 --force --yes

write-host -BackgroundColor Black -ForegroundColor Yellow "Installing Java Development Kit"
cinst jdk8 --force --yes

write-host -BackgroundColor Black -ForegroundColor Yellow "Installing Android SDK"
cinst android-sdk --force --yes

# setup android sdk
echo yes | cmd /c "$env:localappdata\Android\android-sdk\tools\android" update sdk --filter "tools,platform-tools,android-23" --all --no-ui
echo yes | cmd /c "$env:localappdata\Android\android-sdk\tools\android" update sdk --filter "build-tools-23.0.1,extra-android-m2repository" --all --no-ui

# setup environment

if (!$env:ANDROID_HOME) {
    [Environment]::SetEnvironmentVariable("ANDROID_HOME", "$env:localappdata\Android\android-sdk", "User")
    $env:ANDROID_HOME = "$env:localappdata\Android\android-sdk";
}

if (!$env:JAVA_HOME) {
	$curVer = (Get-ItemProperty "HKLM:\SOFTWARE\JavaSoft\Java Development Kit").CurrentVersion
	$javaHome = (Get-ItemProperty "HKLM:\Software\JavaSoft\Java Development Kit\$curVer").JavaHome
	[Environment]::SetEnvironmentVariable("JAVA_HOME", $javaHome, "User")
    $env:JAVA_HOME = $javaHome;
}

# install NativeScript CLI
write-host -BackgroundColor Black -ForegroundColor Yellow "Installing NativeScript CLI"

$oldPathUser = [Environment]::GetEnvironmentVariable("PATH", "User")
$pathMachine = [Environment]::GetEnvironmentVariable("PATH", "Machine")
$myPath = [Environment]::GetEnvironmentVariable("PATH")
[Environment]::SetEnvironmentVariable("PATH", "$myPath;$oldPathUser;$pathMachine;$env:ProgramFiles\nodejs")

npm install -g nativescript

write-host -BackgroundColor Black -ForegroundColor Yellow "This script has modified your environment. You need to log off and log back on for the changes to take effect."
pause
