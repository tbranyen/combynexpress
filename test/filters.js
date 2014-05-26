const assert = require("assert");
const express = require("express");
const request = require("supertest");
const support = require("../");

describe("Filters", function() {
  var app = express();
  app.set("env", "test");
  app.set("views", __dirname + "/views");

  it("can execute a basic filter", function(done) {
    app.get("/filter", function(req, res) {
      res.render("filter", { msg: "extension" });
    });

    app.engine("combyne", support());
    app.set("view engine", "combyne");

    request(app)
      .get("/filter")
      .expect("noisnetxe\n", done);
  });
});
