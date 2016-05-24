test = require 'tape'
UrlPattern = require '../lib/url-pattern'

test 'match', (t) ->
  pattern = new UrlPattern '/foo'
  t.deepEqual pattern.match('/foo'), {}

  pattern = new UrlPattern '.foo'
  t.deepEqual pattern.match('.foo'), {}

  pattern = new UrlPattern '/foo'
  t.equals pattern.match('/foobar'), null

  pattern = new UrlPattern '.foo'
  t.equals pattern.match('.foobar'), null

  pattern = new UrlPattern '/foo'
  t.equals pattern.match('/bar/foo'), null

  pattern = new UrlPattern '.foo'
  t.equals pattern.match('.bar.foo'), null

  pattern = new UrlPattern /foo/
  t.deepEqual pattern.match('foo'), []

  pattern = new UrlPattern /\/foo\/(.*)/
  t.deepEqual pattern.match('/foo/bar'), ['bar']

  pattern = new UrlPattern /\/foo\/(.*)/
  t.deepEqual pattern.match('/foo/'), ['']

  pattern = new UrlPattern '/user/:userId/task/:taskId'
  t.deepEqual pattern.match('/user/10/task/52'),
    userId: '10'
    taskId: '52'

  pattern = new UrlPattern '.user.:userId.task.:taskId'
  t.deepEqual pattern.match('.user.10.task.52'),
    userId: '10'
    taskId: '52'

  pattern = new UrlPattern '*/user/:userId'
  t.deepEqual pattern.match('/school/10/user/10'),
    _: '/school/10',
    userId: '10'

  pattern = new UrlPattern '*-user-:userId'
  t.deepEqual pattern.match('-school-10-user-10'),
    _: '-school-10'
    userId: '10'

  pattern = new UrlPattern '/admin*'
  t.deepEqual pattern.match('/admin/school/10/user/10'),
    _: '/school/10/user/10'

  pattern = new UrlPattern '#admin*'
  t.deepEqual pattern.match('#admin#school#10#user#10'),
    _: '#school#10#user#10'

  pattern = new UrlPattern '/admin/*/user/:userId'
  t.deepEqual pattern.match('/admin/school/10/user/10'),
    _: 'school/10',
    userId: '10'

  pattern = new UrlPattern '$admin$*$user$:userId'
  t.deepEqual pattern.match('$admin$school$10$user$10'),
    _: 'school$10'
    userId: '10'

  pattern = new UrlPattern '/admin/*/user/*/tail'
  t.deepEqual pattern.match('/admin/school/10/user/10/12/tail'),
    _: ['school/10', '10/12']

  pattern = new UrlPattern '$admin$*$user$*$tail'
  t.deepEqual pattern.match('$admin$school$10$user$10$12$tail'),
    _: ['school$10', '10$12']

  pattern = new UrlPattern '/admin/*/user/:id/*/tail'
  t.deepEqual pattern.match('/admin/school/10/user/10/12/13/tail'),
    _: ['school/10', '12/13']
    id: '10'

  pattern = new UrlPattern '^admin^*^user^:id^*^tail'
  t.deepEqual pattern.match('^admin^school^10^user^10^12^13^tail'),
    _: ['school^10', '12^13']
    id: '10'

  pattern = new UrlPattern '/*/admin(/:path)'
  t.deepEqual pattern.match('/admin/admin/admin'),
    _: 'admin'
    path: 'admin'

  pattern = new UrlPattern '(/)'
  t.deepEqual pattern.match(''), {}
  t.deepEqual pattern.match('/'), {}

  pattern = new UrlPattern '/admin(/foo)/bar'
  t.deepEqual pattern.match('/admin/foo/bar'), {}
  t.deepEqual pattern.match('/admin/bar'), {}

  pattern = new UrlPattern '/admin(/:foo)/bar'
  t.deepEqual pattern.match('/admin/baz/bar'),
    foo: 'baz'
  t.deepEqual pattern.match('/admin/bar'), {}

  pattern = new UrlPattern '/admin/(*/)foo'
  t.deepEqual pattern.match('/admin/foo'), {}
  t.deepEqual pattern.match('/admin/baz/bar/biff/foo'),
    _: 'baz/bar/biff'

  pattern = new UrlPattern '/v:major.:minor/*'
  t.deepEqual pattern.match('/v1.2/resource/'),
    _: 'resource/'
    major: '1'
    minor: '2'

  pattern = new UrlPattern '/v:v.:v/*'
  t.deepEqual pattern.match('/v1.2/resource/'),
    _: 'resource/'
    v: ['1', '2']

  pattern = new UrlPattern '/:foo_bar'
  t.equal pattern.match('/_bar'), null
  t.deepEqual pattern.match('/a_bar'),
    foo: 'a'
  t.deepEqual pattern.match('/a__bar'),
    foo: 'a_'
  t.deepEqual pattern.match('/a-b-c-d__bar'),
    foo: 'a-b-c-d_'
  t.deepEqual pattern.match('/a b%c-d__bar'),
    foo: 'a b%c-d_'

  pattern = new UrlPattern '((((a)b)c)d)'
  t.deepEqual pattern.match(''), {}
  t.equal pattern.match('a'), null
  t.equal pattern.match('ab'), null
  t.equal pattern.match('abc'), null
  t.deepEqual pattern.match('abcd'), {}
  t.deepEqual pattern.match('bcd'), {}
  t.deepEqual pattern.match('cd'), {}
  t.deepEqual pattern.match('d'), {}

  pattern = new UrlPattern '/user/:range'
  t.deepEqual pattern.match('/user/10-20'),
    range: '10-20'

  pattern = new UrlPattern '/user/:range'
  t.deepEqual pattern.match('/user/10_20'),
    range: '10_20'

  pattern = new UrlPattern '/user/:range'
  t.deepEqual pattern.match('/user/10 20'),
    range: '10 20'

  pattern = new UrlPattern '/user/:range'
  t.deepEqual pattern.match('/user/10%20'),
    range: '10%20'

  pattern = new UrlPattern '/vvv:version/*'
  t.equal null, pattern.match('/vvv/resource')
  t.deepEqual pattern.match('/vvv1/resource'),
    _: 'resource'
    version: '1'
  t.equal null, pattern.match('/vvv1.1/resource')

  pattern = new UrlPattern '/api/users/:id',
    segmentValueCharset: 'a-zA-Z0-9-_~ %.@'
  t.deepEqual pattern.match('/api/users/someuser@example.com'),
    id: 'someuser@example.com'

  pattern = new UrlPattern '/api/users?username=:username',
    segmentValueCharset: 'a-zA-Z0-9-_~ %.@'
  t.deepEqual pattern.match('/api/users?username=someone@example.com'),
    username: 'someone@example.com'

  pattern = new UrlPattern '/api/users?param1=:param1&param2=:param2'
  t.deepEqual pattern.match('/api/users?param1=foo&param2=bar'),
    param1: 'foo'
    param2: 'bar'

  pattern = new UrlPattern ':scheme\\://:host(\\::port)',
    segmentValueCharset: 'a-zA-Z0-9-_~ %.'
  t.deepEqual pattern.match('ftp://ftp.example.com'),
    scheme: 'ftp'
    host: 'ftp.example.com'
  t.deepEqual pattern.match('ftp://ftp.example.com:8080'),
    scheme: 'ftp'
    host: 'ftp.example.com'
    port: '8080'
  t.deepEqual pattern.match('https://example.com:80'),
    scheme: 'https'
    host: 'example.com'
    port: '80'

  pattern = new UrlPattern ':scheme\\://:host(\\::port)(/api(/:resource(/:id)))',
    segmentValueCharset: 'a-zA-Z0-9-_~ %.@'
  t.deepEqual pattern.match('https://sss.www.localhost.com'),
    scheme: 'https'
    host: 'sss.www.localhost.com'
  t.deepEqual pattern.match('https://sss.www.localhost.com:8080'),
    scheme: 'https'
    host: 'sss.www.localhost.com'
    port: '8080'
  t.deepEqual pattern.match('https://sss.www.localhost.com/api'),
    scheme: 'https'
    host: 'sss.www.localhost.com'
  t.deepEqual pattern.match('https://sss.www.localhost.com/api/security'),
    scheme: 'https'
    host: 'sss.www.localhost.com'
    resource: 'security'
  t.deepEqual pattern.match('https://sss.www.localhost.com/api/security/bob@example.com'),
    scheme: 'https'
    host: 'sss.www.localhost.com'
    resource: 'security'
    id: 'bob@example.com'

  regex = /\/ip\/(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
  pattern = new UrlPattern regex
  t.equal null, pattern.match('10.10.10.10')
  t.equal null, pattern.match('ip/10.10.10.10')
  t.equal null, pattern.match('/ip/10.10.10.')
  t.equal null, pattern.match('/ip/10.')
  t.equal null, pattern.match('/ip/')
  t.deepEqual pattern.match('/ip/10.10.10.10'), ['10', '10', '10', '10']
  t.deepEqual pattern.match('/ip/127.0.0.1'), ['127', '0', '0', '1']

  regex = /\/ip\/((?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?))$/
  pattern = new UrlPattern regex
  t.equal null, pattern.match('10.10.10.10')
  t.equal null, pattern.match('ip/10.10.10.10')
  t.equal null, pattern.match('/ip/10.10.10.')
  t.equal null, pattern.match('/ip/10.')
  t.equal null, pattern.match('/ip/')
  t.deepEqual pattern.match('/ip/10.10.10.10'), ['10.10.10.10']
  t.deepEqual pattern.match('/ip/127.0.0.1'), ['127.0.0.1']

  regex = /\/ip\/((?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?))$/
  pattern = new UrlPattern regex, ['ip']
  t.equal null, pattern.match('10.10.10.10')
  t.equal null, pattern.match('ip/10.10.10.10')
  t.equal null, pattern.match('/ip/10.10.10.')
  t.equal null, pattern.match('/ip/10.')
  t.equal null, pattern.match('/ip/')
  t.deepEqual pattern.match('/ip/10.10.10.10'),
    ip: '10.10.10.10'
  t.deepEqual pattern.match('/ip/127.0.0.1'),
    ip: '127.0.0.1'

  t.end()
