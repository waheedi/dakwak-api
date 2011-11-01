EE = require('events').EventEmitter;
ee = new EE();

for(var i=0; i < 10; i++){
	ee.emit("processed");
}

	ee.on('processed', function(){

	console.log("yes");
});

