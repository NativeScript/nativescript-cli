# coding: utf-8

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
system('echo "export JAVA_HOME=$(/usr/libexec/java_home)" >> ~/.bash_profile')
system('echo "export ANDROID_HOME=/usr/local/opt/android-sdk" >> ~/.bash_profile')

puts "Installing node.js 0.12"
system('brew install homebrew/versions/node012')

puts "Creating Homebrew formula for NativeScript."
File.open("/usr/local/Library/Formula/native-script.rb", "w:utf-8") do |f|
  f.write DATA.read
end

puts "Installing NativeScript formula... This might take some time, please, be patient."
system('brew install native-script')

__END__

class NativeScript < Formula
  desc "NativeScript"
  homepage "https://www.nativescript.org"
  version "1.3.0"
  url "https://raw.githubusercontent.com/NativeScript/nativescript-cli/brew/setup/empty.tar.gz"
  sha256 "813e1b809c094d29255191c14892a32a498e2ca298abbf5ce5cb4081faa4e88f"

  depends_on :macos => :yosemite
  depends_on "pkg-config" => :build
#  depends_on "node" # currently we do not work with latest node, and we manually install 0.12 (see above)
  depends_on "android-sdk"

  def install
    ohai "Installing NativeScript CLI..."
    system "/usr/local/bin/npm install -g nativescript"

    ohai "Configuring your system for Android development... This might take some time, please, be patient."
    system "echo yes | android update sdk --filter tools,platform-tools,android-22,build-tools-22.0.1,sys-img-x86-android-22,extra-android-m2repository,extra-google-m2repository,extra-android-support --all --no-ui"

    ohai "The ANDROID_HOME and JAVA_HOME environment variables have been added to your .bash_profile. Restart the terminal to use them."
  end
end
