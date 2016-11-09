"use strict";

const app = require("./app");
const port = app.get("port");
const server = app.listen(port);

server.on("listening", () =>
  console.log(`SCD-16-09 application started on ${app.get("host")}:${port}`)
);
