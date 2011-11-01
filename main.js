var server = require("./server");
var router = require("./router");
var api = require("./api");

var handle = {}
handle["/"] = api.apache;
handle["/apache"] = api.apache;
handle["/apache_ids"] = api.apache_ids;

server.start(router.route, handle);


