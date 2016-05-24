test = require 'tape'
UrlPattern = require '../lib/url-pattern'

test 'invalid argument', (t) ->
  UrlPattern
  t.plan 5
  try
    new UrlPattern()
  catch e
    t.equal e.message, "argument must be a regex or a string"
  try
    new UrlPattern(5)
  catch e
    t.equal e.message, "argument must be a regex or a string"
  try
    new UrlPattern ''
  catch e
    t.equal e.message, "argument must not be the empty string"
  try
    new UrlPattern ' '
  catch e
    t.equal e.message, "argument must not contain whitespace"
  try
    new UrlPattern ' fo o'
  catch e
    t.equal e.message, "argument must not contain whitespace"
  t.end()

test 'invalid variable name in pattern', (t) ->
  UrlPattern
  t.plan 3
  try
    new UrlPattern ':'
  catch e
    t.equal e.message, "couldn't parse pattern"
  try
    new UrlPattern ':.'
  catch e
    t.equal e.message, "couldn't parse pattern"
  try
    new UrlPattern 'foo:.'
  catch e
    # TODO `:` must be followed by the name of the named segment consisting of at least one character in character set `a-zA-Z0-9` at 4
    t.equal e.message, "could only partially parse pattern"
  t.end()

test 'too many closing parentheses', (t) ->
  t.plan 2
  try
    new UrlPattern ')'
  catch e
    # TODO did not plan ) at 0
    t.equal e.message, "couldn't parse pattern"
  try
    new UrlPattern '((foo)))bar'
  catch e
    # TODO did not plan ) at 7
    t.equal e.message, "could only partially parse pattern"
  t.end()

test 'unclosed parentheses', (t) ->
  t.plan 2
  try
    new UrlPattern '('
  catch e
    # TODO unclosed parentheses at 1
    t.equal e.message, "couldn't parse pattern"
  try
    new UrlPattern '(((foo)bar(boo)far)'
  catch e
    # TODO unclosed parentheses at 19
    t.equal e.message, "couldn't parse pattern"
  t.end()

test 'regex names', (t) ->
  t.plan 3
  try
    new UrlPattern /x/, 5
  catch e
    t.equal e.message, 'if first argument is a regex the second argument may be an array of group names but you provided something else'
  try
    new UrlPattern /(((foo)bar(boo))far)/, []
  catch e
    t.equal e.message, "regex contains 4 groups but array of group names contains 0"
  try
    new UrlPattern /(((foo)bar(boo))far)/, ['a', 'b']
  catch e
    t.equal e.message, "regex contains 4 groups but array of group names contains 2"
  t.end()

test 'stringify regex', (t) ->
  t.plan 1
  pattern = new UrlPattern /x/
  try
    pattern.stringify()
  catch e
    t.equal e.message, "can't stringify patterns generated from a regex"
  t.end()

test 'stringify argument', (t) ->
  t.plan 1
  pattern = new UrlPattern 'foo'
  try
    pattern.stringify(5)
  catch e
    t.equal e.message, "argument must be an object or undefined"
  t.end()
