# taken from
# https://github.com/snd/pcom/blob/master/t/url-pattern-example.coffee

test = require 'tape'

UrlPattern = require '../lib/url-pattern'
U = UrlPattern.newParser(UrlPattern.defaultOptions)
parse = U.pattern

test 'wildcard', (t) ->
  t.deepEqual U.wildcard('*'),
    value:
      tag: 'wildcard'
      value: '*'
    rest: ''
  t.deepEqual U.wildcard('*/'),
    value:
      tag: 'wildcard'
      value: '*'
    rest: '/'
  t.equal U.wildcard(' *'), undefined
  t.equal U.wildcard('()'), undefined
  t.equal U.wildcard('foo(100)'), undefined
  t.equal U.wildcard('(100foo)'), undefined
  t.equal U.wildcard('(foo100)'), undefined
  t.equal U.wildcard('(foobar)'), undefined
  t.equal U.wildcard('foobar'), undefined
  t.equal U.wildcard('_aa'), undefined
  t.equal U.wildcard('$foobar'), undefined
  t.equal U.wildcard('$'), undefined
  t.equal U.wildcard(''), undefined
  t.end()

test 'named', (t) ->
  t.deepEqual U.named(':a'),
    value:
      tag: 'named'
      value: 'a'
    rest: ''
  t.deepEqual U.named(':ab96c'),
    value:
      tag: 'named'
      value: 'ab96c'
    rest: ''
  t.deepEqual U.named(':ab96c.'),
    value:
      tag: 'named'
      value: 'ab96c'
    rest: '.'
  t.deepEqual U.named(':96c-:ab'),
    value:
      tag: 'named'
      value: '96c'
    rest: '-:ab'
  t.equal U.named(':'), undefined
  t.equal U.named(''), undefined
  t.equal U.named('a'), undefined
  t.equal U.named('abc'), undefined
  t.end()

test 'static', (t) ->
    t.deepEqual U.static('a'),
      value:
        tag: 'static'
        value: 'a'
      rest: ''
    t.deepEqual U.static('abc:d'),
      value:
        tag: 'static'
        value: 'abc'
      rest: ':d'
    t.equal U.static(':ab96c'), undefined
    t.equal U.static(':'), undefined
    t.equal U.static('('), undefined
    t.equal U.static(')'), undefined
    t.equal U.static('*'), undefined
    t.equal U.static(''), undefined
    t.end()


test 'fixtures', (t) ->
  t.equal parse(''), undefined
  t.equal parse('('), undefined
  t.equal parse(')'), undefined
  t.equal parse('()'), undefined
  t.equal parse(':'), undefined
  t.equal parse('((foo)'), undefined
  t.equal parse('(((foo)bar(boo)far)'), undefined

  t.deepEqual parse('(foo))'),
    rest: ')'
    value: [
      {tag: 'optional', value: [{tag: 'static', value: 'foo'}]}
    ]

  t.deepEqual parse('((foo)))bar'),
    rest: ')bar'
    value: [
      {
        tag: 'optional'
        value: [
          {tag: 'optional', value: [{tag: 'static', value: 'foo'}]}
        ]
      }
    ]


  t.deepEqual parse('foo:*'),
    rest: ':*'
    value: [
      {tag: 'static', value: 'foo'}
    ]

  t.deepEqual parse(':foo:bar'),
    rest: ''
    value: [
      {tag: 'named', value: 'foo'}
      {tag: 'named', value: 'bar'}
    ]

  t.deepEqual parse('a'),
    rest: ''
    value: [
      {tag: 'static', value: 'a'}
    ]
  t.deepEqual parse('user42'),
    rest: ''
    value: [
      {tag: 'static', value: 'user42'}
    ]
  t.deepEqual parse(':a'),
    rest: ''
    value: [
      {tag: 'named', value: 'a'}
    ]
  t.deepEqual parse('*'),
    rest: ''
    value: [
      {tag: 'wildcard', value: '*'}
    ]
  t.deepEqual parse('(foo)'),
    rest: ''
    value: [
      {tag: 'optional', value: [{tag: 'static', value: 'foo'}]}
    ]
  t.deepEqual parse('(:foo)'),
    rest: ''
    value: [
      {tag: 'optional', value: [{tag: 'named', value: 'foo'}]}
    ]
  t.deepEqual parse('(*)'),
    rest: ''
    value: [
      {tag: 'optional', value: [{tag: 'wildcard', value: '*'}]}
    ]


  t.deepEqual parse('/api/users/:id'),
    rest: ''
    value: [
      {tag: 'static', value: '/api/users/'}
      {tag: 'named', value: 'id'}
    ]
  t.deepEqual parse('/v:major(.:minor)/*'),
    rest: ''
    value: [
      {tag: 'static', value: '/v'}
      {tag: 'named', value: 'major'}
      {
        tag: 'optional'
        value: [
          {tag: 'static', value: '.'}
          {tag: 'named', value: 'minor'}
        ]
      }
      {tag: 'static', value: '/'}
      {tag: 'wildcard', value: '*'}
    ]
  t.deepEqual parse('(http(s)\\://)(:subdomain.):domain.:tld(/*)'),
    rest: ''
    value: [
      {
        tag: 'optional'
        value: [
          {tag: 'static', value: 'http'}
          {
            tag: 'optional'
            value: [
              {tag: 'static', value: 's'}
            ]
          }
          {tag: 'static', value: '://'}
        ]
      }
      {
        tag: 'optional'
        value: [
          {tag: 'named', value: 'subdomain'}
          {tag: 'static', value: '.'}
        ]
      }
      {tag: 'named', value: 'domain'}
      {tag: 'static', value: '.'}
      {tag: 'named', value: 'tld'}
      {
        tag: 'optional'
        value: [
          {tag: 'static', value: '/'}
          {tag: 'wildcard', value: '*'}
        ]
      }
    ]
  t.deepEqual parse('/api/users/:ids/posts/:ids'),
    rest: ''
    value: [
      {tag: 'static', value: '/api/users/'}
      {tag: 'named', value: 'ids'}
      {tag: 'static', value: '/posts/'}
      {tag: 'named', value: 'ids'}
    ]

  t.deepEqual parse('/user/:userId/task/:taskId'),
    rest: ''
    value: [
      {tag: 'static', value: '/user/'}
      {tag: 'named', value: 'userId'}
      {tag: 'static', value: '/task/'}
      {tag: 'named', value: 'taskId'}
    ]

  t.deepEqual parse('.user.:userId.task.:taskId'),
    rest: ''
    value: [
      {tag: 'static', value: '.user.'}
      {tag: 'named', value: 'userId'}
      {tag: 'static', value: '.task.'}
      {tag: 'named', value: 'taskId'}
    ]

  t.deepEqual parse('*/user/:userId'),
    rest: ''
    value: [
      {tag: 'wildcard', value: '*'}
      {tag: 'static', value: '/user/'}
      {tag: 'named', value: 'userId'}
    ]

  t.deepEqual parse('*-user-:userId'),
    rest: ''
    value: [
      {tag: 'wildcard', value: '*'}
      {tag: 'static', value: '-user-'}
      {tag: 'named', value: 'userId'}
    ]

  t.deepEqual parse('/admin*'),
    rest: ''
    value: [
      {tag: 'static', value: '/admin'}
      {tag: 'wildcard', value: '*'}
    ]

  t.deepEqual parse('#admin*'),
    rest: ''
    value: [
      {tag: 'static', value: '#admin'}
      {tag: 'wildcard', value: '*'}
    ]

  t.deepEqual parse('/admin/*/user/:userId'),
    rest: ''
    value: [
      {tag: 'static', value: '/admin/'}
      {tag: 'wildcard', value: '*'}
      {tag: 'static', value: '/user/'}
      {tag: 'named', value: 'userId'}
    ]

  t.deepEqual parse('$admin$*$user$:userId'),
    rest: ''
    value: [
      {tag: 'static', value: '$admin$'}
      {tag: 'wildcard', value: '*'}
      {tag: 'static', value: '$user$'}
      {tag: 'named', value: 'userId'}
    ]

  t.deepEqual parse('/admin/*/user/*/tail'),
    rest: ''
    value: [
      {tag: 'static', value: '/admin/'}
      {tag: 'wildcard', value: '*'}
      {tag: 'static', value: '/user/'}
      {tag: 'wildcard', value: '*'}
      {tag: 'static', value: '/tail'}
    ]

  t.deepEqual parse('/admin/*/user/:id/*/tail'),
    rest: ''
    value: [
      {tag: 'static', value: '/admin/'}
      {tag: 'wildcard', value: '*'}
      {tag: 'static', value: '/user/'}
      {tag: 'named', value: 'id'}
      {tag: 'static', value: '/'}
      {tag: 'wildcard', value: '*'}
      {tag: 'static', value: '/tail'}
    ]

  t.deepEqual parse('^admin^*^user^:id^*^tail'),
    rest: ''
    value: [
      {tag: 'static', value: '^admin^'}
      {tag: 'wildcard', value: '*'}
      {tag: 'static', value: '^user^'}
      {tag: 'named', value: 'id'}
      {tag: 'static', value: '^'}
      {tag: 'wildcard', value: '*'}
      {tag: 'static', value: '^tail'}
    ]

  t.deepEqual parse('/*/admin(/:path)'),
    rest: ''
    value: [
      {tag: 'static', value: '/'}
      {tag: 'wildcard', value: '*'}
      {tag: 'static', value: '/admin'}
      {tag: 'optional', value: [
        {tag: 'static', value: '/'}
        {tag: 'named', value: 'path'}
      ]}
    ]

  t.deepEqual parse('/'),
    rest: ''
    value: [
      {tag: 'static', value: '/'}
    ]

  t.deepEqual parse('(/)'),
    rest: ''
    value: [
      {tag: 'optional', value: [
        {tag: 'static', value: '/'}
      ]}
    ]

  t.deepEqual parse('/admin(/:foo)/bar'),
    rest: ''
    value: [
      {tag: 'static', value: '/admin'}
      {tag: 'optional', value: [
        {tag: 'static', value: '/'}
        {tag: 'named', value: 'foo'}
      ]}
      {tag: 'static', value: '/bar'}
    ]

  t.deepEqual parse('/admin(*/)foo'),
    rest: ''
    value: [
      {tag: 'static', value: '/admin'}
      {tag: 'optional', value: [
        {tag: 'wildcard', value: '*'}
        {tag: 'static', value: '/'}
      ]}
      {tag: 'static', value: 'foo'}
    ]

  t.deepEqual parse('/v:major.:minor/*'),
    rest: ''
    value: [
      {tag: 'static', value: '/v'}
      {tag: 'named', value: 'major'}
      {tag: 'static', value: '.'}
      {tag: 'named', value: 'minor'}
      {tag: 'static', value: '/'}
      {tag: 'wildcard', value: '*'}
    ]

  t.deepEqual parse('/v:v.:v/*'),
    rest: ''
    value: [
      {tag: 'static', value: '/v'}
      {tag: 'named', value: 'v'}
      {tag: 'static', value: '.'}
      {tag: 'named', value: 'v'}
      {tag: 'static', value: '/'}
      {tag: 'wildcard', value: '*'}
    ]

  t.deepEqual parse('/:foo_bar'),
    rest: ''
    value: [
      {tag: 'static', value: '/'}
      {tag: 'named', value: 'foo'}
      {tag: 'static', value: '_bar'}
    ]

  t.deepEqual parse('((((a)b)c)d)'),
    rest: ''
    value: [
      {tag: 'optional', value: [
        {tag: 'optional', value: [
          {tag: 'optional', value: [
            {tag: 'optional', value: [
              {tag: 'static', value: 'a'}
            ]}
            {tag: 'static', value: 'b'}
          ]}
          {tag: 'static', value: 'c'}
        ]}
        {tag: 'static', value: 'd'}
      ]}
    ]

  t.deepEqual parse('/vvv:version/*'),
    rest: ''
    value: [
      {tag: 'static', value: '/vvv'}
      {tag: 'named', value: 'version'}
      {tag: 'static', value: '/'}
      {tag: 'wildcard', value: '*'}
    ]

  t.end()
