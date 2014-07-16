CombynExpress
-------------

> View engine support for [Combyne](https://github.com/tbranyen/combyne)

[![Build Status](https://travis-ci.org/tbranyen/combynexpress.png?branch=master)](https://travis-ci.org/tbranyen/combynexpress)

Created by Tim Branyen [@tbranyen](http://twitter.com/tbranyen)

### Installing. ###

``` bash
npm install combynexpress
```

### Requiring. ###

``` javascript
var combynExpress = require("combynexpress");
```

### Registering with Express. ###

``` javascript
app.engine("combyne", combynExpress());
app.set("view engine", "combyne");
```

If you prefer a different extension (not `.combyne`) you can easily change:

``` javascript
app.engine("html", combynExpress());
app.set("view engine", "html");
```

You can set certain options during the invocation by passing an object:

``` javsacript
app.engine("combyne", combynExpress({ filtersDir: "filterz" }));
app.set("view engine", "combyne");
```

### Changing Combyne settings. ###

You can change internal settings to Combyne through the exposed `settings`
property:

``` javascript
combynexpress.settings.delimiters = {};
```

### Working with partials. ###

Within Express, all Combyne partials are mapped to views.  This allows you to
trivially load from a partials directory like:

``` html
{%partial partials/my-partial %}
```

This would then map to the customized views directory and load
**partials/my-partial** from there.

#### Working with injected partials. ####

While using Express it's often desired to wrap a page template with a layout.

An example layout:

``` html
<body>{%partial body%}</body>
```

A page template that looks like this:

``` html
{%render layout as body%}
Hello world
{%endrender%}
```

This will automatically fetch the layout view and render the page template
within the body partial.

#### Registering global partials. ####

You can register global partials:

``` javascript
var combynExpress = require("combynexpress");

// Assign a basic partial.
combynExpress.registerPartial("global", {
  render: function() { return "global"; }
});
```

Global partial naming will override any local partials and not incur a
filesystem hit.

### Working with filters. ###

Within Express, all Combyne filters are mapped to files.  This allows you to
trivially load from a filters directory like:

``` html
{{ prop|my-filter }}
```

This will require the filter functions and register them onto the template.  In
the above example it would look for **filters/my-filter.js** in the configured
**views** directory.  You can change the directory to search for templates in:

``` javascript
combynExpress.settings.filtersDir = "some-other-folder";
```

#### Registering global filters. ####

You can register global filters:

``` javascript
// Assign a basic identity filter.
combynExpress.registerFilter("my-global-filter", function(value) {
  return value;
});
```

Global filter naming will override any local filters and not incur a filesystem
hit.
