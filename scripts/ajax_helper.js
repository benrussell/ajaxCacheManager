




// Provide the XMLHttpRequest class for IE 5.x-6.x:
// Other browsers (including IE 7.x-8.x)  ignore this when XMLHttpRequest is predefined
if( typeof XMLHttpRequest == "undefined" ) XMLHttpRequest = function() {
  try { return new ActiveXObject("Msxml2.XMLHTTP.6.0") } catch(e) {}
  try { return new ActiveXObject("Msxml2.XMLHTTP.3.0") } catch(e) {}
  try { return new ActiveXObject("Msxml2.XMLHTTP") } catch(e) {}
  try { return new ActiveXObject("Microsoft.XMLHTTP") } catch(e) {}
  throw new Error( "This browser does not support XMLHttpRequest." )
};




function xmlGetRequest( url, cb ){

	var request =  new XMLHttpRequest();
	request.open("GET", url, true);
	
	request.onreadystatechange=function() {
		if (request.readyState==4 ) {
			
			//alert('xmlGetRequest rcvd resp');
			
			var payload = request.responseText;
			
			if( cb != undefined ){
				cb( payload );
			//}else{
			//	alert("invalid cb: " + cb);
			}
			
		}
	}
	
	request.send(null);

	
	/* -- this code was causing an annoying double response event
	if(!request.getResponseHeader("Date")) {
	  var cached = request;
	  request =  new XMLHttpRequest();
	  var ifModifiedSince = cached.getResponseHeader("Last-Modified");
	  ifModifiedSince = (ifModifiedSince) ?
		  ifModifiedSince : new Date(0); // January 1, 1970
	  request.open("GET", url, false);
	  request.setRequestHeader("If-Modified-Since", ifModifiedSince);
	  request.send("");
	  if(request.status == 304) {
		request = cached;
	  }
	}
	*/

	return true;
}



function xmlPostRequest( url, cb, params ){

	//alert( 'u:' + url );
	//alert( 'p:' + params );

	var request =  new XMLHttpRequest();
	request.open("POST", url, true);

	request.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	//request.setRequestHeader("Content-length", params.length);
	//request.setRequestHeader("Connection", "close");

	
	request.onreadystatechange=function() {
		if(request.readyState==4 ) {
			
			var payload = request.responseText;
			//alert( 'return payload: ' + payload );
			
			if( cb != undefined ){
				cb( payload );
			}
			
		}
	}
	
	request.send( params );


	return true;
}


