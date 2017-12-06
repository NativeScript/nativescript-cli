const Constants = {};

Constants.TextFieldName = 'textField';
Constants.NumberFieldName = 'numberField';
Constants.ArrayFieldName = 'arrayField';


if (typeof module === 'object') {
  module.exports = Constants;
} else {
  window.Constants = Constants;
}
