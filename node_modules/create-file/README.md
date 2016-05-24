# create-file

[![NPM version][npm-image]][npm-url] [![js-xo-style][codestyle-image]][codestyle-url]

> Write to a file only if it does not exist

## Installation

Install `create-file` using [npm](https://www.npmjs.com/):

```bash
npm install --save create-file
```

## Usage

### Module usage

```javascript
var createFile = require('create-file');

createFile('/path/to/file/to-create', 'my content\n', function (err) {
  // file either already exists or is now created (including non existing directories)
});
```

## API

### `createFile(filename, contents, cb)`

| Name | Type | Description |
|------|------|-------------|
| filename | `String` | The filename to create |
| contents | `String` | The content to write |
| cb | `Function` | Callback |


## License

MIT

[npm-url]: https://npmjs.org/package/create-file
[npm-image]: https://badge.fury.io/js/create-file.svg
[codestyle-url]: https://github.com/sindresorhus/xo
[codestyle-image]: https://img.shields.io/badge/code%20style-xo-brightgreen.svg?style=flat
