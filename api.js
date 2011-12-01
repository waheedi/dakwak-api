var http = require("http");
var url = require("url");
var Model = require("./model");
var crypto = require('crypto');
var ObjectId = require('mongoose').Types.ObjectId;
var cache = require('./node-cache');
var sys   = require('util');
var bs = require('nodestalker');
var client = bs.Client();


/** 
daemon -> API

{
    "apikey": "4c320675d1748267bb0001274c320675d1748267bb000125",
    "tolang": "ar",
    "pages": [
      {
        "url":"/",
        "title": "root",
        "terms": [
          {
            "term": "dakwak | your web translation &amp; localization tool",
            "xpath": "html>body>div>h1"
          },
          {
            "term": "sign in",
            "xpath": "html>body>div>h1"
          }
        ]
      },
      {
        "url":"/home",
        "title": "home",
        "terms": [
          {
            "term": "dakwak | your web translation &amp; localization tool",
            "xpath": "html>body>div>h1"
          },
          {
            "term": "sign in",
            "xpath": "html>body>div>h1"
          }
        ]
      }
    ]
}

API -> daemon

{
  "terms": [
    {
        "term": "sign in",
        "url": "/",
        "trans": "تسجيل الدخول",
        "id": "4c321b74d1748269a0000079",
        "time": "1322299788",
        "xpath": "html>body>div>h1"
    },
    {
        "term":"home",
        "url": "/",
        "trans": "تسجيل الدخول",
        "id": "4c321b74d1748269a0000079",
        "time": "1322299788",
        "xpath": "html>body>div>h1"
    }
  ]
}
**/
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
				client.use('node.translate').onSuccess(function(x) {
					var chunked_content = request.content;
				  client.put( chunked_content ).onSuccess(function( y ) {
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
				var websiteTerms = [];
				var searchin = [];
				var wterms;
				var overridentrans = [];
				var overridenterms = [];
				var overridentrobj = [];
				var overridenids = [];
				var termsValues = [];
				var allTermsValues = [];
				var allTerms = [];
				var termsIds = [];
				var termsIdsS = [];
				var allUrls = [];
				var resTerms = [];
				
				var res= {};
				var Translation = Model.New('translations');

				async.series([
						function(callback){
											
							Language = Model.New('languages');
							Language.findOne({'value': body.tolang}, function(err,data){
								console.log("nothing here-------------------");
									//						console.log(data);
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
								//	console.log(website);
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
							//console.log(new ObjectId(website._id));
							WebsiteTerm.where('website_id', new ObjectId(website._id)).run(function(err,data){
								wterms = obj(data);						
								for (var i = 0; i < wterms.length; i++){
									websiteTerms.push(wterms[i].term_id);
									//termsXpaths.push(wterms[i].xpath);	
								}
								callback(null, {'websiteTerms': websiteTerms} );
							});
						},
						function(callback){
							Term = Model.New('terms');
							for(var i = 0; i < body.pages.length; i++){
								allTerms = allTerms.concat(body.pages[i].terms );
								console.log("+++++++++++++++++++++++++++++++++++++++----------------------------------------------------------------------------------------");
								//console.log(body.pages[i].terms);
								
								//console.log(body.pages[i].url);
								//console.log(pages);
							}	
								console.log(allTerms);
							callback(null, {'allTerms': allTerms});	
						},
						function(callback){
							for(var i = 0; i < allTerms.length; i++){
								allTermsValues.push(allTerms[i].term);
								console.log("----------------------------------------------------------------------------------------");
								console.log(allTerms[i]);
							}

							Term.where('_id').in(websiteTerms).where('value').in(allTermsValues).run(function(err,data){
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
										var windex = websiteTerms.indexOf(arg._id);

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
						
								Translation.where('term_id').in(termsIds).where('language_id' , new ObjectId(toLang)).sort('score', -1).limit(termsIds.length).run( function(err, data) {															
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
								console.log(translations);
								if(yindex > -1){
									arg = overridenterms[yindex];
									if(overridentrobj[yindex] != undefined ){
										var dd = new Date(overridentrobj[yindex].updated_at);
										 resTerms.push({'term' : res[arg], 'url' : '/', 'trans' : overridentrans[yindex], 'id' : termsIds[i], 'time' : dd.getTime().toString().substring(0,10) });
									}
								}else {
									if(translations[i] != undefined ){
										var dt = new Date(translations[i].updated_at);
										var indxTerms = termsIdsS.indexOf(translations[i].term_id);
										console.log("================================================================");
										console.log(indxTerms);
										console.log(termsValues[indxTerms]);
										resTerms.push({'term' : termsValues[indxTerms] , 'url' : '/', 'trans' : translations[i].value, 'id' : termsIds[indxTerms], 'time' : dt.valueOf().toString().substring(0,10)  });
									}
								}
							}
							res["terms"] = resTerms;
							response.writeHead(200, {"Content-Type": "text/json"});
							//console.log("results --------------------------------------=======================================8888888888888888888--------------");
							//console.log(sys.inspect(res));
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
