@for /F "delims=" %%i IN ('@node --version') DO @set node_ver=%%i

@echo %node_ver% | @findstr /b /c:"v4."
@set is_node_4=%errorlevel%

@echo %node_ver% | @findstr /b /c:"v5."
@set is_node_5=%errorlevel%

@set use_harmony_flag=0

@if %is_node_4% == 0 @set use_harmony_flag=1
@if %is_node_5% == 0 @set use_harmony_flag=1

@if %use_harmony_flag% == 1 (
	return @node --harmony %~dp0\nativescript.js %*
) else (
	@node %~dp0\nativescript.js %*
)