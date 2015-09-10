# coding: utf-8

# Only the user can manually download and install Xcode from AppStore
puts "Installing Xcode... Please, click 'Get' or 'Update' to install Xcode from the App Store."
`open 'macappstore://itunes.apple.com/us/app/xcode/id497799835'`

until `xcodebuild -version`.include? "version" do
  puts "Waiting for Xcode to finish installing..."
  sleep(30)
end

puts "You need to accept the Xcode license agreement to be able to use the Xcode command-line tools. (You might need to provide your password.)"
`sudo xcodebuild -license`

# Install all other dependencies
puts "Installing Homebrew... (You might need to provide your password.)"
`ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"`

puts "Installing CocoaPods... This might take some time, please, be patient. (You might need to provide your password.)"
system('sudo gem install cocoapods')

puts "Installing Homebrew Cask... (You might need to provide your password.)"
system('brew install caskroom/cask/brew-cask')

puts "Installing the Java SE Development Kit... (You might need to provide your password.)"
system('brew cask install java')
`echo "export JAVA_HOME=$(/usr/libexec/java_home)" >> ~/.bash_profile`
`echo "export ANDROID_HOME=/usr/local/opt/android-sdk" >> ~/.bash_profile`

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
  depends_on "node"
  depends_on "ant"
  depends_on "android-sdk"
  depends_on "gradle"

  def install
    ohai "Installing NativeScript CLI..."
    system "/usr/local/bin/npm install -g nativescript"

    ohai "Configuring your system for Android development... This might take some time, please, be patient."
    system "echo yes | android update sdk --filter tools,platform-tools,android-22,android-17,build-tools-22.0.1,sys-img-x86-android-22,extra-android-m2repository,extra-google-m2repository,extra-android-support --all --no-ui"

    ohai "The ANDROID_HOME and JAVA_HOME environment variables have been added to your .bash_profile. Restart the terminal to use them."
  end
end
