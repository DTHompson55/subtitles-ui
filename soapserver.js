/*eslint-env node*/

//------------------------------------------------------------------------------
// node.js starter application for Bluemix
//------------------------------------------------------------------------------

// This application uses express as its web server
// for more info, see: http://expressjs.com
var express = require('express');

// get the soap extensions
var soap = require("soap");

//create a new express server
var http = require('http');

//create a new express server
var fs = require('fs');

module.exports = {
		start: startServer,
		listen: listen
}

var listenerPort = 8000;
var callbackFunction = function(args){
//	  console.log("Soap Call default callback: "+args.msgType+" data:"+args.msgCdata);	
}

var myService = {
		STTComplete: {
			soap12STTCompleteSoap: {	        	  
				STT_Results: function(args) {
	            	  callbackFunction(args);
	                  return {
	                      name: args.name
	                  };
	              }
	          }
	      }
	  };

//
// set up web service listener
//
function listen(app, callback){
	  callbackFunction = callback;
	  var wsdl = require('fs').readFileSync('SubtitlesReceiver.wsdl', 'utf8');
	  soap.listen(app, '/SubtitlesReceiver', myService, wsdl);
//	  console.log("Listening for SOAP traffic at /SubtitlesReceiver on port "+listenerPort);

}

//
// Start Server - for testing purposes
//
function startServer(portNumber, callback){
	  listenterPort = portNumber | 8000;
	  callbackFunction = callback;

	  var wsdl = require('fs').readFileSync('SubtitlesReceiver.wsdl', 'utf8');
	 
	  //http server example 
	  var server = http.createServer(function(request,response) {
	      response.end("404: Not Found: " + request.url);
	  });
	 
	  server.listen(listenerPort);	  
	  soap.listen(server, '/SubtitlesReceiver', myService, wsdl);
//	  console.log("Listening for SOAP traffic at /SubtitlesReceiver on port "+listenerPort);
}	 
