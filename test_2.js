var http = require("http");
var url = require("url");
var Model = require("./model");
var crypto = require('crypto');
var ObjectId = require('mongoose').Types.ObjectId;
var cache = require('./node-cache');
var sys   = require('util');
var bs = require('nodestalker');
var client = bs.Client();
EE = require('events').EventEmitter;
ee = new EE();
var async = require("async");
var str = '';

function apache(request, response) {
		request.on('data', function(chunk){
			try {
			  var body = JSON.parse(chunk);
				client.use('terms.translate').onSuccess(function(x) {
					var dah =x;
					console.log(x);
				  client.put( dah).onSuccess(function( y ) {
					console.log(y);
				    client.disconnect();
				  });
				});
			}
			catch(e){
				console.log(e);
			}
	});
}	

	

function obj(obj){
	try {	
		return JSON.parse(JSON.stringify(obj));
	}
	catch (SyntaxError) {
	  console.log('Invalid JSON:');
    return false;
	}
}

exports.apache = apache;
//exports.apache_ids = apache_ids;
