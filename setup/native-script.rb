# coding: utf-8

# A script to setup developer's workstation for developing with NativeScript
# To run it against RELEASE branch (recommended) use
# ruby -e "$(curl -fsSL https://raw.githubusercontent.com/NativeScript/nativescript-cli/release/setup/native-script.rb)"
# To run it against MASTER branch (usually only developers of NativeScript need to) use
# ruby -e "$(curl -fsSL https://raw.githubusercontent.com/NativeScript/nativescript-cli/master/setup/native-script.rb)"

# Only the user can manually download and install Xcode from App Store
puts "NativeScript requires Xcode."
puts "If you do not have Xcode installed, download and install it from App Store and run it once to complete its setup."
puts "Do you have Xcode installed? (y/n)"

xcode = gets.chomp

if xcode == "n" || xcode == "N"
  exit
end

if !(`xcodebuild -version`.include? "version")
  puts "Xcode is not installed or not configured properly. Download, install, set it up and run this script again."
  exit
end

puts "You need to accept the Xcode license agreement to be able to use the Xcode command-line tools. (You might need to provide your password.)"
system('sudo xcodebuild -license')

# Install all other dependencies
puts "Installing Homebrew... (You might need to provide your password.)"
system('ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"')

if !(`brew --version`.include? "git revision")
  puts "Homebrew is not installed or not configured properly. Download it from http://brew.sh/, install, set it up and run this script again."
  exit
end

puts "Installing CocoaPods... This might take some time, please, be patient. (You might need to provide your password.)"
system('sudo gem install cocoapods')

puts "Installing Homebrew Cask... (You might need to provide your password.)"
system('brew install caskroom/cask/brew-cask')

puts "Installing the Java SE Development Kit... This might take some time, please, be patient. (You might need to provide your password.)"
system('brew cask install java')
system('echo "export JAVA_HOME=$(/usr/libexec/java_home)" >> ~/.profile')

puts "Installing Android SDK"
system('brew install android-sdk')
system('echo "export ANDROID_HOME=/usr/local/opt/android-sdk" >> ~/.profile')

puts "Configuring your system for Android development... This might take some time, please, be patient."
system "echo yes | /usr/local/opt/android-sdk/tools/android update sdk --filter tools,platform-tools,android-23,build-tools-23.0.2,extra-android-m2repository --all --no-ui"

puts "Installing Node.js 4"
system('brew install homebrew/versions/node4-lts')

puts "Installing NativeScript CLI..."
system "/usr/local/bin/npm install -g nativescript"

puts "The ANDROID_HOME and JAVA_HOME environment variables have been added to your .profile. Restart the terminal to use them."
