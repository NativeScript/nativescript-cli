# safe-write-file

Like `fs.writeFile`, but it will create the needed directories before trying to create the file.

## Install
```
npm install safe-write-file
```

## Usage

```javascript
var safeWriteFile = require('safe-write-file')

safeWriteFile(__dirname+'/these/will/be/created/file.txt', 'Text, bro!')
```

### Parameters

See the [fs.writeFile docs](https://nodejs.org/api/fs.html#fs_fs_writefile_filename_data_options_callback).
