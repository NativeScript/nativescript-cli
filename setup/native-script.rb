# coding: utf-8

# A script to setup developer's workstation for developing with NativeScript
# To run it against PRODUCTION branch (only one supported with self-elevation) use
# sudo ruby -e "$(curl -fsSL https://raw.githubusercontent.com/NativeScript/nativescript-cli/production/setup/native-script.rb)"

# Only the user can manually download and install Xcode from App Store
unless Process.uid == 0
  # Execute as root
  puts "This scripts needs sudo permissions"
  exec('sudo ruby -e "$(curl -fsSL https://raw.githubusercontent.com/NativeScript/nativescript-cli/production/setup/native-script.rb)"')
end

puts "NativeScript requires Xcode."
puts "If you do not have Xcode installed, download and install it from App Store and run it once to complete its setup."
puts "Do you have Xcode installed? (y/n)"

xcode = gets.chomp

if xcode.downcase == "n"
  exit
end

if !(`xcodebuild -version`.include? "version")
  puts "Xcode is not installed or not configured properly. Download, install, set it up and run this script again."
  exit
end

puts "You need to accept the Xcode license agreement to be able to use the Xcode command-line tools."
system('xcodebuild -license')

# Help with installing other dependencies
$answer = ""

def execute(script, warning_message, run_as_root = false)
  if run_as_root
    result = system(script)
  else
    result = system("sudo su " + ENV['SUDO_USER'] + " -c '" + script + "'")
  end

  if result.nil?
    STDERR.puts "ERROR: " + script + " execution FAILED"
    exit 1
  end

  unless result
    STDERR.puts "WARNING: " + warning_message
  end
end

def install(program_name, message, script, run_as_root = false, show_all_option = true)
  if $answer != "a"
    puts "Allow the script to install " + program_name + "?"
    if show_all_option
      puts "Note that if you type all you won't be prompted for subsequent installations"
    end

    loop do
      puts show_all_option ? "(Y)es/(N)o/(A)ll" : "(Y)es/(N)o"
      $answer = gets.chomp.downcase
      is_answer_yn = $answer == "y" || $answer == "n"
      break if show_all_option ? is_answer_yn || $answer == "a" : is_answer_yn
    end

    if $answer == "n"
      puts "You have chosen not to install " + program_name + ". Some features of NativeScript may not work correctly if you haven't already installed it"
      return
    end
  end

  puts message
  execute(script, program_name + " not installed", run_as_root)
end

# Actually installing all other dependencies
install("Homebrew",	"Installing Homebrew...", 'ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"</dev/null', false, false)

if !(`brew --version`.include? "git revision")
  puts "Homebrew is not installed or not configured properly. Download it from http://brew.sh/, install, set it up and run this script again."
  exit
end

install("Java SE Development Kit", "Installing the Java SE Development Kit... This might take some time, please, be patient. (You will be prompted for your password)", 'brew cask install java', false, false)
execute('echo "export JAVA_HOME=$(/usr/libexec/java_home)" >> ~/.profile', "Unable to set JAVA_HOME")

install("Android SDK", "Installing Android SDK", 'brew install android-sdk')
execute('echo "export ANDROID_HOME=/usr/local/opt/android-sdk" >> ~/.profile', "Unable to set ANDROID_HOME")

# the -p flag is set in order to ensure zero status code even if the directory exists
execute("mkdir -p ~/.cocoapods", "There was a problem in creating ~/.cocoapods directory")
install("CocoaPods", "Installing CocoaPods... This might take some time, please, be patient.", 'gem install cocoapods -V', true)

puts "Configuring your system for Android development... This might take some time, please, be patient."
# Note that multiple license acceptances may be required, hence the multiple y answers
# the android tool will introduce a --accept-license option in subsequent releases
execute("(for i in {1..5}; do echo y; sleep 4; done) | /usr/local/opt/android-sdk/tools/android update sdk --filter tools,platform-tools,android-23,build-tools-23.0.2,extra-android-m2repository --all --no-ui",
	"There seem to be some problems with the Android configuration")

puts "The ANDROID_HOME and JAVA_HOME environment variables have been added to your .profile. Restart the terminal to use them."
