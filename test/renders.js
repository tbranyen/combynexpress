const assert = require("assert");
const express = require("express");
const request = require("supertest");
const support = require("../");

describe("Renders", function() {
  var app = express();
  app.set("env", "test");
  app.set("views", __dirname + "/views");

  app.engine("combyne", support());
  app.set("view engine", "combyne");

  it("can render an injected partial with render expression", function(done) {
    app.get("/render", function(req, res) {
      res.render("render");
    });

    request(app)
      .get("/render")
      .expect("Hello from render\n", done);
  });

  it("can find partials correctly from a nested view", function(done) {
    app.get("/invert", function(req, res) {
      res.render("page");
    });

    request(app)
      .get("/invert")
      .expect("Hello from virtual render!\n", done);
  });
});
