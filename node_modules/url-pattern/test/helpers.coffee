test = require 'tape'
{
  escapeForRegex
  concatMap
  stringConcatMap
  regexGroupCount
  keysAndValuesToObject
} = require '../lib/url-pattern'

test 'escapeForRegex', (t) ->
  expected = '\\[\\-\\/\\\\\\^\\$\\*\\+\\?\\.\\(\\)\\|\\[\\]\\{\\}\\]'
  actual = escapeForRegex('[-\/\\^$*+?.()|[\]{}]')
  t.equal expected, actual

  t.equal escapeForRegex('a$98kdjf(kdj)'), 'a\\$98kdjf\\(kdj\\)'
  t.equal 'a', escapeForRegex 'a'
  t.equal '!', escapeForRegex '!'
  t.equal '\\.', escapeForRegex '.'
  t.equal '\\/', escapeForRegex '/'
  t.equal '\\-', escapeForRegex '-'
  t.equal '\\-', escapeForRegex '-'
  t.equal '\\[', escapeForRegex '['
  t.equal '\\]', escapeForRegex ']'
  t.equal '\\(', escapeForRegex '('
  t.equal '\\)', escapeForRegex ')'
  t.end()

test 'concatMap', (t) ->
  t.deepEqual [], concatMap [], ->
  t.deepEqual [1], concatMap [1], (x) -> [x]
  t.deepEqual [1, 1, 1, 2, 2, 2, 3, 3, 3], concatMap [1, 2, 3], (x) -> [x, x, x]
  t.end()

test 'stringConcatMap', (t) ->
  t.equal '', stringConcatMap [], ->
  t.equal '1', stringConcatMap [1], (x) -> x
  t.equal '123', stringConcatMap [1, 2, 3], (x) -> x
  t.equal '1a2a3a', stringConcatMap [1, 2, 3], (x) -> x + 'a'
  t.end()

test 'regexGroupCount', (t) ->
  t.equal 0, regexGroupCount /foo/
  t.equal 1, regexGroupCount /(foo)/
  t.equal 2, regexGroupCount /((foo))/
  t.equal 2, regexGroupCount /(fo(o))/
  t.equal 2, regexGroupCount /f(o)(o)/
  t.equal 2, regexGroupCount /f(o)o()/
  t.equal 5, regexGroupCount /f(o)o()()(())/
  t.end()

test 'keysAndValuesToObject', (t) ->
  t.deepEqual(
    keysAndValuesToObject(
      []
      []
    )
    {}
  )
  t.deepEqual(
    keysAndValuesToObject(
      ['one']
      [1]
    )
    {
      one: 1
    }
  )
  t.deepEqual(
    keysAndValuesToObject(
      ['one', 'two']
      [1]
    )
    {
      one: 1
    }
  )
  t.deepEqual(
    keysAndValuesToObject(
      ['one', 'two', 'two']
      [1, 2, 3]
    )
    {
      one: 1
      two: [2, 3]
    }
  )
  t.deepEqual(
    keysAndValuesToObject(
      ['one', 'two', 'two', 'two']
      [1, 2, 3, null]
    )
    {
      one: 1
      two: [2, 3]
    }
  )
  t.deepEqual(
    keysAndValuesToObject(
      ['one', 'two', 'two', 'two']
      [1, 2, 3, 4]
    )
    {
      one: 1
      two: [2, 3, 4]
    }
  )
  t.deepEqual(
    keysAndValuesToObject(
      ['one', 'two', 'two', 'two', 'three']
      [1, 2, 3, 4, undefined]
    )
    {
      one: 1
      two: [2, 3, 4]
    }
  )
  t.deepEqual(
    keysAndValuesToObject(
      ['one', 'two', 'two', 'two', 'three']
      [1, 2, 3, 4, 5]
    )
    {
      one: 1
      two: [2, 3, 4]
      three: 5
    }
  )
  t.deepEqual(
    keysAndValuesToObject(
      ['one', 'two', 'two', 'two', 'three']
      [null, 2, 3, 4, 5]
    )
    {
      two: [2, 3, 4]
      three: 5
    }
  )
  t.end()
