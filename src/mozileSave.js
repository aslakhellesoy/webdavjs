/* ***** BEGIN LICENSE BLOCK *****
 * Licensed under Version: MPL 1.1/GPL 2.0/LGPL 2.1
 * Full Terms at http://mozile.mozdev.org/license.html
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Playsophy code (www.playsophy.com).
 *
 * The Initial Developer of the Original Code is Playsophy
 * Portions created by the Initial Developer are Copyright (C) 2002-2003
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *		Christian Stocker (Bitflux)
 *		James A. Overton  <james@overton.ca>
 *		Lars Kiilerich    <lars[at]v1p[dot]dk> 
 *		Kingsley Kerce    <kingsley@kingsleysoftware.com>
 * ***** END LICENSE BLOCK ***** */

/**
@fileoverview
mozileSave.js : this file implements save options in Mozile.
It uses "save" settings, either from the mozile configuration file or entered by the user,
to decide which transport driver to use to save a file.

Note:
in general, only save the editable area that has changed as the rest of a file may be just
template information, fixed by a CMS. Only saving an editable area would correspond to posting
a blog entry in a blog.
 
POST05:
- be more robust ie/ if garbage in configuration etc
- "save elements" option: make this save all / all modified editable elements.
 +  This means tracking changes in this file.
 +  This also ties in with the alert given if there are unsaved changes - this
    only currently works with one editable element.
- pass file name/id and actual content back in any errors (change mozDataTransport)
*/

function mozileSave()
{
	var f=["mozileSave.js","mozileSave"];
	mozile.bug.write(f,2,"Beginning to save...");

	var saveContent, saveMethod, contentToSave, httpSavePath, id, CC;

	//Check for valid save options.
	try {
		CC = mozileTarget.document.MOZILE_CURRENT_CONFIG;
		saveMethod = CC.saveMethod;
		if(!saveMethod){
			throw "saveMethod undefined";}
		if ( saveMethod != mozileValidateConfig( "saveMethod", saveMethod ) ){
			throw "saveMethod undefined";}

		saveContent = CC.saveContent;
		if(!saveContent){
			throw "saveContent undefined";}
		if ( saveContent != mozileValidateConfig( "saveContent", saveContent ) ){
			throw "saveContent undefined";}

		}
	catch (e) {
		mozile.bug.write(f,1,"Unable to save: "+e);
		return null;
	}

	mozile.bug.write(f,2,"Save Config: saveMethod="+saveMethod +" saveContent="+saveContent); 

	// Get identifier for save content
	//id = document.location.pathname;	//??? is this correct
	id = "";
	
	//POST: if no save path specified, save back to own filename. 
	httpSavePath = CC.httpSavePath;
	if(saveMethod=="post"){
		id = new Object();
		if(!httpSavePath){
			id.httpSavePath = mozileTarget.document.location.href;
		}else {
			id.httpSavePath = httpSavePath;
		}	
		id.documentHref =  mozileTarget.document.location.href;
		id.characterSet = mozileSaveCharset();
		if (saveContent == "page") {
			id.contentType = mozileTarget.document.contentType;
		} else {
			id.contentType = "text/plain";
		}
		mozile.bug.write(f,2,"POST httpSavePath: "+id.httpSavePath); 
	}
	//DISPLAY: view in a window.
	if(saveMethod=="display"){
		id = new Object();
		id.characterSet = mozileSaveCharset();
	}
	
	//WEBDAV: Save back to own filename.
	if(saveMethod=="webdav"){
		id = mozileTarget.document.location.href;
		mozile.bug.write(f,2,"WebDAV id: "+id); 
	}
	
	
	if(saveContent=="current" || saveContent=="current-ns")
	{
  	// get the editable area
  	var cssr = mozileSelection.getEditableRange();
  	var editableArea = cssr.top;	//the top (element) node of the range.
		if (saveContent=="current"){
			contentToSave = mozileSerializeCurrent( editableArea );
		}else{
			contentToSave = mozileSerializeCurrentNS( editableArea );
		}	
		if ( contentToSave === null ) {
			mozile.bug.write(f,0,"Error serializing selected area. Save aborted.");
			return null;
		}

		if(editableArea.id){ // append editable area id to file name if there is an id
			// if httpsave, then add id of field to string as MozileID
			if(saveMethod == "post"){
				// check if another param exists, if yes, add with &
				if(id.httpSavePath.indexOf('?') != -1){
					id.httpSavePath = id.httpSavePath + "&MozileID=" + editableArea.id;	
				}else{ // 
					id.httpSavePath = id.httpSavePath + "?MozileID=" + editableArea.id;
				}
			} else if (saveMethod == "webdav") { // normal
				id = id + "#" + editableArea.id;
			}
			// save to dialog and file don't use id yet.
		}
	}
	else { //Save whole page		
		//create a new XMLSerializer
		try {
			var objXMLSerializer = new XMLSerializer;
		} catch(e) {
			mozile.bug.write(f,0,"XMLSerializer error: "+e);
			return null;
		}
		// get the contents of the document
		mozileUnload(mozileTarget);
		contentToSave = objXMLSerializer.serializeToString(mozileTarget.document);
	}

	if ( mozileTarget.document.contentType == "text/html" ) {
		if ( CC.saveHTMLCase == "lower" ) {
			contentToSave = mozileHTML2xhtml( contentToSave );
		}
	}
	if ( CC.saveHTMLCompatibility == "xhtml" ) {
		contentToSave = mozileXhtmlCompatible( contentToSave );
	}

	// Convert from Unicode to required charset
	if(saveMethod == "post" || saveMethod == "local"){
		contentToSave = mozileConvertCharset( contentToSave );
	} 
	else if (saveMethod == "display"){
		var uContent = contentToSave;
		contentToSave = new Object();
		var version = mozileEntityVersion( CC.saveEntities );
		contentToSave.unicode = mozileConvertToEntities( uContent, version ); 
		contentToSave.charset = mozileConvertCharset( uContent );
		uContent = undefined;
	}
	// Webdav - currently uses plain unicode only.
	
	var td = new mozTransportDriver(saveMethod);
	td.save(id, contentToSave, __mozileSaved);
	mozile.bug.write(f,2,"Saving finished");
	return true;
}

/**
Converts uppercase tags to lowercase.

@param {String} h valid string with tags in uppercase
@return x - string with all tags converted to lowercase.
@type {String}  
*/
function mozileHTML2xhtml( h )
{
	var TAG = /<\/?[A-Za-z]+/g; /* */
	var x = h.replace(TAG, function h2x(s){return s.toLowerCase();} );
	return x;
}

/**
Converts xhtml to xhtml compatibility format.
Adds a space at the end of lonely tags.

Could remove XML namespace???
*/
function mozileXhtmlCompatible( h ) {
	var re = /\/>/g;
	var newSubStr = new String(' />');
	var hc = h.replace( re, newSubStr );
	return hc;
}

function mozileConvertToEntities( h, version ) {
	var EC = Components.classes["@mozilla.org/intl/entityconverter;1"].createInstance(Components.interfaces.nsIEntityConverter);
	var hc = EC.ConvertToEntities( h, version );
	return hc;
}

// Convert to charset, convert entities if required.
//
function mozileConvertCharset( h ) {
	var f=["mozileSave.js","mozileConvertCharset"];
	var charset, version, attributes, CC;
	
	CC = mozileTarget.document.MOZILE_CURRENT_CONFIG;
	charset = mozileSaveCharset();
	version = mozileEntityVersion( CC.saveEntities );
	attributes = mozileConversionAttributes( CC.saveConversion );
	mozile.bug.write(f,3,"charset: "+charset+" attributes: "+attributes+" version: "+version);
	
	try {
		var SAC = Components.classes["@mozilla.org/intl/saveascharset;1"].createInstance();
		if (SAC) {
			SAC.QueryInterface(Components.interfaces.nsISaveAsCharset);
			SAC.Init(charset, attributes, version);
			var hc = SAC.Convert(h);
			return hc;
		}
	}catch (e) {
		mozile.bug.write(f,1,"nsISaveAsCharset exception: "+e);
	}
	return h;
}

// Get the save charset
//
function mozileSaveCharset() {
	var charset;
	var CC = mozileTarget.document.MOZILE_CURRENT_CONFIG;
	if ( CC.saveCharset.toLowerCase() ==  "document" ){
		charset = mozileTarget.document.characterSet;
	}else{
		charset = CC.saveCharset;
	}
	return charset;
}

// Input: array
//
function mozileEntityVersion( entityList ) {
	var version = 0;
	if ( (typeof(entityList) == "object") && ("pop" in entityList) ) {
		var entities = new Array();
		entities = entities.concat(entityList);
		while ( entities.length > 0 ) {
			switch ( entities.shift() ) {
				case "none" :
					entities = new Array();
					version = 0;
					break;
				case "html40latin1" :
					version |= 1;
					break;
				case "html40symbols" :
					version |= 2;
					break;
				case "html40special" :
					version |= 4;
					break;
				case "transliterate" :
					version |= 8;
					break;
				case "mathml20" :
					version |= 16;
					break;
			}
		}
	}
	return version;
}	


function mozileConversionAttributes( attrList ) {
	var attr = 0;
	if ( (typeof(attrList) == "object") && ("pop" in attrList) ) {
		var attributes = new Array();
		attributes = attributes.concat(attrList);
		while ( attributes.length > 0 ) {
			switch ( attributes.shift() ) {
				case "nofallback" :
					attr &= ~0xFF;
					break;
				case "questionmark" :
					attr &= ~0xFF;
					attr |= 1;
					break;
				case "escapedunicode" :
					attr &= ~0xFF;
					attr |= 2;
					break;
				case "decimalncr" :
					attr &= ~0xFF;
					attr |= 3;
					break;
				case "hexncr" :
					attr &= ~0xFF;
					attr |= 4;
					break;
				case "none" :
					attr &= ~0x300;
					break;
				case "entitybeforecharset" :
					attr &= ~0x300;
					attr |= 0x100;
					break;
				case "entityaftercharset" :
					attr &= ~0x300;
					attr |= 0x200;
					break;
				case "charsetfallback" :
					attr |= 0x400;
					break;
				case "ignoreignorables" :
					attr |= 0x800;
					break;
			}
		}
	}
	return attr;
}

/*
	Serialize the currently selected area to a string.
	
	Returns null if there is an error.
	
	Uses the XML Serializer to ensure that xhtml and xml documents are saved in the same format.
	The XML Serializer uses the document charset when creating the string.
		
	The easy way would be to use innerHTML, BUT it is serialized slightly differently compared to the XML serializer.
	The XML serializer converts '&', '<', and '>' to character entities. i.e. to &amp;, &lt; &gt;
	innerHTML also converts char xA0 (non-breaking space) to &nbsp;
	No other characters are converted to entities.
	innerHTML does not add the trailing slash required by xhtml to close lonely tags:
	 e.g. you get <br> instead of <br/> with innerHTML.

*/
function mozileSerializeCurrent( editableArea ) {
	var f=["mozileSave.js","mozileSerializeCurrent"];
	var stringContent;

	//create a new XMLSerializer
	try {
		var objXMLSerializer = new XMLSerializer;
	} catch(e) {
		mozile.bug.write(f,0,"XMLSerializer error: "+e);
		return null;
	}

  try {

		//Get editableArea element name and offset
		var ename, eoffset, elist, doc;
		if ( editableArea.nodeType == Node.ELEMENT_NODE ) {
			ename = editableArea.nodeName;
			doc = editableArea.ownerDocument;
			elist = doc.getElementsByTagName( ename );
			for ( var i=0; i<elist.length; i++ ) {
				if ( elist[i] === editableArea ) {
					eoffset = i;
					break;
				}
			}
		} else {
			mozile.bug.write(f,1,"The node to save is not an element node!");
			return null;
		}

		//Clone Target
		var clonedTarget = doc.documentElement.cloneNode(true);

		//Find cloned editableArea node.
		var clonedArea;
		if(editableArea==doc.documentElement) {
			clonedArea = clonedTarget;
		}
		else {
			var clist = clonedTarget.getElementsByTagName( ename );
			clonedArea = clist[eoffset];
		}
		

		//Create marker nodes.
		var timeNow = new Date();
		var MARKT = " Mozile-Mark-Editable "+timeNow.toGMTString();
		var MARKC = "<!--"+MARKT+"-->";
		//Add marker before save content.
		var markerNode = doc.createComment(MARKT);
		if ( editableArea.hasChildNodes() ) {
			clonedArea.insertBefore(markerNode,clonedArea.firstChild);
		} else { //I don't think this is possible...
			clonedArea.appendChild(markerNode);
		}
		//Add marker after save content.
		var markerNode2 = doc.createComment(MARKT);
		clonedArea.appendChild(markerNode2);

		//Serialize nodes to a string 
		stringContent = objXMLSerializer.serializeToString(clonedTarget);
		//Extract required content
		var splitcontent = stringContent.split(MARKC);
		stringContent = splitcontent[1];
	} catch (e) {
		mozile.bug.write(f,1,"Error serializing data: "+e);
		stringContent = null;
	}
	return stringContent;
}

/*
	Save as an XML fragment. Namespaces and prefixes will be added.
*/
function mozileSerializeCurrentNS( editableArea ) {
	var f=["mozileSave.js","mozileSerializeCurrentNS"];
	var stringContent, dataToSave, dataToSaveRange;
	
	try {
		var objXMLSerializer = new XMLSerializer;
	} catch(e) {
		mozile.bug.write(f,0,"XMLSerializer error: "+e);
		return null;
	}
	try {
		var doc = editableArea.ownerDocument;
		dataToSaveRange = doc.createRange();
		dataToSaveRange.selectNodeContents(editableArea);
		dataToSave = dataToSaveRange.cloneContents();
		stringContent = objXMLSerializer.serializeToString( dataToSave );
		return stringContent;
	} catch (e) {
		mozile.bug.write(f,1,"Error serializing data: "+e);
		return null;
	}
}

/*
 Callback from Transport
 Handles the reporting back of save errors.

 reqObj
  .isError
	.status
	.statusText
	.document (XML document)

  POST only at the moment
	.isAbort
	.msgText
	.display
	.documentText
	.location
	.replace

  WEBDAV only
	.originalStatus
	.originalStatusText 
 */ 
function __mozileSaved(reqObj) 
{
	var f=["mozileSave.js","__mozileSaved"];

	if ( "status" in reqObj ) {mozile.bug.write(f,3,"status: "+reqObj.status);}
	if ( "statusText" in reqObj ) {mozile.bug.write(f,3,"statusText: "+reqObj.statusText);}
	if ( "msgText" in reqObj ) {mozile.bug.write(f,2,"msgText: "+reqObj.msgText);}
	if ( "originalStatus" in reqObj ) {mozile.bug.write(f,3,"originalStatus: "+reqObj.originalStatus);}
	if ( "originalStatusText" in reqObj ) {mozile.bug.write(f,3,"originalStatusText: "+reqObj.originalStatusText);}

	if ( ("isAbort" in reqObj) && reqObj.isAbort ) {
		mozile.bug.write(f,1,"Save aborted");
	}
	else if ( ("isError" in reqObj) ) {
		if ( !reqObj.isError ) {
			mozileTarget.document.MOZILE_CURRENT_CONFIG.saved = 'true';
			mozile.bug.write(f,1,"Save successful");
		}
		else {
			mozile.bug.write(f,1,"Save error.");
			if ( !("msgText" in reqObj) ) {
				/*This is the old error function*/
			  alert ("Couldn't save document \n" + reqObj.statusText);
			}
		}
	}
	// Currently message display only implemented for POST method.
	if ( ( ("display" in reqObj) && reqObj.display == "yes" ) ||
	     ( ("isError" in reqObj) && reqObj.isError===true && ("display" in reqObj) && reqObj.display != "no" ) ) {
		try {
			var SaveMsgWindow = window.openDialog(
				"chrome://mozile/content/XUL/savemsg.xul",
				"savemsg",
				"modal,dialog,centerscreen,chrome,resizable=yes",
				reqObj);
		}catch (e){
			mozile.bug.write(f,1,"Save message window open exception: "+e);
		}
	}
	
	if ("location" in reqObj) {
		if ( reqObj.location == "" ) {
			mozileTarget.location.reload(true);
		}
		else {
			var Aurl = mozileAbsoluteURL(reqObj.location, mozileTarget.location.href);
			if ( ("replace" in reqObj) && (reqObj.replace === true) ){
				mozileTarget.location.replace(Aurl);	// this will replace the current History location
			}else{
				mozileTarget.location.href = Aurl;	 // this will add a new History location
			}
		}
	}
}

