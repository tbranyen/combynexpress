const fs = require("fs");
const path = require("path");
const combyne = require("combyne");
const async = require("async");

// Proxy the settings from the internal combyne object
var settings = combyne.settings;

// Mimic how the actual Combyne stores.
settings._filters = {};
settings._partials = {};

// Proxy the filter and partial registration methods.
settings.registerFilter = combyne.prototype.registerFilter;
settings.registerPartial = combyne.prototype.registerPartial;

/**
 * Recursively traverses nodes returning those passing the truth function.
 *
 * @private
 * @param {array} nodes
 * @param {function} test
 * @returns {array} An array of nodes.
 */
function recurse(nodes, test) {
  var memo = [];

  if (!nodes) {
    return memo;
  }

  nodes.forEach(function(node) {
    if (test(node)) {
      memo.push(node);
    }

    memo.push.apply(memo, recurse(node.nodes, test, memo));
  });

  return memo;
}

/**
 * Express settings.
 *
 * @param {string} fileName - The template path to load.
 * @param {object} data - The data to render.
 * @param {function} next - The continuation function.
 */
settings.__express = function(fileName, data, next) {
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

    // Find all renders.
    var renders = recurse(template.tree.nodes, function(node) {
      return node.type === "RenderExpression";
    }).map(function(node) { return node.value; });

    // Find all partials.
    var partials = recurse(template.tree.nodes, function(node) {
      return node.type === "PartialExpression";
    }).map(function(node) { return node.value; });

    // Find all filters.
    var filters = recurse(template.tree.nodes, function(node) {
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

    // Map all renders to functions.
    renders = renders.map(function(render) {
      return function(callback) {
        var name = render.template;
        var renderPath = path.join(dirname, name + ext);

        fs.readFile(renderPath, "utf8", function(err, contents) {
          template.registerPartial(name, combyne(String(contents)));
          callback(err);
        });
      };
    });

    // Map all partials to functions.
    partials = partials.map(function(name) {
      return function(callback) {
        // Ignore those that have already been defined globally.
        if (name in settings._partials) {
          return callback();
        }

        fs.readFile(path.join(dirname, name + ext), function(err, partial) {
          template.registerPartial(name, combyne(String(partial)));
          callback(err);
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

        // Register the exported function.
        template.registerFilter(name, require(filtersPath));
        callback(err);
      };
    });

    // Find all files and map the partials.
    async.parallel(partials.concat(renders, filters), function(err) {
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
      next(null, template.render(data));
    });
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
