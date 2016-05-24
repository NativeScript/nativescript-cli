[![Build Status](https://travis-ci.org/h13i32maru/color-logger.svg?branch=master)](https://travis-ci.org/h13i32maru/color-logger)
[![Coverage Status](https://coveralls.io/repos/h13i32maru/color-logger/badge.svg)](https://coveralls.io/r/h13i32maru/color-logger)

# Color Logger
colorful logger for node.

```
npm install color-logger
```

## Example

```js
import Logger from 'color-logger';

// simple usage
Logger.v('verbose log1', 'verbose log2');

// use object
Logger.d({foo: 123, bar: [1, 2, 3]});

// use tag
let logger = new Logger('MyTag');
logger.w('warning log');

// all log level and colors
Logger.v('verbose log');
Logger.d('debug log');
Logger.i('info log');
Logger.w('warning log');
Logger.e('error log');
```

<img src='./misc/color-logger.png' width='600'>

## API Reference
[https://h13i32maru.github.io/color-logger/](https://h13i32maru.github.io/color-logger/)

## License
MIT
