var fs       = require('fs')
var path     = require('path')
var mkdirp   = require('mkdirp')

module.exports = function(filepath, data, options, cb) {
  var fsArgs = [].slice.call(arguments)
  if (typeof options === 'function' && typeof cb === 'undefined') {
    cb = options
    options = null
  }
  var mkdirpArgs = [path.dirname(filepath)]
  if (options) {
    mkdirpArgs.push(options)
  }
  mkdirpArgs.push(function(err) {
    if (err) { return cb(err) }
    fs.writeFile.apply(fs, fsArgs)
  })
  mkdirp.apply(null, mkdirpArgs)
}
