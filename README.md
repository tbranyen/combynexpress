CombynExpress
-------------

[![Build Status](https://travis-ci.org/tbranyen/express-combyne.png?branch=master)](https://travis-ci.org/tbranyen/express-combyne)

Created by Tim Branyen [@tbranyen](http://twitter.com/tbranyen)

### Installing. ###

``` bash
npm install combynexpress
```

### Registering with Express. ###

``` javascript
app.engine("combyne", require("combynexpress"));
app.set("view engine", "combyne");
```

If you prefer a different extension (not `.combyne`) you can easily change:

``` javascript
app.engine("html", require("combynexpress"));
app.set("view engine", "html");
```

### Working with partials. ###

Within Express, all Combyne partials are mapped to views.  This allows you to
trivially load from a partials directory like:

``` html
{%partial partials/my-partial %}
```

This would then map to the customized views directory and load
**partials/my-partial** from there.

#### Registering global partials. ####

You can register global partials:

``` javascript
var combynExpress = require("combynexpress");

// Assign a basic partial.
combynExpress.registerPartial("global", {
  render: function() { return "global"; }
});
```

### Working with filters. ###

Within Express, all Combyne filters are mapped to files.  This allows you to
trivially load from a filters directory like:

``` html
{{ prop|my-filter }}
```

This will lazily require (non-blocking) the filter functions and register them
onto the template.  In the above example it would look for
**filters/my-filter.js** in the configured **views** directory.  You can change
the directory to search for templates in:

``` javascript
combynExpress.filtersDir = "some-other-folder";
```

#### Registering global filters. ####

You can register global filters:

``` javascript
var combynExpress = require("combynexpress");

// Assign a basic identity filter.
combynExpress.registerFilter("my-global-filter", function(value) {
  return value;
});
```
