const fs = require("fs");
const path = require("path");
const combyne = require("combyne");

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

    // Find all files and map the partials.
    partials.forEach(function(name) {
      var partial = fs.readFileSync(path.join(dirname, name + ext)).toString();
      template.registerPartial(name, combyne(partial));
    });

    // Filters cannot be so easily inferred location-wise, so assume they are
    // preconfigured or exist in a filters directory.
    filters.forEach(function(name) {
      var filter = require(path.join(dirname, "filters", name + ".js"));
      template.registerFilter(name, filter);
    });

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
};

// Expose configuration express support.
module.exports = function() {
  return support.__express;
};
