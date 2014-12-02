const assert = require("assert");
const express = require("express");
const request = require("supertest");
const support = require("../");

describe("Partials", function() {
  var app = express();
  app.set("env", "test");
  app.set("views", __dirname + "/views");

  app.engine("combyne", support());
  app.set("view engine", "combyne");

  it("can render a partial without any data", function(done) {
    app.get("/partial", function(req, res) {
      res.render("partial", { msg: "partial" });
    });

    request(app)
      .get("/partial")
      .expect("Hello from partial!\n", done);
  });

  it("will render a partial containing a filter", function(done) {
    app.get("/partial-with-filter", function(req, res) {
      res.render("partial-with-filter", { msg: "filtered partial" });
    });

    request(app)
      .get("/partial-with-filter")
      .expect("Hello from FILTERED PARTIAL!\n", done);
  });

  it("will render a global partial", function(done) {
    app.get("/global", function(req, res) {
      res.render("partial", { msg: "extension" });
    });

    support.registerPartial("partials/test", {
      render: function() {
        return "Hello from global!\n";
      }
    });

    request(app)
      .get("/global")
      .expect("Hello from global!\n", done);
  });

  it("will render a global partial containing a filter", function(done) {
    app.get("/partial-with-global-filter", function(req, res) {
      res.render("partial-with-filter", { msg: "filtered partial" });
    });

    support.registerFilter("uppercase", function(value) {
      return value.toUpperCase();
    });

    request(app)
      .get("/partial-with-global-filter")
      .expect("Hello from FILTERED PARTIAL!\n", done);
  });
});
