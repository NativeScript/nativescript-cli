# android-livesync-tool
Tool for livesyncing changes to a NativeScript application on Android.

## Usage
The tool has a few public methods that allow file manipulation to the files of a NativeScript application and provide control for refreshing the application. Restarting the application if necessary should be done by the user of this tool.

### Getting an instance

* Example:
```JavaScript
const globalModulesPath = require("global-modules-path");
const cliPath = globalModulesPath.getPath("nativescript", "tns");
cli = require(cliPath);

const liveSyncTool = cli.androidLivesyncTool;
```


### Calling connect
Connect method will establish a fresh socket connection with the application. The method takes a configuration as a parameter.

* Definition
```TypeScript
interface ILivesyncToolConfiguration {
	appIdentifier: string;
	deviceIdentifier: string;
	appPlatformsPath: string; // path to /c/myprojects/myapp/app/platforms/android/app/src/main/assets/app/
	localHostAddress?: string;
	errorHandler?: any;
}

/**
 * Creates new socket connection.
 * @param configuration - The configuration to the socket connection.
 * @returns {Promise<void>}
 */
connect(configuration: ILivesyncToolConfiguration): Promise<void>;
```

* Example:
```JavaScript

var configuration = {
	appPlatformsPath: "/c/myprojects/myapp/app/platforms/android/app/src/main/assets/app/",
	fullApplicationName: "com.tns.myapp",
	deviceIdentifier: "aaaaaaaa"
}

liveSyncTool.connect(configuration)
```

The method returns a promise which is resolved once the connection is established. There is a 30 seconds timeout for establishing the connection. In order the connection to be established successfully, the app must be started.

### Calling sendFile
Send file will create/update the file with the file content it reads from the filePath that is provided. It will compute the relative path based on the fullApplicationName provided in configuration that was passed to the connect method. This method resolves its promise once the file is written to the output stream of the socket. To be sure the all files have been read and saved by the runtime see sendDoSyncOperation.

* Definition
```TypeScript
/**
 * Sends a file through the socket.
 * @param filePath - The full path to the file.
 * @returns {Promise<void>}
 */
sendFile(filePath: string): Promise<void>;
```

* Example:
```JavaScript
liveSyncTool.sendFile("/c/myprojects/myapp/app/platforms/android/app/src/main/assets/app/index.js");
```

### Calling sendFiles
This method takes an array of file paths as an argument and sends their content to the application.

* Definition
```TypeScript
/**
 * Sends files through the socket.
 * @param filePaths - Array of files that will be send by the socket.
 * @returns {Promise<void>}
 */
sendFiles(filePaths: string[]): Promise<void>;
```

* Example:
```JavaScript
liveSyncTool.sendFile([
	"/c/myprojects/myapp/app/platforms/android/app/src/main/assets/app/index.js"
	"/c/myprojects/myapp/app/platforms/android/app/src/main/assets/app/test.js"
	"/c/myprojects/myapp/app/platforms/android/app/src/main/assets/app/page.js"
]);
```

### Calling sendDirectory
This method takes a path to a directory, enumerates the files recursively and sends the to the device.

* Definition
```TypeScript
/**
 * Sends all files from directory by the socket.
 * @param directoryPath - The path to the directory which files will be send by the socket.
 * @returns {Promise<void>}
 */
sendDirectory(directoryPath: string): Promise<void>;
```

* Example:
```JavaScript
liveSyncTool.sendDirectory("/c/myprojects/myapp/app/platforms/android/app/src/main/assets/app");
```

### Calling removeFile
When called, removeFile will compute the relative path based on the fullApplicationName provided in configuration that was passed to the connect method and delete the corresponding file/directory on the device.

* Definition
```TypeScript
/**
 * Removes file
 * @param filePath - The full path to the file.
 * @returns {Promise<boolean>}
 */
removeFile(filePath: string): Promise<boolean>;
```

* Example:
```JavaScript
liveSyncTool.removeFile("/c/myprojects/myapp/app/platforms/android/app/src/main/assets/app/index.js");
```

### Calling removeFiles
When called, removeFiles will compute the relative paths based on the fullApplicationName provided in configuration that was passed to the connect method and delete the corresponding files/directories on the device.

* Definition
```TypeScript
/**
 * Removes files 
 * @param filePaths - Array of files that will be removed.
 * @returns {Promise<boolean[]>}
 */
removeFiles(filePaths: string[]): Promise<boolean[]>;
```

* Example:
```JavaScript
liveSyncTool.removeFiles([
	"/c/myprojects/myapp/app/platforms/android/app/src/main/assets/app/index.js"
	"/c/myprojects/myapp/app/platforms/android/app/src/main/assets/app/test.js"
	"/c/myprojects/myapp/app/platforms/android/app/src/main/assets/app/page.js"
]);
```

### Calling sendDoSyncOperation
When called, sendDoSyncOperation will tell the runtime to execute a script that will refresh the application(this will render changes to the .html and .css files). This method accepts an optional parameter - operationId. It can be used for status check of the operation. The promise returned from this method will be resolved when the application has read the operation and started executing it. This can be used as a sync point - once this promise is resolved, the user can be sure that all other operations have been read and executed by the application. The operation accepts an operation id

* Definition
```TypeScript
/**
 * Sends doSyncOperation that will be handled by the runtime.
 * @param doRefresh - Indicates if the application should be restarted. Defaults to true.
 * @param operationId - The identifier of the operation
 * @param timeout - The timeout in milliseconds
 * @returns {Promise<void>}
 */
sendDoSyncOperation(doRefresh: boolean, timeout?: number, operationId?: string): Promise<IAndroidLivesyncSyncOperationResult>;
```

* Example:
```JavaScript
const operationId = liveSyncTool.generateOperationIdentifier();
await liveSyncTool.sendDoSyncOperation(true, 10000, operationId);
```

### Calling end
End will close the current liveSync socket. Any sync operations that are still in progress will be rejected.

* Definition
```TypeScript
/**
 * Closes the current socket connection.
 * @param error - Optional error for rejecting pending sync operations
 */
end(error? Error): void;
```

* Example:
```JavaScript
liveSyncTool.end();
```

## Protocol:

Application input

|Operation Name(not send) | Operation | Operation id | File Name Length Size | File Name Length | File Name |  File Content Length Size | File Content Length | Header Hash | File Content | File hash |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| runSync: | 9 | 32bit | | | | | | md5 hash | | |
| create: | 8 | | 1 | 7 | ./a.txt | 2 | 11 | md5 hash | fileContent | md5 hash |
| delete: | 7 | | 1 | 3 | ./a | | | md5 hash | | |

Application output on connect

| Protocol Version length | Protocol Version String | Application Identifier |
| --- | --- | --- |
| 1 byte | "0.1.0" | "org.nativescript.myapp" |

Application output after connect

| Report Name(not send) | Report Code | Payload |
| --- | --- | --- |
| Error | 1 | Error message string |
| Sync end | 2 | Sync operation uid |