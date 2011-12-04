function New(name){
	if(mongoose == null){
		var mongoose = require('mongoose');
		var db = mongoose.connect('mongodb://localhost/dakwak_production');
		var Schema = mongoose.Schema;
	}
	var s = new Schema(); 
	var m = db.model(name, s)
	return m;
}
exports.New = New
