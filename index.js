const fs = require("fs");
const path = require("path");
const combyne = require("combyne");
const async = require("async");
const Module = require("module");

var support = {};

// Mimic how the actual Combyne stores.
support._filters = {};
support._partials = {};

// Proxy the filter and partial registration methods.
support.registerFilter = combyne.prototype.registerFilter;
support.registerPartial = combyne.prototype.registerPartial;

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
 * Express support.
 *
 * @param {string} fileName - The template path to load.
 * @param {object} data - The data to render.
 * @param {function} next - The continuation function.
 */
support.__express = function(fileName, data, next) {
  var dirname = path.dirname(fileName);
  var ext = path.extname(fileName);

  // Read in the template name as a buffer.
  fs.readFile(fileName, function(err, buffer) {
    // Pass up any errors.
    if (err) {
      return next(err);
    }
    // Send back the compiled template.
    var template = combyne(String(buffer));

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

    // Map all partials to functions.
    partials = partials.map(function(name) {
      return function(callback) {
        fs.readFile(path.join(dirname, name + ext), function(err, partial) {
          template.registerPartial(name, combyne(String(partial)));

          callback();
        });
      };
    });

    // Map all filters to functions.
    filters = filters.map(function(name) {
      // Filters cannot be so easily inferred location-wise, so assume they are
      // preconfigured or exist in a filters directory.
      return function(callback) {
        var filtersDir = support.filtersDir || "filters";
        var filtersPath = path.join(dirname, filtersDir, name + ".js");

        // This is really dumb, but because Node doesn't have an asynchronous
        // `require`, we have to simulate one using a private method.
        //
        // Concepted adapted from:
        // http://stackoverflow.com/a/13962764/282175
        fs.readFile(filtersPath, "utf8", function(err, filter) {
          try {
            var filterModule = new Module(filtersPath, support);
            filterModule._compile(filter);
          }
          catch (ex) {
            callback(ex);
          }

          // Register the exported function.
          template.registerFilter(name, filterModule.exports);

          callback();
        });
      };
    });

    // Find all files and map the partials.
    async.parallel(partials.concat(filters), function() {
      // Register all the global partials.
      Object.keys(support._partials).forEach(function(name) {
        var partial = support._partials[name];
        template.registerPartial(name, partial);
      });

      // Register all the global filters.
      Object.keys(support._filters).forEach(function(name) {
        var filter = support._filters[name];
        template.registerFilter(name, filter);
      });

      // Render the template.
      next(template.render(data));
    });
  });
};

// Expose configuration express support.
module.exports = function(options) {
  support.__proto__ = options;
  return support.__express;
};
