# changelog

#### 0.7

instead of

``` javascript
var urlPattern = require('url-pattern');
var pattern = urlPattern.newPattern('/example');
```

now use

``` javascript
var Pattern = require('url-pattern');
var pattern = new Pattern('/example');
```

#### 0.8

single wildcard matches are now saved directly as a
string on the `_` property and not as an array with 1 element:

``` javascript
> var pattern = new Pattern('/api/*');
> pattern.match('/api/users/5')
{_: 'users/5'}
```

if named segments occur more than once the results are collected in an array.

parsing of named segment names (`:foo`) and named segment values now
stops at the next non-alphanumeric character.
it is no longer needed to declare separators other than `/` explicitely.
it was previously necessary to use the second argument to `new UrlPattern` to
override the default separator `/`.
the second argument is now ignored.
mixing of separators is now possible (`/` and `.` in this example):

``` javascript
> var pattern = new UrlPattern('/v:major(.:minor)/*');

> pattern.match('/v1.2/');
{major: '1', minor: '2', _: ''}

> pattern.match('/v2/users');
{major: '2', _: 'users'}

> pattern.match('/v/');
null
```

#### 0.9

named segments now also match `-`, `_`, ` ` and `%`.

`\\` can now be used to escape characters.

[made all special chars and charsets used in parsing configurable.](https://github.com/snd/url-pattern#customize-the-pattern-syntax)

added [bower.json](bower.json) and registered with bower as `url-pattern`.

#### 0.10

[issue 15](https://github.com/snd/url-pattern/issues/15):  
named segments now also match the `~` character.  
**this will break your code if you relied on the fact that named segments
stop matching at `~` !**  
[you can customize the parsing to go back to the old behaviour](https://github.com/snd/url-pattern#customize-the-pattern-syntax)  

the way the parser is customized has changed.  
**this will break your code if you customized the parser !**  
[read me](https://github.com/snd/url-pattern#customize-the-pattern-syntax)  
updating your code is very easy.

[issue 14](https://github.com/snd/url-pattern/issues/14):  
[read me](https://github.com/snd/url-pattern#make-pattern-from-regex)  
non breaking

[issue 11](https://github.com/snd/url-pattern/issues/11):  
[read me](https://github.com/snd/url-pattern#stringify-patterns)  
non breaking

messages on errors thrown on invalid patterns have changed slightly.
