const assert = require("assert");
const express = require("express");
const request = require("supertest");
const support = require("../");

describe("Partials", function() {
  var app = express();
  app.set("env", "test");
  app.set("views", __dirname + "/views");

  it("can render a partial without any data", function(done) {
    app.get("/partial", function(req, res) {
      res.render("partial", { msg: "extension" });
    });

    app.engine("combyne", support());
    app.set("view engine", "combyne");

    request(app)
      .get("/partial")
      .expect("Hello from partial!\n\n", done);
  });
});
