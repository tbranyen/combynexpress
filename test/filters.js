const assert = require("assert");
const express = require("express");
const request = require("supertest");
const support = require("../");

describe("Filters", function() {
  var app = express();
  app.set("env", "test");
  app.set("views", __dirname + "/views");

  app.engine("combyne", support());
  app.set("view engine", "combyne");

  it("can execute a basic filter", function(done) {
    app.get("/filter", function(req, res) {
      res.render("filter", { msg: "extension" });
    });

    request(app)
      .get("/filter")
      .expect("noisnetxe\n", done);
  });

  it("will render a global filter", function(done) {
    app.get("/global", function(req, res) {
      res.render("filter", { msg: "extension" });
    });

    support.registerFilter("reverse", function() {
      return "Hello from global!";
    });

    request(app)
      .get("/global")
      .expect("Hello from global!\n", done);
  });
});
