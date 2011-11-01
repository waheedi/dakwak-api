var http = require("http");
var url = require("url");
var Model = require("./model");
var crypto = require('crypto');
var ObjectId = require('mongoose').Types.ObjectId;
var cache = require('./node-cache');
var sys   = require('util');
EE = require('events').EventEmitter;
ee = new EE();
var async = require("async");

function apache(response, request) {
	if (request.method == "POST"){
		request.on('data', function(chunk){
			request.content += chunk;			
		});
		request.on('end', function() {
			try {
				
			  var body = JSON.parse(request.content);
			}
			catch(e){
				console.log()
			}
			
			try {
				
				var toLang ;
				var website,translations,terms;
				var website_terms = [];
				var wterms;
				var overridentrans = [];
				var overridenterms = [];
				var overridentrobj = [];
				var termsValues = [];
				var termsIds = [];
				var res= {};
				var Translation = Model.New('translations');
				
				async.series([
						function(callback){
							Language = Model.New('languages');
							Language.findOne({'value': body.tolang}, function(err,data){
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
										//now one problem left, again there is a mother fuckin X23 id but i cant find it although i know its here.

										var windex = website_terms.indexOf(arg._id);

										if( windex > -1 && wterms[windex].translations.length > 0){		

											for (var j = 0; j < wterms[windex].translations.length; j++){
												if(wterms[windex].translations[j].lang == toLang){
								//								console.log("wterms[windex].translations[j].lang-----------------");
								//										console.log(wterms[windex].translations[j].lang);
								//									console.log("wterms[windex].translations[j]-----------------");
								//											console.log(wterms[windex].translations[j]);

								//												console.log("message.tolang-----------------");
								//													console.log(message.tolang);

													Translation.findById(wterms[windex].translations[j].translation, function(err,data){
								//															console.log("translation found-----------------");

								//															console.log(wterms[windex].translations[j]);
								//															console.log(data);
								//															console.log("-=---------------");
														overridentrans.push(obj(data).value);
														overridenterms.push( arg.value.toLowerCase());
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
							Translation.where('term_id').in(termsIds).where('language_id' , new ObjectId(toLang)).sort('score', -1).limit(termsIds.length).run( function(err, data) {															
									translations = obj(data);
									callback(null,{'translations': translations  });
							});
						},
						
				],
				// optional callback
				function(err, results){				
							var i = 0;
							for(i; i < termsValues.length; i++){
								var arg = termsValues[i];
								var yindex = overridenterms.indexOf(arg);
								var argindex = termsValues.indexOf(arg); 
								if(yindex > -1){
									arg = overridenterms[yindex];
									if(overridentrobj[yindex] != undefined ){
										var dd = new Date(overridentrobj[yindex].updated_at);
										res[arg] = {'trans' : overridentrans[yindex], 'id' : termsIds[argindex], 'time' : dd.getTime().toString().substring(0,10) };
									}else {
									//	console.log('********overridentrobj*****************************************************************');												
									//	console.log(overridentrobj[yindex]);
									//	console.log(yindex);
									}
								}else {
									if(translations[argindex] != undefined ){
										var dt = new Date(translations[argindex].updated_at);
										res[termsValues[argindex]] = {'trans' : translations[argindex].value, 'id' : termsIds[argindex], 'time' : dt.valueOf().toString().substring(0,10)  };
									}else {
//										console.log('*********translations****************************************************************');
//										console.log(results);
//										console.log(termsValues.length);
//										console.log(i);
									}
								}
							}
							
							response.writeHead(200, {"Content-Type": "text/json"});
							response.write(JSON.stringify(res));
							response.end();							
							console.log("hello world");
				    // results is now equal to ['one', 'two']
				});
				
			} 
			catch (SyntaxError) {
				console.log('parse error at apache');
				console.log(SyntaxError);
				
				response.end();
	      return false;
			}
		});
	}
}
	
function apache_ids(response, request) {
	if (request.method == "POST"){
		request.on('data', function(chunk){
			request.content += chunk;			
		});
		request.on('end', function() {
			try {

			  var body = JSON.parse(request.content);
			}
			catch(e){
				console.log('exception apache_ids');
				console.log(e);
			}
			
			try {	
				var toLang ;
				var website,translations,terms;
				var website_terms = [];
				var wterms;
				var overridentrans = [];
				var overridenterms = [];
				var overridentrobj = [];
				var termsValues = [];
				var termsIds = [];
				var res= {};
				var Translation = Model.New('translations');
				
				async.series([
						function(callback){
							Language = Model.New('languages');
							Language.findOne({'value': body.tolang}, function(err,data){
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
							Term.where('_id').in(website_terms).where('_id').in(body.ids).run(function(err,data){
								terms = obj(data);
								callback(null, {'terms': terms});	
							});			
						},
						function(callback){
							async.forEach(terms, 
								function(arg, callback) {
								    termsValues.push(arg.value.toLowerCase());
										termsIds.push(new ObjectId(arg._id));
										//now one problem left, again there is a mother fuckin X23 id but i cant find it although i know its here.

										var windex = website_terms.indexOf(arg._id);

										if( windex > -1 && wterms[windex].translations.length > 0){		

											for (var j = 0; j < wterms[windex].translations.length; j++){
												console.log("windex -------------------");
												console.log(windex);
													console.log("translations length for wterms-----------------");
														console.log(wterms[windex].translations);
														console.log(toLang);
												if(wterms[windex].translations[j].lang == toLang){
								//								console.log("wterms[windex].translations[j].lang-----------------");
								//										console.log(wterms[windex].translations[j].lang);
								//									console.log("wterms[windex].translations[j]-----------------");
								//											console.log(wterms[windex].translations[j]);

								//												console.log("message.tolang-----------------");
								//													console.log(message.tolang);

													Translation.findById(wterms[windex].translations[j].translation, function(err,data){
								//															console.log("translation found-----------------");

								//															console.log(wterms[windex].translations[j]);
								//															console.log(data);
								//															console.log("-=---------------");
														overridentrans.push(obj(data).value);
														overridenterms.push( arg.value.toLowerCase());
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
							Translation.where('term_id').in(termsIds).where('language_id' , new ObjectId(toLang)).sort('score', -1).limit(termsIds.length).run( function(err, data) {															
									translations = obj(data);
									callback(null,{'translations': translations  });
							});
						},
						
				],
				// optional callback
				function(err, results){
					
							var i = 0;
							for(i; i < termsValues.length; i++){
								var arg = termsValues[i];
								var yindex = overridenterms.indexOf(arg);
								var argindex = termsValues.indexOf(arg); 
								if(yindex > -1){
									arg = overridenterms[yindex];
									if(overridentrobj[yindex] != undefined ){
										var dd = new Date(overridentrobj[yindex].updated_at);
										res[arg] = {'trans' : overridentrans[yindex], 'id' : termsIds[argindex], 'time' : dd.getTime().toString().substring(0,10) };
									}else {
									//	console.log('********overridentrobj*****************************************************************');												
									//	console.log(overridentrobj[yindex]);
									//	console.log(yindex);
									}
								}else {
									if(translations[argindex] != undefined ){
										var dt = new Date(translations[argindex].updated_at);
										res[termsValues[argindex]] = {'trans' : translations[argindex].value, 'id' : termsIds[argindex], 'time' : dt.valueOf().toString().substring(0,10)  };
									}else {
										console.log('*********translations****************************************************************');
										console.log(results);
										console.log(termsValues.length);
										console.log(i);
									}
								}
							}
							
							response.writeHead(200, {"Content-Type": "text/json"});
							response.write(JSON.stringify(res));
							response.end();
							
							
							console.log("hello world");
				    // results is now equal to ['one', 'two']
				});
				
			} 
			catch (SyntaxError) {
				console.log('parse error at apache');
				console.log(SyntaxError);
				
				response.end();
	      return false;
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
exports.apache_ids = apache_ids;
