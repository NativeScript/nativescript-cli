((root, factory) ->
  # AMD
  if ('function' is typeof define) and define.amd?
    define([], factory)
  # CommonJS
  else if exports?
    module.exports = factory()
  # browser globals
  else
    root.UrlPattern = factory()
)(this, ->

################################################################################
# helpers

  # source: http://stackoverflow.com/a/3561711
  escapeForRegex = (string) ->
    string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')

  concatMap = (array, f) ->
    results = []
    i = -1
    length = array.length
    while ++i < length
      results = results.concat f(array[i])
    return results

  stringConcatMap = (array, f) ->
    result = ''
    i = -1
    length = array.length
    while ++i < length
      result += f(array[i])
    return result

  # source: http://stackoverflow.com/a/16047223
  regexGroupCount = (regex) ->
    (new RegExp(regex.toString() + '|')).exec('').length - 1

  keysAndValuesToObject = (keys, values) ->
    object = {}
    i = -1
    length = keys.length
    while ++i < length
      key = keys[i]
      value = values[i]
      unless value?
        continue
      # key already encountered
      if object[key]?
        # capture multiple values for same key in an array
        unless Array.isArray object[key]
          object[key] = [object[key]]
        object[key].push value
      else
        object[key] = value
    return object

################################################################################
# parser combinators
# subset copied from
# https://github.com/snd/pcom/blob/master/src/pcom.coffee
# (where they are tested !)
# to keep this at zero dependencies and small filesize

  P = {}

  P.Result = (value, rest) ->
    this.value = value
    this.rest = rest
    return

  P.Tagged = (tag, value) ->
    this.tag = tag
    this.value = value
    return

  P.tag = (tag, parser) ->
    (input) ->
      result = parser input
      unless result?
        return
      tagged = new P.Tagged tag, result.value
      return new P.Result tagged, result.rest

  P.regex = (regex) ->
    # unless regex instanceof RegExp
    #   throw new Error 'argument must be instanceof RegExp'
    (input) ->
      matches = regex.exec input
      unless matches?
        return
      result = matches[0]
      return new P.Result result, input.slice(result.length)

  P.sequence = (parsers...) ->
    (input) ->
      i = -1
      length = parsers.length
      values = []
      rest = input
      while ++i < length
        parser = parsers[i]
        # unless 'function' is typeof parser
        #   throw new Error "parser passed at index `#{i}` into `sequence` is not of type `function` but of type `#{typeof parser}`"
        result = parser rest
        unless result?
          return
        values.push result.value
        rest = result.rest
      return new P.Result values, rest

  P.pick = (indexes, parsers...) ->
    (input) ->
      result = P.sequence(parsers...)(input)
      unless result?
        return
      array = result.value
      result.value = array[indexes]
      # unless Array.isArray indexes
      #   result.value = array[indexes]
      # else
      #   result.value = []
      #   indexes.forEach (i) ->
      #     result.value.push array[i]
      return result

  P.string = (string) ->
    length = string.length
    # if length is 0
    #   throw new Error '`string` must not be blank'
    (input) ->
      if input.slice(0, length) is string
        return new P.Result string, input.slice(length)

  P.lazy = (fn) ->
    cached = null
    (input) ->
      unless cached?
        cached = fn()
      return cached input

  P.baseMany = (parser, end, stringResult, atLeastOneResultRequired, input) ->
    rest = input
    results = if stringResult then '' else []
    while true
      if end?
        endResult = end rest
        if endResult?
          break
      parserResult = parser rest
      unless parserResult?
        break
      if stringResult
        results += parserResult.value
      else
        results.push parserResult.value
      rest = parserResult.rest

    if atLeastOneResultRequired and results.length is 0
      return

    return new P.Result results, rest

  P.many1 = (parser) ->
    (input) ->
      P.baseMany parser, null, false, true, input

  P.concatMany1Till = (parser, end) ->
    (input) ->
      P.baseMany parser, end, true, true, input

  P.firstChoice = (parsers...) ->
    (input) ->
      i = -1
      length = parsers.length
      while ++i < length
        parser = parsers[i]
        # unless 'function' is typeof parser
        #   throw new Error "parser passed at index `#{i}` into `firstChoice` is not of type `function` but of type `#{typeof parser}`"
        result = parser input
        if result?
          return result
      return

################################################################################
# url pattern parser
# copied from
# https://github.com/snd/pcom/blob/master/src/url-pattern-example.coffee

  newParser = (options) ->
    U = {}

    U.wildcard = P.tag 'wildcard', P.string(options.wildcardChar)

    U.optional = P.tag(
      'optional'
      P.pick(1,
        P.string(options.optionalSegmentStartChar)
        P.lazy(-> U.pattern)
        P.string(options.optionalSegmentEndChar)
      )
    )

    U.name = P.regex new RegExp "^[#{options.segmentNameCharset}]+"

    U.named = P.tag(
      'named',
      P.pick(1,
        P.string(options.segmentNameStartChar)
        P.lazy(-> U.name)
      )
    )

    U.escapedChar = P.pick(1,
      P.string(options.escapeChar)
      P.regex(/^./)
    )

    U.static = P.tag(
      'static'
      P.concatMany1Till(
        P.firstChoice(
          P.lazy(-> U.escapedChar)
          P.regex(/^./)
        )
        P.firstChoice(
          P.string(options.segmentNameStartChar)
          P.string(options.optionalSegmentStartChar)
          P.string(options.optionalSegmentEndChar)
          U.wildcard
        )
      )
    )

    U.token = P.lazy ->
      P.firstChoice(
        U.wildcard
        U.optional
        U.named
        U.static
      )

    U.pattern = P.many1 P.lazy(-> U.token)

    return U

################################################################################
# options

  defaultOptions =
    escapeChar: '\\'
    segmentNameStartChar: ':'
    segmentValueCharset: 'a-zA-Z0-9-_~ %'
    segmentNameCharset: 'a-zA-Z0-9'
    optionalSegmentStartChar: '('
    optionalSegmentEndChar: ')'
    wildcardChar: '*'

################################################################################
# functions that further process ASTs returned as `.value` in parser results

  baseAstNodeToRegexString = (astNode, segmentValueCharset) ->
    if Array.isArray astNode
      return stringConcatMap astNode, (node) ->
        baseAstNodeToRegexString(node, segmentValueCharset)

    switch astNode.tag
      when 'wildcard' then '(.*?)'
      when 'named' then "([#{segmentValueCharset}]+)"
      when 'static' then escapeForRegex(astNode.value)
      when 'optional'
        '(?:' + baseAstNodeToRegexString(astNode.value, segmentValueCharset) + ')?'

  astNodeToRegexString = (astNode, segmentValueCharset = defaultOptions.segmentValueCharset) ->
    '^' + baseAstNodeToRegexString(astNode, segmentValueCharset) + '$'

  astNodeToNames = (astNode) ->
    if Array.isArray astNode
      return concatMap astNode, astNodeToNames

    switch astNode.tag
      when 'wildcard' then ['_']
      when 'named' then [astNode.value]
      when 'static' then []
      when 'optional' then astNodeToNames(astNode.value)

  getParam = (params, key, nextIndexes, sideEffects = false) ->
    value = params[key]
    unless value?
      if sideEffects
        throw new Error "no values provided for key `#{key}`"
      else
        return
    index = nextIndexes[key] or 0
    maxIndex = if Array.isArray value then value.length - 1 else 0
    if index > maxIndex
      if sideEffects
        throw new Error "too few values provided for key `#{key}`"
      else
        return

    result = if Array.isArray value then value[index] else value

    if sideEffects
      nextIndexes[key] = index + 1

    return result

  astNodeContainsSegmentsForProvidedParams = (astNode, params, nextIndexes) ->
    if Array.isArray astNode
      i = -1
      length = astNode.length
      while ++i < length
        if astNodeContainsSegmentsForProvidedParams astNode[i], params, nextIndexes
          return true
      return false

    switch astNode.tag
      when 'wildcard' then getParam(params, '_', nextIndexes, false)?
      when 'named' then getParam(params, astNode.value, nextIndexes, false)?
      when 'static' then false
      when 'optional'
        astNodeContainsSegmentsForProvidedParams astNode.value, params, nextIndexes

  stringify = (astNode, params, nextIndexes) ->
    if Array.isArray astNode
      return stringConcatMap astNode, (node) ->
        stringify node, params, nextIndexes

    switch astNode.tag
      when 'wildcard' then getParam params, '_', nextIndexes, true
      when 'named' then getParam params, astNode.value, nextIndexes, true
      when 'static' then astNode.value
      when 'optional'
        if astNodeContainsSegmentsForProvidedParams astNode.value, params, nextIndexes
          stringify astNode.value, params, nextIndexes
        else
          ''

################################################################################
# UrlPattern

  UrlPattern = (arg1, arg2) ->
    # self awareness
    if arg1 instanceof UrlPattern
      @isRegex = arg1.isRegex
      @regex = arg1.regex
      @ast = arg1.ast
      @names = arg1.names
      return

    @isRegex = arg1 instanceof RegExp

    unless ('string' is typeof arg1) or @isRegex
      throw new TypeError 'argument must be a regex or a string'

    # regex

    if @isRegex
      @regex = arg1
      if arg2?
        unless Array.isArray arg2
          throw new Error 'if first argument is a regex the second argument may be an array of group names but you provided something else'
        groupCount = regexGroupCount @regex
        unless arg2.length is groupCount
          throw new Error "regex contains #{groupCount} groups but array of group names contains #{arg2.length}"
        @names = arg2
      return

    # string pattern

    if arg1 is ''
      throw new Error 'argument must not be the empty string'
    withoutWhitespace = arg1.replace(/\s+/g, '')
    unless withoutWhitespace is arg1
      throw new Error 'argument must not contain whitespace'

    options =
      escapeChar: arg2?.escapeChar or defaultOptions.escapeChar
      segmentNameStartChar: arg2?.segmentNameStartChar or defaultOptions.segmentNameStartChar
      segmentNameCharset: arg2?.segmentNameCharset or defaultOptions.segmentNameCharset
      segmentValueCharset: arg2?.segmentValueCharset or defaultOptions.segmentValueCharset
      optionalSegmentStartChar: arg2?.optionalSegmentStartChar or defaultOptions.optionalSegmentStartChar
      optionalSegmentEndChar: arg2?.optionalSegmentEndChar or defaultOptions.optionalSegmentEndChar
      wildcardChar: arg2?.wildcardChar or defaultOptions.wildcardChar

    parser = newParser options
    parsed = parser.pattern arg1
    unless parsed?
      # TODO better error message
      throw new Error "couldn't parse pattern"
    if parsed.rest isnt ''
      # TODO better error message
      throw new Error "could only partially parse pattern"
    @ast = parsed.value

    @regex = new RegExp astNodeToRegexString @ast, options.segmentValueCharset
    @names = astNodeToNames @ast

    return

  UrlPattern.prototype.match = (url) ->
    match = @regex.exec url
    unless match?
      return null

    groups = match.slice(1)
    if @names
      keysAndValuesToObject @names, groups
    else
      groups

  UrlPattern.prototype.stringify = (params = {}) ->
    if @isRegex
      throw new Error "can't stringify patterns generated from a regex"
    unless params is Object(params)
      throw new Error "argument must be an object or undefined"
    stringify @ast, params, {}

################################################################################
# exports

  # helpers
  UrlPattern.escapeForRegex = escapeForRegex
  UrlPattern.concatMap = concatMap
  UrlPattern.stringConcatMap = stringConcatMap
  UrlPattern.regexGroupCount = regexGroupCount
  UrlPattern.keysAndValuesToObject = keysAndValuesToObject

  # parsers
  UrlPattern.P = P
  UrlPattern.newParser = newParser
  UrlPattern.defaultOptions = defaultOptions

  # ast
  UrlPattern.astNodeToRegexString = astNodeToRegexString
  UrlPattern.astNodeToNames = astNodeToNames
  UrlPattern.getParam = getParam
  UrlPattern.astNodeContainsSegmentsForProvidedParams = astNodeContainsSegmentsForProvidedParams
  UrlPattern.stringify = stringify

  return UrlPattern
)
