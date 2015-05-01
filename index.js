const fs = require("fs");
const path = require("path");
const combyne = require("combyne");
const async = require("async");
const visitCombyne = require("visit-combyne");

// Proxy the settings from the internal combyne object
var settings = combyne.settings;

// Mimic how the actual Combyne stores.
settings._filters = {};
settings._partials = {};

// Proxy the filter and partial registration methods.
settings.registerFilter = combyne.prototype.registerFilter;
settings.registerPartial = combyne.prototype.registerPartial;

/**
 * Processes a template, finding all its filters and nested partials.
 *
 * @param {string} fileName - The filename of the template.
 * @param {Object} data - Data to render with.
 * @param {Function} next - The next continuation.
 */
function processTemplate(fileName, data, next, noParse) {
  var route = this;
  var dirname = this.root;
  var ext = path.extname(fileName);

  // Read in the template name as a buffer.
  fs.readFile(fileName, "utf8", function(err, buffer) {
    // Pass up any errors.
    if (err) {
      return next(err);
    }

    // Send back the compiled template.
    var template = combyne(String(buffer));

    // Find all extend.
    var extend = visitCombyne(template.tree.nodes, function(node) {
      return node.type === "ExtendExpression";
    }).map(function(node) { return node.value; });

    // Find all partials.
    var partials = visitCombyne(template.tree.nodes, function(node) {
      return node.type === "PartialExpression" && noParse !== node.value;
    }).map(function(node) { return node.value; });

    // Find all filters.
    var filters = visitCombyne(template.tree.nodes, function(node) {
      return node.filters && node.filters.length;
    }).map(function(node) {
      return node.filters.map(function(filter) {
        return filter.value;
      }).join(" ");
    });

    // Flatten the array.
    if (filters.length) {
      filters = filters.join(" ").split(" ");
    }

    // Map all extend to functions.
    extend = extend.map(function(render) {
      return function(callback) {
        var name = render.template;
        var renderPath = path.join(dirname, name + ext);

        // The last argument of this call is the noparse option that specifies
        // the virtual partial should not be loaded.
        processTemplate.call(route, renderPath, data, function(err, render) {
          if (err) { return callback(err); }

          template.registerPartial(name, render);
          callback(err, template);
        }, render.partial);
      };
    });

    // Map all partials to functions.
    partials = partials.map(function(name) {
      return function(callback) {
        // Ignore those that have already been defined globally.
        if (name in settings._partials) {
          return callback();
        }

        var partialPath = path.join(dirname, name + ext);

        processTemplate.call(route, partialPath, data, function(err, partial) {
          if (err) { return callback(err); }

          template.registerPartial(name, partial);
          settings._partials[name] = partial;
          callback(err, template);
        });
      };
    });

    // Map all filters to functions.
    filters = filters.map(function(name) {
      // Filters cannot be so easily inferred location-wise, so assume they are
      // preconfigured or exist in a filters directory.
      return function(callback) {
        var filtersDir = settings.filtersDir || "filters";
        var filtersPath = path.join(dirname, filtersDir, name + ".js");

        // Ignore those that have already been defined globally.
        if (name in settings._filters) {
          return callback();
        }

        try {
          var filter = require(filtersPath);

          // Register the exported function.
          settings._filters[name] = filter;
        }
        catch (ex) {
          return callback(ex);
        }

        callback(null, filter);
      };
    });

    // Find all files and map the partials.
    async.parallel(partials.concat(extend, filters), function(err) {
      if (err) { return next(err); }

      // Register all the global partials.
      Object.keys(settings._partials).forEach(function(name) {
        var partial = settings._partials[name];
        template.registerPartial(name, partial);
      });

      // Register all the global filters.
      Object.keys(settings._filters).forEach(function(name) {
        var filter = settings._filters[name];
        template.registerFilter(name, filter);
      });

      // Render the template.
      next(err, template);
    });
  });
}

/**
 * Express support.
 *
 * @param {string} fileName - The template path to load.
 * @param {object} data - The data to render.
 * @param {function} next - The continuation function.
 */
settings.__express = function(fileName, data, next) {
  processTemplate.call(this, fileName, data, function(err, template) {
    if (err) { return next(err); }

    // Render the top level template with context data.
    next(null, template.render(data));
  });
};

// Expose configuration express settings.
module.exports = function(options) {
  settings.__proto__ = options;
  return settings.__express;
};

// Ensure settings is accessible.
module.exports.settings = settings;

module.exports.registerFilter = settings.registerFilter.bind(settings);
module.exports.registerPartial = settings.registerPartial.bind(settings);

module.exports.VERSION = require("./package.json").version;
