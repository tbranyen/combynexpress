Combyne support for Express
---------------------------

[![Build Status](https://travis-ci.org/tbranyen/express-combyne.png?branch=master)](https://travis-ci.org/tbranyen/express-combyne)

Created by Tim Branyen [@tbranyen](http://twitter.com/tbranyen)

### Installing. ###

``` bash
npm install express-combyne
```

### Registering with Express. ###

``` javascript
app.engine("combyne", require("express-combyne"));
app.set("view engine", "combyne");
```

If you prefer a different extension (not `.combyne`) you can easily change:

``` javascript
app.engine("html", require("express-combyne"));
app.set("view engine", "html");
```

### Working with partials. ###

Within Express, all Combyne partials are mapped to views.  This allows you to
trivially load from a partials directory like:

``` html
{%partial partials/my-partial %}
```

This would then map to the customized views directory and load from there.

### Working with filters. ###

Within Express, all Combyne filters are mapped to views.  This allows you to
trivially load from a partials directory like:

``` html
{%partial partials/my-partial %}
```

This would then map to the customized views directory and load from there.
