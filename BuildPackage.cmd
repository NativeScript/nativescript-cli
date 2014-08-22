call "c:\Program Files (x86)\nodejs\nodevars.bat"
call npm.cmd install -g grunt-cli

set NATIVESCRIPT_SKIP_POSTINSTALL_TASKS=1
call grunt.cmd enableScripts:false
call npm.cmd install
call grunt.cmd enableScripts:true
set NATIVESCRIPT_SKIP_POSTINSTALL_TASKS=

call grunt.cmd pack --no-color

call npm.cmd cache rm nativescript
