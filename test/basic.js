const assert = require("assert");
const express = require("express");
const request = require("supertest");
const support = require("../");

describe("Combyne Express support", function() {
  var app = express();
  app.set("env", "test");
  app.set("views", __dirname + "/views");

  it("can register the combyne extension", function(done) {
    app.get("/", function(req, res) {
      res.render("index", { msg: "extension" });
    });

    app.engine("combyne", support());
    app.set("view engine", "combyne");

    request(app)
      .get("/")
      .expect("Combyne extension\n", done);
  });

  it("can register a custom extension", function(done) {
    app.get("/", function(req, res) {
      res.render("index", { msg: "extension" });
    });

    app.engine("html", support());
    app.set("view engine", "html");

    request(app)
      .get("/")
      .expect("HTML extension\n", done);
  });
});
