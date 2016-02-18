'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _client = require('./client');

var _client2 = _interopRequireDefault(_client);

var _enums = require('./enums');

var _errors = require('./errors');

var _isString = require('lodash/isString');

var _isString2 = _interopRequireDefault(_isString);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var rpcNamespace = process.env.KINVEY_RPC_NAMESPACE || 'rpc';

/**
 * Executes a custom command.
 */

var Command = function () {
  function Command() {
    _classCallCheck(this, Command);
  }

  _createClass(Command, null, [{
    key: 'execute',

    /**
     * Execute a custom command. A promise will be returned that will be resolved
     * with the result of the command or rejected with an error.
     *
     * @param   {String}          command                           Command to execute.
     * @param   {Object}          [args]                            Command arguments
     * @param   {Object}          [options]                         Options
     * @param   {Properties}      [options.properties]              Custom properties to send with
     *                                                              the request.
     * @param   {Number}          [options.timeout]                 Timeout for the request.
     * @return  {Promise}                                           Promise
     *
     * @example
     * var promise = Kinvey.Command.execute('myCustomCommand').then(function(data) {
     *   ...
     * }).catch(function(error) {
     *   ...
     * });
     */
    value: function execute(command, args) {
      var options = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

      var client = _client2.default.sharedInstance();

      if (!command) {
        throw new _errors.KinveyError('A command is required.');
      }

      if (!(0, _isString2.default)(command)) {
        throw new _errors.KinveyError('Command must be a string.');
      }

      return client.executeNetworkRequest({
        method: _enums.HttpMethod.POST,
        pathname: '/' + rpcNamespace + '/' + options.client.appKey + '/custom/' + command,
        properties: options.properties,
        auth: client.defaultAuth(),
        data: args,
        timeout: options.timeout
      }).then(function (response) {
        return response.data;
      });
    }
  }]);

  return Command;
}();

exports.default = Command;