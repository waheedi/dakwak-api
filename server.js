var http = require("http");
var url = require("url");

function start(route, handle) {
	
  function onRequest(request, response) {
    var pathname = url.parse(request.url).pathname;
		request.setEncoding("utf8");
		request.content = '';
		//    console.log("Request for " + pathname + " received." + " response request" + request);
    route(handle, pathname, response, request);
  }

  http.createServer(onRequest).listen(8888);
  console.log("Server has started.");
}

exports.start = start;
