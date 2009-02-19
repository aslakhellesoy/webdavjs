/* ***** BEGIN LICENSE BLOCK *****
 * Licensed under Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Bitflux code.
 *
 * The Initial Developer of the Original Code is Bitflux
 * Portions created by the Initial Developer are Copyright (C) 2002-2003
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 * - Christian Stocker  (Bitflux)
 * - James A. Overton   <james@overton.ca>
 * - Lars Kiilerich     <lars[at]v1p[dot]dk>
 *
 * ***** END LICENSE BLOCK ***** */

/************************************************************************************
 * mozDataTransport v0.52
 * 
 * Generic File Transport Driver infrastructure first seen in Bitflux, a multi-purpose,
 * in-browser, XML editor.
 *
 * This infrastructure supports a variety of ways to publish data in Mozilla.
 * Particular drivers for webdav or http specialize this class
 *
 * INPUT: driverName - string to append to "mozTransportDriver_"
 *         the options are...
 *           "display"
 *           "local"
 *           "post"
 *           "webdav"
 * POST05:
 * - add support for CVS, ftp and other ways to post files to CMSs
 * - save to file: see mozedit and jslib projects - http://www.bokil.com/downloads/
 *
 ************************************************************************************/

function mozTransportDriver (driverName) {
	this.container = eval(" new mozTransportDriver_"+driverName);
}

mozTransportDriver.prototype.load = function (filename, callback) {
	var id = "mozTransportDriver.load";
	this.callback = this.loadCallback;
	this.userLoadCallback = callback;
	this.filename = filename;
	this.container.load(filename, this);
};

mozTransportDriver.prototype.loadCallback = function (reqObj) {
	reqObj.td = this;
	reqObj.filename = this.filename;
	if (this.userLoadCallback) { 
		this.userLoadCallback(reqObj);
	}
};

mozTransportDriver.prototype.save = function(filename, content, callback) {
	this.callback = this.saveCallback;
	this.userSaveCallback = callback;
	this.filename = filename;
	this.container.save(filename, content, this);
};

mozTransportDriver.prototype.saveCallback = function(reqObj){
	reqObj.td = this;
	reqObj.filename = this.filename;
	if (this.userSaveCallback) {
		this.userSaveCallback(reqObj);
	}
};

mozTransportDriver.prototype.parseResponseXML = function(responseXML, status) {
  var f=["mozileDataTransport.js","parseResponseXML"];

  var reqObj = new Object();
  var alerttext="";
  
  try {
    // look to see if there is a parse error
    var parserErrorNode = responseXML.getElementsByTagNameNS("http://www.mozilla.org/newlayout/xml/parsererror.xml","parsererror")[0];
  
    if (parserErrorNode) {
      alerttext = parserErrorNode.firstChild.data;
      var sourceNode = parserErrorNode.getElementsByTagName("sourcetext")[0];
      if (sourceNode) {
        alerttext += "\n" + sourceNode.firstChild.data;
      }
      mozile.bug.write(f,3,"parserErrorNode: "+ alerttext);
    }
    else {
      alerttext="Something went wrong:\n\n" + status + "\n\n";
      var objXMLSerializer = new XMLSerializer;
      var strXML = objXMLSerializer.serializeToString(responseXML.documentElement);
      alerttext += strXML;
    }
	} catch(e) {
		mozile.bug.write(f,3,"Exception: "+e);
	}
  reqObj.isError = true;
  reqObj.statusText = alerttext;
  reqObj.document = responseXML;
  if (status === 0) {
    reqObj.status = 400;
  } else {
    reqObj.status = status;
  }
  return reqObj;
};

/*
* parseResponseText
*
*INPUT
* responseText  text to parse, as a string
* status        status
*
*EXIT
* reqObj        returned object    
* .iserror      true
* .status       status, or 400 if status is 0
* .statusText   "Something went wrong" + responseText 
*
*/
mozTransportDriver.prototype.parseResponseText = function(responseText, status) {

  var reqObj = new Object();

  alerttext="Something went wrong:\n\n";
  alerttext += responseText ;
  reqObj.isError = true;
  reqObj.statusText = alerttext;
  if (status === 0) {
    reqObj.status = 400;
  } else {
    reqObj.status = status;
  }
  return reqObj;
};

/******************************** webDAV driver ***********************************
 *
 * Depends on external implementation of webDAV: for example, jsdav from twingle
 * 
 **********************************************************************************/

function mozTransportDriver_webdav() {
  this.p = new DavClient();
}

mozTransportDriver_webdav.prototype.load = function (filename, td) {
  this.p.request.td = td;
  //backup Massnahme (sometimes td get's lost with the request...)
  bxe_config.td = td;
  this.p.request.onload = this.loadCallback;
  this.p.GET(filename);
};

mozTransportDriver_webdav.prototype.save = function (filename, content, td) {
  this.p.request.td = td;
  this.p.request.onload = this.saveCallback;
  this.p.PUT(filename, content );
};

mozTransportDriver_webdav.prototype.loadCallback = function (e) {
  
  var p = e.currentTarget;
  var td = p.td;
  //backup Massnahme (sometimes td get's lost with the request...)
  if (!td) {
    td = bxe_config.td;
  }
  
  var reqObj = new Object();
  // if there's no element called parsererror...
  if (p.responseXML.getElementsByTagNameNS("http://www.mozilla.org/newlayout/xml/parsererror.xml","parsererror").length === 0) {
    reqObj.document = p.responseXML;
    reqObj.isError = false;
    reqObj.status = 200;
    reqObj.statusText = "OK";
  } else if (p.responseXML) {
    reqObj =  td.container.parseResponseXML(p.responseXML);
  }
  else {
    reqObj = td.container.parseResponseText(p.responseText);
  }
  td.loadCallback(reqObj);
};

mozTransportDriver_webdav.prototype.saveCallback = function (e) {
  var p = e.currentTarget;
  var td = p.td;
  var reqObj = new Object();
  // status code = 204, then it's ok
  if (p.status == 204) {
    reqObj.document = p.responseXML;
    reqObj.isError = false;
    reqObj.status = 200;
    reqObj.statusText = "OK";
  } 
  else if (p.status == 201) {
    reqObj.document = p.responseXML;
    reqObj.isError = false;
    reqObj.status = 201;
    reqObj.statusText = "Created";
  }
  else if (p.responseXML) {
    reqObj = td.container.parseResponseXML(p.responseXML, p.status);
  } else {
    reqObj = td.container.parseResponseText(p.responseText, p.status);
  }
  reqObj.originalStatus = p.status;
  reqObj.originalStatusText = p.statusText;
  td.saveCallback(reqObj);
};

mozTransportDriver_webdav.prototype.parseResponseXML = function(responseXML, status) {
    var reqObj = new Object();

  // try to find parserror
    var parserErrorNode = responseXML.getElementsByTagNameNS("http://www.mozilla.org/newlayout/xml/parsererror.xml","parsererror")[0];
    if (parserErrorNode)
    {
      alerttext = parserErrorNode.firstChild.data;
      var sourceNode = parserErrorNode.getElementsByTagName("sourcetext")[0];
      if (sourceNode) {
        alerttext += "\n" + sourceNode.firstChild.data;
      }
      alerttext+= strXML;
    }
    else
    {
      alerttext="Something went wrong:\n\n" + status + "\n\n";
      var objXMLSerializer = new XMLSerializer;
      var strXML = objXMLSerializer.serializeToString(responseXML.documentElement);
      alerttext+= strXML;
    }
    reqObj.isError = true;
    reqObj.statusText = alerttext;
    reqObj.document = responseXML;
    if (status === 0) {
      reqObj.status = 400;
    } else {
      reqObj.status = status;
    }
    return reqObj;
  
};

mozTransportDriver_webdav.prototype.parseResponseText = function(responseText, status) {

  var reqObj = new Object();

  alerttext="Something went wrong:\n\n";
  alerttext += responseText ;
  reqObj.isError = true;
  reqObj.statusText = alerttext;
  if (status === 0) {
    reqObj.status = 400;
  } else {
    reqObj.status = status;
  }
  return reqObj;
};

/********************************* HTTP POST driver *******************************/
function mozTransportDriver_post() {}

/*
  Save a file using HTTP POST.
*/
mozTransportDriver_post.prototype.save = function(filename, content, td)
{
	try {
		var reqObj = new Object();
		var SavePostWindow = window.openDialog(
		 "chrome://mozile/content/XUL/savepost.xul",
		 "savepost",
		 "modal,dialog,centerscreen,chrome,resizable=no,close=no",
		 filename, content, reqObj);
	}catch (e){
		var f=["mozileDataTransport.js","mozTransportDriver_post.save"];
		mozile.bug.write(f,1,"POST window open exception: "+e);
	}
	td.callback(reqObj);
};

/*
* Loads a file over http get
* @tparam String filename the filename (can be http://... or just a relative path
*/
mozTransportDriver_post.prototype.load = function(filename, td) {
  var docu = document.implementation.createDocument("","",null);
  docu.loader = this.parent;
  docu.td = td;
  docu.onload = this.loadCallback;
  try {
    docu.load(filename);
  }
  catch (e) {
    var reqObj = new Object();
    reqObj.document = docu;
    reqObj.isError = true;
    reqObj.status = 404;
    reqObj.statusText = filename + " could not be loaded\n" + e.message;
    td.loadCallback(reqObj);
  }
  return docu;
};

mozTransportDriver_post.prototype.loadCallback = function (e) {
  var reqObj = new Object();
  reqObj.document = e.currentTarget;
  reqObj.isError = false;
  reqObj.status = 200;
  reqObj.statusText = "OK";
  var td = e.currentTarget.td;
  if (!td) {
    alert("td was not in e.currentTarget!!! Get it from global var");
  }
  td.loadCallback(reqObj);
};

/******************************** local file driver ***************************/
function mozTransportDriver_local() {}

/**
Saves content to a local file.
opens a file picker window with HTML, XML and All files filters.
"filename" is not yet supported.

Refer here for more details of file saving:
http://developer.mozilla.org/en/docs/Code_snippets:File_I/O
*/
mozTransportDriver_local.prototype.save = function (filename, content, td) {
	var f=["mozileDataTransport.js","local.save"];
	try {
	  var reqObj  = new Object();

		var nsIFilePicker = Components.interfaces.nsIFilePicker;
		var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
		// window needs to be set correctly. This is the window that the the filepicker is dependent on.
		// this should probably be mozileTarget ???
//		fp.init(window, "Save to Local File", nsIFilePicker.modeSave);
		fp.init(mozileTarget, "Save to Local File", nsIFilePicker.modeSave);
		fp.appendFilters(nsIFilePicker.filterAll | nsIFilePicker.filterHTML | nsIFilePicker.filterXML);

		var userAction = fp.show();
		
		switch (userAction) {
			case nsIFilePicker.returnOK :
			case nsIFilePicker.returnReplace :

				var nsIFileOutputStream = Components.interfaces.nsIFileOutputStream;
				var fos = Components.classes["@mozilla.org/network/file-output-stream;1"].createInstance(nsIFileOutputStream);

				fos.init(fp.file, 0x2A, 0664, 0); // write, create, truncate

				var count = fos.write(content, content.length);
				fos.flush();
				fos.close();

	      reqObj.isError = false;
	      reqObj.status = 200;
	      reqObj.statusText = "Saved to local file : "+ count +" bytes written";
				break;

			default : // User cancelled without saving.
	      reqObj.isError = false;
	      reqObj.status = 200;
	      reqObj.statusText = "Save to local file cancelled";
				break;	
		}
 		td.saveCallback(reqObj);
	}
	catch(e)
	{
		mozile.bug.write(f,0,"Exception saving to local file: "+e);
	}
	
};

/**
Displays content in a window.
*/
function mozTransportDriver_display() {}

mozTransportDriver_display.prototype.save = function (filename, content, td) 
{
  window.openDialog("chrome://mozile/content/XUL/source.xul","Source","chrome,centerscreen,dialog=0,resizable=1,scrollbars=1",content.unicode,content.charset);
	// No callback required, only displaying content not actually saving it.
};

/*
This is called by the dialog window to save the displayed contents to a local file.
*/
mozTransportDriver_display.saveLocal = function(content) {
  var td = new mozTransportDriver("local");
  td.save("", content, __mozileSaved);
};
