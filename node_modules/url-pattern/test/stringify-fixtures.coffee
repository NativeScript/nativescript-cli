test = require 'tape'
UrlPattern = require '../lib/url-pattern'

test 'stringify', (t) ->
  pattern = new UrlPattern '/foo'
  t.equal '/foo', pattern.stringify()

  pattern = new UrlPattern '/user/:userId/task/:taskId'
  t.equal '/user/10/task/52', pattern.stringify
    userId: '10'
    taskId: '52'

  pattern = new UrlPattern '.user.:userId.task.:taskId'
  t.equal '.user.10.task.52', pattern.stringify
    userId: '10'
    taskId: '52'

  pattern = new UrlPattern '*/user/:userId'
  t.equal '/school/10/user/10', pattern.stringify
    _: '/school/10',
    userId: '10'

  pattern = new UrlPattern '*-user-:userId'
  t.equal '-school-10-user-10', pattern.stringify
    _: '-school-10'
    userId: '10'

  pattern = new UrlPattern '/admin*'
  t.equal '/admin/school/10/user/10', pattern.stringify
    _: '/school/10/user/10'

  pattern = new UrlPattern '/admin/*/user/*/tail'
  t.equal '/admin/school/10/user/10/12/tail', pattern.stringify
    _: ['school/10', '10/12']

  pattern = new UrlPattern '/admin/*/user/:id/*/tail'
  t.equal '/admin/school/10/user/10/12/13/tail', pattern.stringify
    _: ['school/10', '12/13']
    id: '10'

  pattern = new UrlPattern '/*/admin(/:path)'
  t.equal '/foo/admin/baz', pattern.stringify
    _: 'foo'
    path: 'baz'
  t.equal '/foo/admin', pattern.stringify
    _: 'foo'

  pattern = new UrlPattern '(/)'
  t.equal '', pattern.stringify()

  pattern = new UrlPattern '/admin(/foo)/bar'
  t.equal '/admin/bar', pattern.stringify()

  pattern = new UrlPattern '/admin(/:foo)/bar'
  t.equal '/admin/bar', pattern.stringify()
  t.equal '/admin/baz/bar', pattern.stringify
    foo: 'baz'

  pattern = new UrlPattern '/admin/(*/)foo'
  t.equal '/admin/foo', pattern.stringify()
  t.equal '/admin/baz/bar/biff/foo', pattern.stringify
    _: 'baz/bar/biff'

  pattern = new UrlPattern '/v:major.:minor/*'
  t.equal '/v1.2/resource/', pattern.stringify
    _: 'resource/'
    major: '1'
    minor: '2'

  pattern = new UrlPattern '/v:v.:v/*'
  t.equal '/v1.2/resource/', pattern.stringify
    _: 'resource/'
    v: ['1', '2']

  pattern = new UrlPattern '/:foo_bar'
  t.equal '/a_bar', pattern.stringify
    foo: 'a'
  t.equal '/a__bar', pattern.stringify
    foo: 'a_'
  t.equal '/a-b-c-d__bar', pattern.stringify
    foo: 'a-b-c-d_'
  t.equal '/a b%c-d__bar', pattern.stringify
    foo: 'a b%c-d_'

  pattern = new UrlPattern '((((a)b)c)d)'
  t.equal '', pattern.stringify()

  pattern = new UrlPattern '(:a-)1-:b(-2-:c-3-:d(-4-*-:a))'
  t.equal '1-B', pattern.stringify
    b: 'B'
  t.equal 'A-1-B', pattern.stringify
    a: 'A'
    b: 'B'
  t.equal 'A-1-B', pattern.stringify
    a: 'A'
    b: 'B'
  t.equal 'A-1-B-2-C-3-D', pattern.stringify
    a: 'A'
    b: 'B'
    c: 'C'
    d: 'D'
  t.equal 'A-1-B-2-C-3-D-4-E-F', pattern.stringify
    a: ['A', 'F']
    b: 'B'
    c: 'C'
    d: 'D'
    _: 'E'

  pattern = new UrlPattern '/user/:range'
  t.equal '/user/10-20', pattern.stringify
    range: '10-20'

  t.end()

test 'stringify errors', (t) ->
  t.plan 5

  pattern = new UrlPattern '(:a-)1-:b(-2-:c-3-:d(-4-*-:a))'

  try
    pattern.stringify()
  catch e
    t.equal e.message, "no values provided for key `b`"
  try
    pattern.stringify
      a: 'A'
      b: 'B'
      c: 'C'
  catch e
    t.equal e.message, "no values provided for key `d`"
  try
    pattern.stringify
      a: 'A'
      b: 'B'
      d: 'D'
  catch e
    t.equal e.message, "no values provided for key `c`"
  try
    pattern.stringify
      a: 'A'
      b: 'B'
      c: 'C'
      d: 'D'
      _: 'E'
  catch e
    t.equal e.message, "too few values provided for key `a`"
  try
    pattern.stringify
      a: ['A', 'F']
      b: 'B'
      c: 'C'
      d: 'D'
  catch e
    t.equal e.message, "no values provided for key `_`"

  t.end()
