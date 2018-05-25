'use strict';
// express
require('dotenv').config();
var express = require('express');
var app = express();
var appEnv = {port: 8888, soapport: 8000}
var fileName = "";
var path = __dirname + '/public/';
var request = require('request');
var fs = require('fs');
var soap = require('soap');

var bodyParser = require("body-parser");
// create a new express server
var app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
// app.use(bodyParser.raw({type: function(){return true;}, limit: '5mb'}));

// get the fileupload capabilities
var multer = require('multer');
var upload = multer({ dest: path+'uploads/' });



// serve the files out of ./public as our main files
app.use(express.static(__dirname + '/public'));

// Setup a SOAP listener for the BPM stuff to come back through
var soapserver = require('./soapserver.js');

//var server = require('http').createServer(app);
//var io = require('socket.io')(server);
//io.on('connection', function(){ console.log("Web page connected with Socket.io") });

// start server on the specified port and binding host
var server = app.listen(appEnv.port, '0.0.0.0', function() {
  // print a message when the server starts listening
  console.log("server starting on " + appEnv.port);  
});


var io = require('socket.io').listen(server);

io.on('connection', function(client){
	console.log("Socket Client Connected");
    client.on('disconnect', function() {
		console.log("Socket Client Disconnected");
    });
});

function unlinkAllFilesBut(keep){
	
	keep = keep || "XXX";
	
	fs.readdir(path+'uploads/', (err, files) => {
		if (err) {
			console.log("READ DIR Error",err);
			return;
		}
	    files.forEach(file => {
		   if (file.startsWith('.') || file.startsWith(keep) || file.startsWith("Blank")){
		    } else {
		    	fs.unlinkSync(path+'uploads/'+file);
		    	console.log("unlinked 'uploads/'/"+file);
		    }
		  });
	  }); 
}


var ccData;
unlinkAllFilesBut();

function saveCCdata(content){
	  fs.open(path+'uploads/'+appState.filename+'.vtt', 'w', (err, fd) => {
		  if (err) {
		    if (err.code === 'EEXIST') {
		      console.error(appState.filename+'.vtt'+' already exists');
		      return;
		    }
		    else {console.error("FS OPEN Error", err)}
		    throw err;
		  }
		  fs.write(fd, content, function(err, written, string){
			  ccData = string;
			  if (err) {
				  console.error('Error on write',err);
				  return;
			  }
			  fs.close(fd, function(err){
				  if (err) {
					  console.error('Error on close',err);
					  return;
				  }  
				  console.log("Closed VTT file");
				  io.emit('goToStep4');
			  });
		  });
		});
}


soapserver.start(appEnv.soapport, function soapCallbackFunction(args){
	  console.log("SOAP LISTENER GOT A MESSAGE",args);
	  saveCCdata(args.webvtt);
});

var appState = {filename: "e9150e7f694f8ccdd4b9afeca8306556", filesizeMB: 0};

var url2 = "http://localhost:1880/api/uploadmp4";
var url = "http://localhost:1880/api/webvtt";

app.post('/api/getFilename', function (req, res) {
	console.log("getFilename",appState);
	res.send(appState);
});

app.post('/api/getCCData', function (req, res) {
	res.send(ccData);
});

app.post('/api/updateCCData', function (req, res) {
	saveCCdata(req.body.data);
});


app.post('/api/finishCC', function (req, res) {
	saveCCdata(req.body.data);
	res.redirect(',,/step5.html');

});


app.post('/step1', function (req, res) {
	console.log("Index --> Step 1");
	res.redirect('step1.html');
});


app.post('/uploadmp4', upload.single('mp4'), function (req, res, next) {
	appState.filename = 'uploads/'+req.file.filename;
	console.log(req.file.filename);
	
	const fs = require("fs"); //Load the filesystem module
	const stats = fs.statSync(path+'uploads/'+req.file.filename);
	const fileSizeInBytes = stats.size
	appState.filesizeMB = fileSizeInBytes / 1000000.0;
	console.log(appState);
	
	unlinkAllFilesBut(req.file.filename);
	
	res.redirect('step2.html');
});

app.post('/submitCCRequest', function (req, res) {

	var localUrl = url+	"?language="+req.body.language+
						"&outputStyle="+ req.body.outputStyle+
						"&model="+req.body.model+
						"&multipleSpeakers="+req.body.speakers+
						"&correlationId=xxx"+
						"&timePerLine="+req.body.timePerLine+
						"&suppressHesitations="+(req.body.hesitations?false:true)+
						"&suppressSpeakerLabels="+(req.body.labels?false:true)+
						"&filename="+encodeURI(appState.filename);
	
	console.log("URL = ",localUrl);
	console.log(req.body);
	
	request.get(localUrl, 
			function optionalCallback(err, httpResponse, body) {
		  if (err) {
		    return console.error('upload failed:', err);
		  }
		  console.log('Upload successful!  Server responded with:', body);
	});
	
	res.sendFile(path+"waiting.html");
});

app.post('/CC', function (req, res) {
	console.log("requestCC");
	res.redirect('step3.html');
});

app.post('/requestCCback', function (req, res) {
	console.log("requestCCback");
	res.status(204).end();
});

app.post('/CCcomplete', function (req, res) {
	console.log("CCcomplete");
	res.status(204).end();
});

app.post('/CCreload', function (req, res) {
	console.log("CCreload");
	res.status(204).end();
});
