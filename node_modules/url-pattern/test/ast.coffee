test = require 'tape'
UrlPattern = require '../lib/url-pattern'

{
  astNodeToRegexString
  astNodeToNames
  getParam
} = UrlPattern

parse = UrlPattern.newParser(UrlPattern.defaultOptions).pattern

test 'astNodeToRegexString and astNodeToNames', (t) ->
  t.test 'just static alphanumeric', (t) ->
    parsed = parse 'user42'
    t.equal astNodeToRegexString(parsed.value), '^user42$'
    t.deepEqual astNodeToNames(parsed.value), []
    t.end()

  t.test 'just static escaped', (t) ->
    parsed = parse '/api/v1/users'
    t.equal astNodeToRegexString(parsed.value), '^\\/api\\/v1\\/users$'
    t.deepEqual astNodeToNames(parsed.value), []
    t.end()

  t.test 'just single char variable', (t) ->
    parsed = parse ':a'
    t.equal astNodeToRegexString(parsed.value), '^([a-zA-Z0-9-_~ %]+)$'
    t.deepEqual astNodeToNames(parsed.value), ['a']
    t.end()

  t.test 'just variable', (t) ->
    parsed = parse ':variable'
    t.equal astNodeToRegexString(parsed.value), '^([a-zA-Z0-9-_~ %]+)$'
    t.deepEqual astNodeToNames(parsed.value), ['variable']
    t.end()

  t.test 'just wildcard', (t) ->
    parsed = parse '*'
    t.equal astNodeToRegexString(parsed.value), '^(.*?)$'
    t.deepEqual astNodeToNames(parsed.value), ['_']
    t.end()

  t.test 'just optional static', (t) ->
    parsed = parse '(foo)'
    t.equal astNodeToRegexString(parsed.value), '^(?:foo)?$'
    t.deepEqual astNodeToNames(parsed.value), []
    t.end()

  t.test 'just optional variable', (t) ->
    parsed = parse '(:foo)'
    t.equal astNodeToRegexString(parsed.value), '^(?:([a-zA-Z0-9-_~ %]+))?$'
    t.deepEqual astNodeToNames(parsed.value), ['foo']
    t.end()

  t.test 'just optional wildcard', (t) ->
    parsed = parse '(*)'
    t.equal astNodeToRegexString(parsed.value), '^(?:(.*?))?$'
    t.deepEqual astNodeToNames(parsed.value), ['_']
    t.end()

test 'getParam', (t) ->
  t.test 'no side effects', (t) ->
    next = {}
    t.equal undefined, getParam {}, 'one', next
    t.deepEqual next, {}

    # value

    next = {}
    t.equal 1, getParam {one: 1}, 'one', next
    t.deepEqual next, {}

    next = {one: 0}
    t.equal 1, getParam {one: 1}, 'one', next
    t.deepEqual next, {one: 0}

    next = {one: 1}
    t.equal undefined, getParam {one: 1}, 'one', next
    t.deepEqual next, {one: 1}

    next = {one: 2}
    t.equal undefined, getParam {one: 1}, 'one', next
    t.deepEqual next, {one: 2}

    # array

    next = {}
    t.equal 1, getParam {one: [1]}, 'one', next
    t.deepEqual next, {}

    next = {one: 0}
    t.equal 1, getParam {one: [1]}, 'one', next
    t.deepEqual next, {one: 0}

    next = {one: 1}
    t.equal undefined, getParam {one: [1]}, 'one', next
    t.deepEqual next, {one: 1}

    next = {one: 2}
    t.equal undefined, getParam {one: [1]}, 'one', next
    t.deepEqual next, {one: 2}

    next = {one: 0}
    t.equal 1, getParam {one: [1, 2, 3]}, 'one', next
    t.deepEqual next, {one: 0}

    next = {one: 1}
    t.equal 2, getParam {one: [1, 2, 3]}, 'one', next
    t.deepEqual next, {one: 1}

    next = {one: 2}
    t.equal 3, getParam {one: [1, 2, 3]}, 'one', next
    t.deepEqual next, {one: 2}

    next = {one: 3}
    t.equal undefined, getParam {one: [1, 2, 3]}, 'one', next
    t.deepEqual next, {one: 3}

    t.end()

  t.test 'side effects', (t) ->
    next = {}
    t.equal 1, getParam {one: 1}, 'one', next, true
    t.deepEqual next, {one: 1}

    next = {one: 0}
    t.equal 1, getParam {one: 1}, 'one', next, true
    t.deepEqual next, {one: 1}

    # array

    next = {}
    t.equal 1, getParam {one: [1]}, 'one', next, true
    t.deepEqual next, {one: 1}

    next = {one: 0}
    t.equal 1, getParam {one: [1]}, 'one', next, true
    t.deepEqual next, {one: 1}

    next = {one: 0}
    t.equal 1, getParam {one: [1, 2, 3]}, 'one', next, true
    t.deepEqual next, {one: 1}

    next = {one: 1}
    t.equal 2, getParam {one: [1, 2, 3]}, 'one', next, true
    t.deepEqual next, {one: 2}

    next = {one: 2}
    t.equal 3, getParam {one: [1, 2, 3]}, 'one', next, true
    t.deepEqual next, {one: 3}

    t.end()

  t.test 'side effects errors', (t) ->
    t.plan 2 * 6

    next = {}
    try
      getParam {}, 'one', next, true
    catch e
      t.equal e.message, "no values provided for key `one`"
    t.deepEqual next, {}

    next = {one: 1}
    try
      getParam {one: 1}, 'one', next, true
    catch e
      t.equal e.message, "too few values provided for key `one`"
    t.deepEqual next, {one: 1}

    next = {one: 2}
    try
      getParam {one: 2}, 'one', next, true
    catch e
      t.equal e.message, "too few values provided for key `one`"
    t.deepEqual next, {one: 2}

    next = {one: 1}
    try
      getParam {one: [1]}, 'one', next, true
    catch e
      t.equal e.message, "too few values provided for key `one`"
    t.deepEqual next, {one: 1}

    next = {one: 2}
    try
      getParam {one: [1]}, 'one', next, true
    catch e
      t.equal e.message, "too few values provided for key `one`"
    t.deepEqual next, {one: 2}

    next = {one: 3}
    try
      getParam {one: [1, 2, 3]}, 'one', next, true
    catch e
      t.equal e.message, "too few values provided for key `one`"
    t.deepEqual next, {one: 3}

    t.end()
