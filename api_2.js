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

var message = {website:"", terms:"", tolang:""};
var body;
var wterms;
var cachestrings;
var cachekey;
var termsValues = [];
var termsResp = [];
var Translation;
var termsIds = [];
var Translation = Model.New('translations');
var overridentrans = [];
var overridenterms = [];
var overridentrobj = [];
var translations = [];
var terms;
var origins_terms = [];
var website_terms= [];
var res = {};
ee.setMaxListeners(0);
function apache(response, request) {

	if (request.method == "POST"){
		
			request.on('end', function(chunk) {
				try {
					
			  	body = JSON.parse(chunk);
				
			  } 
				catch (SyntaxError) {
					console.log('parse error');
	      	return false;
			   }
				Website = Model.New('websites');
				Website.findOne({ 'apikey': body.apikey }, function(err,website){
					try {				      
				  	message.website = obj(website);
				  } 
					catch (SyntaxError) {
				  	console.log('Invalid JSON:');
		      	return false;
				  }																
			
					Language = Model.New('languages');
				
					Language.findOne({'value': body.tolang}, function(err,data){
						message.tolang = obj(data)._id;

						for(var i; i < body.strings.length; i++){
							origins_terms.push(body.strings[i].toLowerCase());
						}
						
						
					  cachekey = crypto.createHash('md5').update(body.apikey.toString()).digest("hex");
						if(false &&cache.get(cachekey)){
							console.log(cache.get(cachekey).length);

						}
						if(true){
							
							WebsiteTerm = Model.New('website_terms');
							WebsiteTerm.where('website_id', new ObjectId(message.website._id)).run(function(err,data){
								wterms = obj(data);						

								for (var i = 0; i < wterms.length; i++){
									website_terms.push(wterms[i].term_id);
								}
								
								Term = Model.New('terms');
							
								Term.where('_id').in(website_terms).where('value').in(body.strings).run(function(err,data){
									terms = obj(data);	
									cache.put(cachekey, terms, 3600000);
									
									async.forEach(terms, f, function(err) {
											Translation.where('term_id').in(termsIds).where('language_id' , new ObjectId(message.tolang)).sort('score', -1).limit(termsIds.length).run( function(err, data) {															
													translations = obj(data);
													ee.emit("processed");
													console.log("----- procesed---------------------------------");
													console.log(sys.inspect(ee.listeners("processed")));
											});
									});								
									
								});
							});
						}
	
					});
				});
					ee.on("processed", function (){
						try {
								
								async.forEach(termsValues, results, function(err) {
									response.writeHead(200, {"Content-Type": "text/json"});
									response.write(JSON.stringify(res));
									response.end();
									ee.removeAllListeners("processed");
									ee.emit("cleanup");
									console.log("---------clean up -----------------------------");
									console.log(sys.inspect(ee.listeners("cleanup")));
									
								});
								
						}
						
						catch(exception){
							console.log(exception);
							console.log("--------------------------------------");
						}
					});
					
				//console.log(termsResp);
				//console.log(translations);
				
			});

	}else {
			response.writeHead(200, {"Content-Type": "text/plain"});
	  	response.write("Get");
	  	response.end();
	}
}
									var results = function(arg,callback){
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
												console.log(translations);
												console.log(termsValues.length);
												console.log(i);
											}
										}
										callback();
									} 
									
									var f = function(arg, callback) {
								//		try {
									    termsValues.push(arg.value.toLowerCase());
											termsIds.push(new ObjectId(arg._id));
											//now one problem left again there is a mother fuckin id but i cant find it i know its there
											
											var windex = website_terms.indexOf(arg._id);
																						
											if( windex > -1 && wterms[windex].translations.length > 0){		
										
												for (var j = 0; j < wterms[windex].translations.length; j++){
										//			console.log("windex -------------------");
									//				console.log(windex);
								//					console.log("translations length for wterms-----------------");
							//						console.log(wterms[windex].translations.length);
													
													if(wterms[windex].translations[j].lang == message.tolang){
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
											
											if(termsValues.indexOf(arg.value.toLowerCase() ) == -1){
												cache.del(cachekey);
											}
											
									    callback();
										}
						//				catch (exception){
									//		console.log("---------------------------------------");
								//			console.log(exception);
							//			}
									//}
									ee.on('cleanup', function(){
										translations = [];
									  res = {};
										terms = [];
										wterms  = null;
										overridenterms = [];
										overridentrans = [];
										overridentrobj = [];
										website_terms = [];
										termsIds = [];
										termsValues = [];
								//		body = null;
										//message = {website:"", terms:"", tolang:""};
										console.log("end of clean up method");
										console.log(translations);
										console.log(res);
										console.log(terms);
										console.log(wterms);
										console.log(termsIds);
										console.log("finished");  
										console.log(sys.inspect(ee.listeners("cleanup")));
										console.log(sys.inspect(ee.listeners("processed")));
										
									});

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
