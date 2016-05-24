# is-existing-file

[![NPM version][npm-image]][npm-url]

> Check if a certain path exists and is a file (i.e. not a folder)

## Installation

Install `is-existing-file` using [npm](https://www.npmjs.com/):

```bash
npm install --save is-existing-file
```

## Usage

### Module usage

```javascript
var isExistingFile = require('is-existing-file');

isExistingFile('/a/file/path', function (result) {
  // ...
});
```

## API

### `isExistingFile(filepath, cb)`

| Name | Type | Description |
|------|------|-------------|
| filepath | `String` | File path to check |
| cb | `Function` | Callback function |


## License

MIT

[npm-url]: https://npmjs.org/package/is-existing-file
[npm-image]: https://badge.fury.io/js/is-existing-file.svg

