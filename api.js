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

function apache(response, request) {
	if (request.method == "POST"){
		request.on('data', function(chunk){
			request.content += chunk;
			console.log(request.content);			
		});
		request.on('end', function() {
			try {
			  var body = JSON.parse(request.content);
				client.use('terms.translate').onSuccess(function(x) {
					var dah =request.content;
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
			
			try {
				
				var toLang ;
				var website,translations,terms;
				var website_terms = [];
				var searchin = [];
				var wterms;
				var overridentrans = [];
				var overridenterms = [];
				var overridentrobj = [];
				var overridenids = [];
				var termsValues = [];
				var termsIds = [];
				var termsIdsS = [];
				var res= {};
				var Translation = Model.New('translations');

				async.series([
						function(callback){
											
							Language = Model.New('languages');
							Language.findOne({'value': body.tolang}, function(err,data){
															console.log("nothing here-------------------");
								try {				      
									toLang = obj(data)._id;
									callback(null, {'toLang': obj(data)._id });
							  } 
								catch (SyntaxError) {
							  	console.log('Invalid JSON: at language Find');
						    	return false;
							  }																

							});
						},
				    function(callback){
							Website = Model.New('websites');
							Website.findOne({ 'apikey': body.apikey }, function(err,data){
								try {				      
									website = obj(data);
									callback(null, {'website': website});
							  } 
								catch (SyntaxError) {
							  	console.log('Invalid JSON: at Website Find');
						    	return false;
							  }																

							});
				    },
						function(callback){
							WebsiteTerm = Model.New('website_terms');
							WebsiteTerm.where('website_id', new ObjectId(website._id)).run(function(err,data){
								wterms = obj(data);						
								for (var i = 0; i < wterms.length; i++){
									website_terms.push(wterms[i].term_id);
								}
								callback(null, {'website_terms': website_terms} );
							});
						},
						function(callback){
							Term = Model.New('terms');
							Term.where('_id').in(website_terms).where('value').in(body.strings).run(function(err,data){
								terms = obj(data);
								callback(null, {'terms': terms});	
							});			
						},
						function(callback){
							async.forEach(terms, 
								function(arg, callback) {
								    termsValues.push(arg.value.toLowerCase());
										termsIds.push(new ObjectId(arg._id));
										termsIdsS.push(arg._id);
										var windex = website_terms.indexOf(arg._id);

										if( windex > -1 && wterms[windex].translations.length > 0){		
											for (var j = 0; j < wterms[windex].translations.length; j++){
												if(wterms[windex].translations[j].lang == toLang){

													Translation.findById(wterms[windex].translations[j].translation, function(err,data){
														overridentrans.push(obj(data).value);
														overridenterms.push( arg.value.toLowerCase());
														
														overridenids.push(obj(data).term_id);
														overridentrobj.push(obj(data));
														 
													});
												} 
											}
										}
								    callback(null,"yes");
								}
								, function() {
								callback(null, {'overridentrans': overridentrans, 'overridenterms': overridenterms, 'overridentrobj': overridentrobj, 'termsValues':termsValues, 'termsIds':termsIds });
							});
						},
						function(callback){
											searchin = termsIds;
											for(var i = 0; i < overridenids.length; i++){
											}
										callback(null,{'searchin': searchin });
											
						},
						function(callback){
						
								Translation.where('term_id').in(searchin).where('language_id' , new ObjectId(toLang)).sort('score', -1).limit(termsIds.length).run( function(err, data) {															
									translations = obj(data);
									callback(null,{'translations': translations  });
							});
						},
						
				],
				// optional callback
				function(err, results){			
							var i = 0;
							for(i; i < translations.length; i++){
								var yindex = overridenids.indexOf(translations[i].term_id);
								
								if(yindex > -1){
									arg = overridenterms[yindex];
									if(overridentrobj[yindex] != undefined ){
										var dd = new Date(overridentrobj[yindex].updated_at);
										res[arg] = {'trans' : overridentrans[yindex], 'id' : termsIds[i], 'time' : dd.getTime().toString().substring(0,10) };
									}
								}else {
									if(translations[i] != undefined ){
										var dt = new Date(translations[i].updated_at);
										var indxTerms = termsIdsS.indexOf(translations[i].term_id);
										res[termsValues[indxTerms]] = {'trans' : translations[i].value, 'id' : termsIds[indxTerms], 'time' : dt.valueOf().toString().substring(0,10)  };
									}
								}
							}
							
							response.writeHead(200, {"Content-Type": "text/json"});
							console.log("results --------------------------------------=======================================8888888888888888888--------------");
							console.log(sys.inspect(res));
							response.write(JSON.stringify(res));
							response.end();							
				});
				
			} 
			catch (SyntaxError) {
				console.log('parse error at apache');
				console.log(SyntaxError);
				response.end();
			}
		});
	}
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
