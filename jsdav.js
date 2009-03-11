/******************************************************************************
* Version: MPL 1.1
*
* The contents of this file are subject to the Mozilla Public License Version
* 1.1 (the "License"); you may not use this file except in compliance with
* the License. You may obtain a copy of the License at
* http://www.mozilla.org/MPL/
*
* Software distributed under the License is distributed on an "AS IS" basis,
* WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
* for the specific language governing rights and limitations under the
* License.
*
* The Original Code is Twingle.
*
* The Initial Developer of the Original Code is Paul Everitt.
* Portions created by the Initial Developer are Copyright (C) 2003
* the Initial Developer. All Rights Reserved.
*
* Contributor(s): Stephan Richter
*
******************************************************************************
WebDAV specific methods.

Features:

  PROPFIND

    - Responses are received and parsed.

    - propfind XML is completely generatable using object tree.

  PROPPATCH

    - Responses received and parsed

    - propertyupdate XML is completely generatable using object tree.

  MKCOL

    - Creates new collection (folder/directory/container).

  GET

    - Returns the request text

  HEAD

    - Returns the request object, so that headers can be looked up individually.

  OPTIONS

    - Check the supportion operations on the server.

  DELETE

    - Deletes resource on server and returns properly.

  COPY

    - Server copies objects.

    - Depth, Overwrite Headers implemented.

  MOVE

    - Server moves objects.

    - Depth, Overwrite Headers implemented.


To do:

  PROPFIND

    - Handle negative responses.

  PROPPATCH

    - Handle negative responses.

  MKCOL

    - Supposely, MKCOL should allow its body to be some sort of XML. But the
      specs do not tell us how this should look like. Does anyone have a clue?

  GET

    - Handle failures and errors.

  HEAD

    - Should generate an array of all header names and values.

    - Handle failures.

  DELETE

    - Handle errors approriately.

  COPY

    - Handle errors approriately.

  MOVE

    - Handle errors approriately.

  LOCK

    - Implement Handler.

    - Implement Timeout header.

    - Implement Authorization header.

    - Implement If header.

  UNLOCK

    - Implement Handler.

    - Implement Lock-Token Header.

$Id: jsdav.js,v 1.5 2006/10/29 18:04:46 dayala Exp $

******************************************************************************/

// Some constants
const DAV_RESOURCE_DEPTH = '0';
const DAV_CHILDREN_DEPTH = '1';
const DAV_INFINITY_DEPTH = 'infinity';

const DAV_TIMETYPE_SECOND = 'Second-';
const DAV_TIMETYPE_INFINITE = 'Infinite';
const DAV_TIMETYPE_EXTEND = 'Extend';

const DAV_SHARED_LOCKSCOPE = 'shared';
const DAV_EXCLUSIVE_LOCKSCOPE = 'exclusive';

const DAV_WRITE_LOCKTYPE = 'write';

const xml_decl = '<?xml version="1.0" encoding="utf-8" ?>\n';

/* WebDAV Status Code Extensions

   See http://asg.web.cmu.edu/rfc/rfc2518.html#sec-10
*/
var statusCodes = new Array();
statusCodes[102] = 'Processing';
statusCodes[207] = 'Multi-Status';
statusCodes[422] = 'Unprocessable Entity';
statusCodes[423] = 'Locked';
statusCodes[424] = 'Failed Dependency';
statusCodes[507] = 'Insufficient Storage';


function serialize(xml) {
    var serializer = new XMLSerializer();
    var doc = document.implementation.createDocument("DAV:", "dummy", null);
    var node = doc.documentElement;
    xml.createXML(node, doc);
    return xml_decl + serializer.serializeToString(node.firstChild);
}


function DavClient() {
    /* This library intends to be a complete implementation of the WebDAV RFC.

       See http://asg.web.cmu.edu/rfc/rfc2518.html#sec-8.6
    */
    this.request = new XMLHttpRequest();
}

/* Define read-only responseObjects attribute that contains an object tree of
   the returned XML.
*/
DavClient.prototype.__defineGetter__(
    'responseObjects',
		function() {
			if (this.request.responseXML) {
				status = new DavMultiStatus();
				status.parseXML(this.request.responseXML.documentElement);
				return status;
			}
			return undefined;
		}
);

DavClient.prototype.PROPFIND = function(url, propfind, depth) {
    /* Implementation of WebDAV command PROPFIND.

       See http://asg.web.cmu.edu/rfc/rfc2518.html#sec-8.1
    */

    // Make sure we have a URL
    if (!url)
	throw new Error("You must supply a URL.");

    // Prepare the request
    this.request.open("PROPFIND", url);
    this.request.setRequestHeader("Content-type", "text/xml");

    // look for optional Depth Header
    if (!depth)
       depth = 0;

    this.request.setRequestHeader('Depth', this.createDepthHeader(depth))

    // request body optional (if not, all names and values are returned)
    if (!propfind)
	this.request.send("");
    else
	this.request.send(serialize(propfind));

    return;
}


DavClient.prototype.PROPPATCH = function(url, propertyupdate) {
    /* Implementation of WebDAV command PROPPATCH.

       See http://asg.web.cmu.edu/rfc/rfc2518.html#sec-8.2
    */
    // Make sure we have a URL
    if (!url)
	throw new Error("You must supply a URL.");

    this.request.open("PROPPATCH", url);
    this.request.setRequestHeader("Content-type", "text/xml");
    this.request.send(serialize(propertyupdate));
}


DavClient.prototype.MKCOL = function(url) {
    /* Implementation of WebDAV command MKCOL.

       See http://asg.web.cmu.edu/rfc/rfc2518.html#sec-8.3
    */
    // Make sure we have a URL
    if (!url)
	throw new Error("You must supply a URL.");

    this.request.open("MKCOL", url);
    this.request.setRequestHeader("Content-type", "text/xml");
    // XXX: Supposely a message body is possible, but the specs were
    //      incredibly unclear about the form of the message
    this.request.send("");
}


DavClient.prototype.GET = function(url) {
    /* Implementation of WebDAV command GET.

       See http://asg.web.cmu.edu/rfc/rfc2518.html#sec-8.4
    */
    // Make sure we have a URL
    if (!url)
	throw new Error("You must supply a URL.");

    this.request.open("GET", url);
    this.request.setRequestHeader("Content-type", "text/xml");
    this.request.send("");
}


DavClient.prototype.HEAD = function(url) {
    /* Implementation of WebDAV command HEAD.

       See http://asg.web.cmu.edu/rfc/rfc2518.html#sec-8.4
    */
    // Make sure we have a URL
    if (!url)
	throw new Error("You must supply a URL.");

    this.request.open("HEAD", url);
    this.request.setRequestHeader("Content-type", "text/xml");
    this.request.send("");
}


DavClient.prototype.OPTIONS = function(url) {
    /* Implementation of WebDAV command OPTIONS.

       See http://asg.web.cmu.edu/rfc/rfc2518.html
    */
    // Make sure we have a URL
    if (!url)
	throw new Error("You must supply a URL.");

    this.request.open("OPTIONS", url);
    this.request.send("");
}


DavClient.prototype.POST = function(url, content, headers) {
    /* Implementation of WebDAV command POST.

       See http://asg.web.cmu.edu/rfc/rfc2518.html#sec-8.5
    */
    if (!url)
	throw new Error("You must supply a URL.");

}


DavClient.prototype.DELETE = function(url) {
    /* Implementation of WebDAV command DELETE.

       See http://asg.web.cmu.edu/rfc/rfc2518.html#sec-8.6

       - Must act as depth=infinity (but no Depth header)
    */
    if (!url)
	throw new Error("You must supply a URL.");

    this.request.open("DELETE", url);
    this.request.setRequestHeader("Content-type", "text/xml");
    this.request.send("");
}


DavClient.prototype.PUT = function(url, content) {
    /* Implementation of WebDAV command PUT.

       See http://asg.web.cmu.edu/rfc/rfc2518.html#sec-8.7
       and http://asg.web.cmu.edu/rfc/rfc2068.html#sec-9.6
    */
    if (!url)
	throw new Error("You must supply a URL.");

    this.request.open("PUT", url);
    this.request.setRequestHeader("Content-type", "text/xml");
    this.request.send(content);
}


DavClient.prototype.COPY = function(url, dest, behavior, depth, overwrite) {
    /* Implementation of WebDAV command COPY.

       See http://asg.web.cmu.edu/rfc/rfc2518.html#sec-8.8
    */
    if (!url)
	throw new Error("You must supply a URL.");

    this.request.open("COPY", url);
    this.request.setRequestHeader("Content-type", "text/plain");
    this.request.setRequestHeader("Destination",
			     this.createDestinationHeader(dest));
    // Set Overwrite header
    if (!overwrite)
	this.request.setRequestHeader('Overwrite',
				 this.createOverwriteHeader(overwrite));
    // Set Depth header
    if (!depth)
	this.request.setRequestHeader('Depth',
				 this.createDepthHeader(depth));

    // Send request
    if (!behavior)
	this.request.send("");
    else
	this.request.send(behavior.createXML());
}


DavClient.prototype.MOVE = function(url, dest, behavior, depth, overwrite) {
   /* Implementation of WebDAV command MOVE.

       See http://asg.web.cmu.edu/rfc/rfc2518.html#sec-8.9
    */
    if (!url)
	throw new Error("You must supply a URL.");

    this.request.open("MOVE", url);
    this.request.setRequestHeader("Content-type", "text/xml");
    this.request.setRequestHeader("Destination",
			     this.createDestinationHeader(dest));
    // Set Overwrite header
    if (!overwrite)
	this.request.setRequestHeader('Overwrite',
				 this.createOverwriteHeader(overwrite));
    // Set Depth header
    if (!depth)
	this.request.setRequestHeader('Depth',
				 this.createDepthHeader(depth));

    // Send request
    if (!behavior)
	this.request.send("");
    else
	this.request.send(behavior.createXML());
}


DavClient.prototype.LOCK = function(url, lockinfo, authorization,
				    ifclause, depth, callback) {
    /* Implementation of WebDAV command LOCK.

       See http://asg.web.cmu.edu/rfc/rfc2518.html#sec-8.10
    */
    if (!url)
	throw new Error("You must supply a URL.");

    this.request.open("LOCK", url);
    this.request.setRequestHeader("Content-type", "text/xml");

    // Set Depth header
    if (!depth)
	this.request.setRequestHeader('Depth',
				 this.createDepthHeader(depth));

    // Send request
    this.request.send(lockinfo.createXML());
}


DavClient.prototype.UNLOCK = function(url) {
    /* Implementation of WebDAV command UNLOCK.

       See http://asg.web.cmu.edu/rfc/rfc2518.html#sec-8.11
    */
    if (!url)
	throw new Error("You must supply a URL.");

    this.request.open("UNLOCK", url);
    this.request.setRequestHeader("Content-type", "text/xml");
    this.request.send(lockinfo.createXML());
}


DavClient.prototype.createDAVHeader = function(classes) {
    /* Creates a DAV Header.

      See http://asg.web.cmu.edu/rfc/rfc2518.html#sec-9.1

      Example: 'DAV:1,2'
    */
    var header = "";
    for (var index = 0; index < classes.length; index++) {
	header += classes[index];
	if (index != classes[length])
	    header += ",";
    }
    return header;
}


DavClient.prototype.createDepthHeader = function(depth) {
    /* Creates a Depth Header.

      See http://asg.web.cmu.edu/rfc/rfc2518.html#sec-9.2
    */
    // XXX: Check for correct depth and raise exception if necessary
    return depth;
}

DavClient.prototype.createDestinationHeader = function(absoluteURI) {
    /* Creates a Destination Header.

      See http://asg.web.cmu.edu/rfc/rfc2518.html#sec-9.3
    */
    return absoluteURI;
}


DavClient.prototype.createIfHeader = function() {
    /* Creates a If Header.

      See http://asg.web.cmu.edu/rfc/rfc2518.html#sec-9.4
    */

}


DavClient.prototype.createLockTokenHeader = function(codedURL) {
    /* Creates a Lock-Token Header.

      See http://asg.web.cmu.edu/rfc/rfc2518.html#sec-9.5
    */
    return codedURL;
}


DavClient.prototype.createOverwriteHeader = function(bool) {
    /* Creates an Overwrite Header.

      See http://asg.web.cmu.edu/rfc/rfc2518.html#sec-9.6
    */
    if (bool == true)
	return "T";
    else
	return "F";
}


DavClient.prototype.handleStatusURIHeader = function(header) {
    /* Handle a Status-URI Response Header.

      See http://asg.web.cmu.edu/rfc/rfc2518.html#sec-9.7
    */
    // Should return statusCode and CodedURL

}


DavClient.prototype.createTimeoutHeader = function(unit, value) {
    /* Creates an Timeout Request Header.

       See http://asg.web.cmu.edu/rfc/rfc2518.html#sec-9.8
    */
    return unit+'-'+value;
}


/* Data structure for the DAV XML Elements */

function DavActiveLock(scope, type, depth, owner, timeout, locktoken) {
    /* Implementation of activelock XML Element.

       See http://asg.web.cmu.edu/rfc/rfc2518.html#sec-12.1
    */
    this.lockscope = scope || null;
    this.locktype = type || null;
    this.depth = depth || null;
    this.owner = owner || null;
    this.timeout = timeout || null;
    this.locktoken = locktoken || null;
}


DavActiveLock.prototype = {
    getLockScope: function() {
	return this.lockscope;
    },
    getLockType: function() {
	return this.locktype;
    },
    getDepth: function() {
	return this.depth;
    },
    getOwner: function() {
	return this.owner;
    },
    getTimeout: function() {
	return this.timeout;
    },
    getLockToken: function() {
	return this.locktoken;
    },
    setLockScope: function(scope) {
	this.lockscope = scope;
    },
    setLockType: function(type) {
	this.locktype = type;
    },
    setDepth: function(depth) {
	this.depth = depth;
    },
    setOwner: function(owner) {
	this.owner = owner;
    },
    setTimeout: function(timeout) {
	this.timeout = timeout;
    },
    setLockToken: function(token) {
	this.locktoken = token;
    },
    parseXML: function(node) {
	this.xmlNode = node;
	for (var index = 0; index < node.childNodes.length; index++) {
	    sub = node.childNodes[index];
	    if (sub.localName == 'lockscope') {
		this.lockscope = new DavLockScope();
		this.lockscope.parseXML(sub);
	    }
	    if (sub.localName == 'locktype') {
		this.locktype = new DavLockType();
		this.locktype.parseXML(sub);
	    }
	    if (sub.localName == 'depth') {
		this.depth = new DavDepth();
		this.depth.parseXML(sub);
	    }
	    if (sub.localName == 'owner') {
		this.owner = new DavOwner();
		this.owner.parseXML(sub);
	    }
	    if (sub.localName == 'timeout') {
		this.timeout = new DavTimeout();
		this.timeout.parseXML(sub);
	    }
	    if (sub.localName == 'locktoken') {
		this.locktoken = new DavLockToken();
		this.locktoken.parseXML(sub);
	    }
	}

    },
    createXML: function(parent, doc) {
	var node = doc.createElementNS('DAV:', 'activelock');
	parent.appendChild(node);
	node.appendChild(this.lockscope.createXML(node, doc));
	node.appendChild(this.locktype.createXML(node, doc));
	node.appendChild(this.depth.createXML(node, doc));
	node.appendChild(this.owner.createXML(node, doc));
	node.appendChild(this.timeout.createXML(node, doc));
	node.appendChild(this.locktoken.createXML(node, doc));
    }
}

function DavDepth(value) {
    /* Implementation of depth XML Element.

       See http://asg.web.cmu.edu/rfc/rfc2518.html#sec-12.1.1
    */
    // The default value should be the simple resource depth '0'
    if (!value)
	value = DAV_RESOURCE_DEPTH;
    this.setValue(value);
}

DavDepth.prototype = {
    getValue: function() {
	return this.value;
    },
    setValue: function(value) {
	if (value in [DAV_RESOURCE_DEPTH, DAV_CHILDREN_DEPTH,
		      DAV_INFINITY_DEPTH]) {
	    this.value = value;
        } else {
	    throw new DavInvalidDepthValueError(value);
	}
    },
    parseXML: function(node) {
	this.xmlNode = node;
	this.value = node.firstChild.nodeValue;
    },
    createXML: function(parent, doc) {
	var node = doc.createElementNS('DAV:', 'depth');
	parent.appendChild(node);
	node.appendChild(doc.createTextNode(this.value));
    }
}


function DavLockToken(href) {
    /* Implementation of locktoken XML Element.

       See http://asg.web.cmu.edu/rfc/rfc2518.html#sec-12.1.2
    */
    if (!href)
	href = null;
    this.setHref(href);
}

DavLockToken.prototype = {
    getHref: function() {
	return this.href;
    },
    setHref: function(href) {
	if (typeof href == 'object') {
	    this.href = href;
	} else {
	    throw new DavWrongTypeError('object', typeof href);
	}
    },
    parseXML: function(node) {
	this.xmlNode = node;
	for (var index = 0; index < node.childNodes.length; index++) {
	    sub = node.childNodes[index];
	    if (sub.localName == 'href') {
		this.href = new DavHref();
		this.href.parseXML(sub)
	    }
	}
    },
    createXML: function(parent, doc) {
	var node = doc.createElementNS('DAV:', 'locktoken');
	parent.appendChild(node);
	this.href.createXML(node, doc);
    }
}


function DavTimeout(type, value) {
    /* Implementation of timeout XML Element.

       See http://asg.web.cmu.edu/rfc/rfc2518.html#sec-12.1.3
    */
    // Handle default behavior
    if (!type)
	type = DAV_TIMETYPE_SECOND;

    this.setTimeout(type, value);
}

DavTimeout.prototype = {
    getValue: function() {
	return this.value;
    },
    getType: function() {
	return this.type;
    },
    setTimeout: function(type, value) {
	this.type = type;
	if ((type == DAV_TIMETYPE_SECOND) && (typeof value != 'number'))
	    value = 0;
	if (type == DAV_TIMETYPE_INFINITE)
	    value = null;
	if ((type == DAV_TIMETYPE_EXTEND) && (typeof value != 'string'))
	    value = '';
	this.value = value;
    },
    parseXML: function(node) {
	this.xmlNode = node;
	var value_str = node.firstChild.nodeValue.split('-');
	this.unit = value_str[0];
	this.value = value_str[1];
    },
    createXML: function(parent, doc) {
	var node = doc.createElementNS('DAV:', 'timeout');
	parent.appendChild(node);
	value = this.value;
	if (value == null)
	    value = '';
	node.appendChild(doc.createTextNode(this.type+value));
    }
}


function DavCollection() {
    /* Implementation of collection XML Element.

       See http://asg.web.cmu.edu/rfc/rfc2518.html#sec-12.2
    */
}

DavCollection.prototype = {
    parseXML: function(node) {
	this.xmlNode = node;
    },
    createXML: function(parent, doc) {
	var node = doc.createElementNS('DAV:', 'collection');
	parent.appendChild(node);
    }
}


function DavHref(url) {
    /* Implementation of href XML Element.

       See http://asg.web.cmu.edu/rfc/rfc2518.html#sec-12.3
    */
    if (!url)
	url = null;
    this.url = url;
}

DavHref.prototype = {
    getURL: function() {
	return this.url;
    },
    setURL: function(url) {
	this.url = url;
    },
    parseXML: function(node) {
	this.xmlNode = node;
	this.url = node.firstChild.nodeValue
    },
    createXML: function(parent, doc) {
	var node = doc.createElementNS('DAV:', 'href');
	node.appendChild(doc.createTextNode(this.url));
	parent.appendChild(node);
    }
}


function DavLink() {
    /* Implementation of link XML Element.

       See http://asg.web.cmu.edu/rfc/rfc2518.html#sec-12.4
    */
    this.sources = new Array();
    this.destinations = new Array();
}

DavLink.prototype = {
    getSources: function() {
	return this.sources;
    },
    addSource: function(src) {
	this.sources[this.sources.length] = src;
    },
    getDestinations: function() {
	return this.sources;
    },
    addDestination: function(dst) {
	this.destinations[this.destinations.length] = dst;
    },
    parseXML: function(node) {
	this.xmlNode = node;
	for (var index = 0; index < node.childNodes.length; index++) {
	    sub = node.childNodes[index];
	    if (sub.localName == 'src') {
		src = new DavSrc();
		src.parseXML(sub);
		this.sources[this.sources.length] = src;
	    }
	    if (sub.localName == 'dst') {
		dst = new DavDst();
		dst.parseXML(sub);
		this.destinations[this.destinations.length] = dst;
	    }
	}
    },
    createXML: function(parent, doc) {
	var node = doc.createElementNS('DAV:', 'link');
	var index;
	for (index = 0; index < this.sources.length; index++) {
	    this.sources[index].createXML(node, doc);
	}
	for (index = 0; index < this.destinations.length; index++) {
	    this.destinations[index].createXML(node, doc);
	}
	parent.appendChild(node);
    }
}


function DavDst(url) {
    /* Implementation of dst XML Element.

       See http://asg.web.cmu.edu/rfc/rfc2518.html#sec-12.4.1
    */
    if (!url)
	url = null;
    this.url = url;
}

DavDst.prototype = {
    getURL: function() {
	return this.url;
    },
    setURL: function(url) {
	this.url = url;
    },
    parseXML: function(node) {
	this.xmlNode = node;
	this.url = node.firstChild.nodeValue
    },
    createXML: function(parent, doc) {
	var node = doc.createElementNS('DAV:', 'dst');
	node.appendChild(doc.createTextNode(this.url));
	parent.appendChild(node);
    }
}


function DavSrc(url) {
    /* Implementation of src XML Element.

       See http://asg.web.cmu.edu/rfc/rfc2518.html#sec-12.4.2
    */
    if (!url)
	url = null;
    this.url = url;
}

DavSrc.prototype = {
    getURL: function() {
	return this.url;
    },
    setURL: function(url) {
	this.url = url;
    },
    parseXML: function(node) {
	this.xmlNode = node;
	this.url = node.firstChild.nodeValue
    },
    createXML: function(parent, doc) {
	var node = doc.createElementNS('DAV:', 'src');
	node.appendChild(doc.createTextNode(this.url));
	parent.appendChild(node);
    }
}


function DavLockEntry(scope, type) {
    /* Implementation of lockentry XML Element.

       See http://asg.web.cmu.edu/rfc/rfc2518.html#sec-12.5
    */
    if (!scope)
	scope = new DavLockScope();
    if (!type)
	type = new DavLockType();
    this.setLockScope(scope);
    this.setLockType(type);
}

DavLockEntry.prototype = {
    getLockScope: function() {
	return this.lockscope;
	    },
    getLockType: function() {
	return this.locktype;
	    },
    setLockScope: function(scope) {
	this.lockscope = scope;
	    },
    setLockType: function(type) {
	this.locktype = type;
	    },
    parseXML: function(node) {
	this.xmlNode = node;
	for (var index = 0; index < node.childNodes.length; index++) {
	    sub = node.childNodes[index];
	    if (sub.localName == 'lockscope') {
		this.lockscope = new DavLockScope();
		this.lockscope.parseXML(sub);
	    }
	    if (sub.localName == 'locktype') {
		this.lockType = new DavLockType();
		this.lockType.parseXML(sub);
	    }
	}

    },
    createXML: function(parent, doc) {
	var node = doc.createElementNS('DAV:', 'lockentry');
	this.lockscope.createXML(node, doc);
	this.locktype.createXML(node, doc);
	parent.appendChild(node);
    }
}


function DavLockInfo(scope, type, owner) {
    /* Implementation of lockinfo XML Element.

       See http://asg.web.cmu.edu/rfc/rfc2518.html#sec-12.6
    */
    this.lockscope = scope;
    this.locktype = type;
    this.owner = owner;
}

DavLockInfo.prototype = {
    getLockScope: function() {
	return this.lockscope;
	    },
    getLockType: function() {
	return this.locktype;
	    },
    getOwner: function() {
	return this.owner;
    },
    setLockScope: function(scope) {
	this.lockscope = scope;
	    },
    setLockType: function(type) {
	this.locktype = type;
	    },
    setOwner: function(owner) {
	this.owner = owner;
    },
    parseXML: function(node) {
	this.xmlNode = node;
	for (var index = 0; index < node.childNodes.length; index++) {
	    sub = node.childNodes[index];
	    if (sub.localName == 'lockscope') {
		this.lockscope = new DavLockScope();
		this.lockscope.parseXML(sub);
	    }
	    if (sub.localName == 'locktype') {
		this.lockType = new DavLockType();
		this.lockType.parseXML(sub);
	    }
	    if (sub.localName == 'owner') {
		this.owner = new DavOwner();
		this.owner.parseXML(sub);
	    }
	}

    },
    createXML: function() {
	var doc = document.implementation.createDocument("DAV:", "D:lockinfo",
						     null);
	var node = doc.documentElement;
	node.appendChild(this.lockscope.createXML(node, doc));
	node.appendChild(this.locktype.createXML(node, doc));
	node.appendChild(this.owner.createXML(node, doc));
	return doc
    }
}


function DavLockScope(scope) {
    /* Implementation of lockscope XML Element.

       See http://asg.web.cmu.edu/rfc/rfc2518.html#sec-12.7
    */
    if (!scope)
	scope = DAV_SHARED_LOCKSCOPE;
    this.setScope(scope);
}

DavLockScope.prototype = {
    getScope: function() {
	return this.scope;
    },
    isExclusive: function() {
	return this.scope == DAV_EXCLUSIVE_LOCKSCOPE;
    },
    isShared: function() {
	return this.scope == DAV_SHARED_LOCKSCOPE;
    },
    setScope: function(scope) {
	if ((scope == DAV_EXCLUSIVE_LOCKSCOPE) ||
	    (scope == DAV_SHARED_LOCKSCOPE)) {
	    this.scope = scope;
	}
	else
	    throw new DavInvalidScopeValueError(scope);
    },
    parseXML: function(node) {
	this.xmlNode = node;
	this.scope = node.firstChild.localName;
    },
    createXML: function(parent, doc) {
	var node = doc.createElementNS('DAV:', 'lockscope');
	node.appendChild(doc.createElementNS('DAV:', this.scope));
	parent.appendChild(node);
    }
}


function DavLockType(type) {
    /* Implementation of locktype XML Element.

       See http://asg.web.cmu.edu/rfc/rfc2518.html#sec-12.8
    */
    if (!type)
	type = DAV_WRITE_LOCKTYPE;
    this.setType(type);
}

DavLockType.prototype = {
    getType: function() {
	return this.type;
    },
    setType: function(type) {
	if (type == DAV_WRITE_LOCKTYPE)
	    this.type = type;
	else
	    DavInvalidLockTypeError(type);
    },
    isWrite: function() {
	return this.type == DAV_WRITE_LOCKTYPE;
    },
    parseXML: function(node) {
	this.xmlNode = node;
	for (var index = 0; index < node.childNodes.length; index++) {
	    sub = node.childNodes[index];
	    if (sub.localName != null)
		this.type = sub.localName;
	}
    },
    createXML: function(parent, doc) {
	var node = doc.createElementNS('DAV:', 'locktype');
	node.appendChild(doc.createElementNS('DAV:', this.type));
	parent.appendChild(node);
    }
}


function DavMultiStatus() {
    /* Implementation of multistatus XML Element.

       See http://asg.web.cmu.edu/rfc/rfc2518.html#sec-12.9
    */
    this.responsedescription = "";
    this.responses = new Array();
}

DavMultiStatus.prototype = {
    getDescription: function() {
	return this.responsedescription;
	    },
    getResponses: function() {
	return this.responses;
    },
    parseXML: function(node) {
	this.xmlNode = node;
	for (var index=0; index < node.childNodes.length; index++) {
	    sub = node.childNodes[index];
	    if (sub.localName == 'responsrdescription') {
		this.responsedescription = sub.firstChild.nodeValue
	    }
	    if (sub.localName == 'response') {
		var resp = new DavResponse();
		resp.parseXML(sub);
		this.responses[this.responses.length] = resp;
	    }
	}

    },
    createXML: function(parent, doc) {

    }
}


function DavResponse() {
    /* Implementation of response XML Element.

       See http://asg.web.cmu.edu/rfc/rfc2518.html#sec-12.9.1
    */
    this.responsedescription = "";
    this.href = null;
    this.propstats = new Array();
}

DavResponse.prototype = {
    getDescription: function() {
	return this.responsedescription;
	    },
    getHRef: function() {
	return this.href;
	    },
    getPropStats: function() {
	return this.propstats;
    },

    parseXML: function(node) {
	this.xmlNode = node;
	for (var index=0; index<node.childNodes.length; index++) {
	    sub = node.childNodes[index];
	    if (sub.localName == 'responsrdescription') {
		this.responsrdescription = sub.firstChild.nodeValue
	    }
	    if (sub.localName == 'href') {
		this.href = new DavHref();
		this.href.parseXML(sub);
	    }
	    if (sub.localName == 'propstat') {
	    	var stat = new DavPropStat();
	    	stat.parseXML(sub);
	    	this.propstats[this.propstats.length] = stat;
	    }
	}

    },
    createXML: function(parent, doc) {

    }
}

function DavPropStat() {
    /* Implementation of response XML Element.

       See http://asg.web.cmu.edu/rfc/rfc2518.html#sec-12.9.2
    */
    this.responsedescription = "";
    this.status = null;
    this.prop = null;
}

DavPropStat.prototype = {
    getDescription: function() {
	return this.responsedescription;
	    },
    getStatus: function() {
	return this.status;
	    },
    getProp: function() {
	return this.prop;
    },
    parseXML: function(node) {
	this.xmlNode = node;
	for (var index = 0; index < node.childNodes.length; index++) {
	    sub = node.childNodes[index];
	    if (sub.localName == 'responsrdescription') {
		this.responsrdescription = sub.firstChild.nodeValue
	    }
	    if (sub.localName == 'status') {
		this.status = sub.firstChild.nodeValue
	    }
	    if (sub.localName == 'prop') {
		this.prop = new DavProp();
		this.prop.parseXML(sub);
	    }
	}

    },
    createXML: function(parent, doc) {
    }
}


function DavOwner(name) {
    /* Implementation of owner XML Element.

       See http://asg.web.cmu.edu/rfc/rfc2518.html#sec-12.10
    */
    this.name = name;
}

DavOwner.prototype = {
    getName: function() {
	return this.name
    },
    setName: function(name) {
	this.name = name;
    },
    parseXML: function(node) {
	this.xmlNode = node;
	this.name = node.firstChild.nodeValue;
    },
    createXML: function(parent, doc) {
	node = doc.createElementNS('DAV:', 'owner');
	node.appendChild(doc.createTextNode(this.name));
	parent.appendChild(node);
    }
}


function DavProp() {
    /* Implementation of prop XML Element.

       See http://asg.web.cmu.edu/rfc/rfc2518.html#sec-12.11
    */
    this.properties = new Array();
}

DavProp.prototype = {
    getProperties: function() {
	return this.properties;
    },
    addProperty: function(name) {
	this.properties[this.properties.length] = name;
    },
    parseXML: function(node) {
	this.xmlNode = node;
	for (var index = 0; index < node.childNodes.length; index++) {
	    sub = node.childNodes[index];
	    if (sub.localName != null)
		this.properties[this.properties.length] = sub.localName;
	}
    },
    createXML: function(parent, doc) {
	node = doc.createElementNS('DAV:', 'prop');
	for (var index = 0; index < this.properties.length; index++) {
	    this.properties[index].createXML(node, doc);
	}
	parent.appendChild(node);
    }
}


function Property(ns, name, value) {
    /* the prop XML Element can contain numerous properties and other dav
    elements. In order to simplify the life of the end user, we provide a
    simple way of adding new property fields to the prop element. */

    this.namespace = ns || 'DAV:';
    this.name = name || null;
    this.value = value || null;
}

Property.prototype = {
    getNamespace: function() {
	return this.namespace;
    },
    getName: function() {
	return this.name;
    },
    getValue: function() {
	return this.value;
    },
    setNamespace: function(ns) {
	this.namespace = ns;
    },
    setName: function(name) {
	this.name = name;
    },
    setValue: function(value) {
	this.value = value;
    },
    createXML: function(parent, doc) {
	var node = doc.createElementNS(this.getNamespace(), this.getName());

	if (this.getValue())
	    node.appendChild(doc.createTextNode(this.getValue()));

	parent.appendChild(node);
    }
}



function DavPropertyBehavior(rule) {
    /* Implementation of propertybehavior XML Element.

       See http://asg.web.cmu.edu/rfc/rfc2518.html#sec-12.12
    */
    this.rule = rule;
}

DavPropertyBehavior.prototype = {
    getRule: function() {
	return this.rule;
    },
    setRule: function(rule) {
	this.rule = rule;
    },
    getOmit: function() {
	if (this.rule instanceof Omit)
	    return this.rule;
	return null;
    },
    getKeepAlive: function() {
	if (this.rule instanceof KeepAlive)
	    return this.rule;
	return null;
    },
    parseXML: function(node) {
	this.xmlNode = node;
	for (var index = 0; index < node.childNodes.length; index++) {
	    sub = node.childNodes[index];
	    if (sub.localName == 'omit') {
		this.rule = new DavOmit();
		this.rule.parseXML(sub);
	    }
	    if (sub.localName == 'keepalive') {
		this.rule = new DavKeepAlive();
		this.rule.parseXML(sub);
	    }
	}
    },
    createXML: function(parent, doc) {
	node = doc.createElementNS('DAV:', 'propertybehavior');
	this.rule.createXML(node, doc);
	parent.appendChild(node);
    }
}


function DavKeepAlive(all, hrefs) {
    /* Implementation of keepalive XML Element.

       See http://asg.web.cmu.edu/rfc/rfc2518.html#sec-12.12.1
    */
    this.all = all;
    this.hrefs = hrefs;
}

DavKeepAlive.prototype = {
    isKeepingAllAlive: function() {
	return this.all;
    },
    addHref: function(href) {
	this.hrefs[this.hrefs.length] = href;
    },
    getHrefs: function() {
	return this.hrefs;
    },
    parseXML: function(node) {
	this.xmlNode = node;
	for (var index = 0; index < node.childNodes.length; index++) {
	    sub = node.childNodes[index];
	    if (sub.localName != 'href') {
		href = new DavHref();
		href.parseXML(sub);
		this.hrefs[this.hrefs.length] = href;
	    }
	    if (sub.nodeValue != '*') {
		this.all = true;
	    }
	}
    },
    createXML: function(parent, doc) {
	node = doc.createElementNS('DAV:', 'propertybehavior');
	for (var index = 0; index < this.hrefs.length; index++)
	    this.hrefs[index].createXML(node, doc);
	if (this.all == true)
	        node.appendChild(doc.createTextNode("*"));
	parent.appendChild(node);
    }
}


function DavOmit() {
    /* Implementation of omit XML Element.

       See http://asg.web.cmu.edu/rfc/rfc2518.html#sec-12.12.2
    */
}

DavOmit.prototype = {
    parseXML: function(node) {
	this.xmlNode = node;
    },
    createXML: function(parent, doc) {
	node = doc.createElementNS('DAV:', 'omit');
	parent.appendChild(node);
    }
}


function DavPropertyUpdate() {
    /* Implementation of propertyupdate XML Element.

       See http://asg.web.cmu.edu/rfc/rfc2518.html#sec-12.13
    */
    this.removes = new Array();
    this.sets = new Array();
}

DavPropertyUpdate.prototype = {
    getRemoves: function() {
	return this.removes;
    },
    getSets: function() {
	return this.sets;
    },
    setRemove: function(remove) {
	this.removes[this.removes.length] = remove;
    },
    setSet: function(set) {
	this.sets[this.sets.length] = set;
    },
    removeProperty: function(prop) {
	this.setRemove(new DavRemove(prop));
    },
    setProperty: function(prop) {
	this.setSet(new DavSet(prop));
    },
    parseXML: function(node) {
	this.xmlNode = node;
	for (var index = 0; index < node.childNodes.length; index++) {
	    sub = node.childNodes[index];
	    if (sub.localName == 'remove') {
		remove = new DavRemove();
		remove.parseXML(set);
		this.removes[this.removes.length] = remove;
	    }
	    if (sub.localName == 'set') {
		set = new DavSet();
		set.parseXML(set);
		this.sets[this.sets.length] = set;
	    }
	}
    },
    createXML: function(parent, doc) {
	var node = doc.createElementNS("DAV:", "propertyupdate");
	var index;
	for (index = 0; index < this.removes.length; index++)
	    this.removes[index].createXML(node, doc);
	for (index = 0; index < this.sets.length; index++)
	    this.sets[index].createXML(node, doc);
	parent.appendChild(node);
    }
}

function DavRemove(prop) {
    /* Implementation of remove XML Element.

       See http://asg.web.cmu.edu/rfc/rfc2518.html#sec-12.13.1
    */
    this.prop = prop;
}

DavRemove.prototype = {
    setProp: function(prop) {
	this.prop = prop;
    },
    getProp: function() {
	return this.prop;
    },
    parseXML: function(node) {
	this.xmlNode = node;
	this.prop = new DavProp();
	this.prop.parseXML(node.firstChild);
    },
    createXML: function(parent, doc) {
	node = doc.createElementNS('DAV:', 'remove');
	this.prop.createXML(node, doc);
	parent.appendChild(node);
    }
}


function DavSet(prop) {
    /* Implementation of set XML Element.

       See http://asg.web.cmu.edu/rfc/rfc2518.html#sec-12.13.2
    */
    this.prop = prop;
}

DavSet.prototype = {
    setProp: function(prop) {
	this.prop = prop;
    },
    getProp: function() {
	return this.prop;
    },
    parseXML: function(node) {
	this.xmlNode = node;
	this.prop = new Prop();
	this.prop.parseXML(node.firstChild);
    },
    createXML: function(parent, doc) {
	node = doc.createElementNS('DAV:', 'set');
	this.prop.createXML(node, doc);
	parent.appendChild(node);
    }
}



function DavPropFind() {
    /* Implementation of propfind XML Element.

       See http://asg.web.cmu.edu/rfc/rfc2518.html#sec-12.14
    */
    this.allprop = false;
    this.propname = false;
    this.props = new DavProp();
}

DavPropFind.prototype = {
    addProperty: function(prop) {
	if ((this.allprop == false) && (this.propname == false))
	    this.props.addProperty(prop);
    },

    setAllProp: function() {
	if ((this.props.length == 0) && (this.propname == false))
	    this.allprop = true;
    },

    setPropName: function() {
	if ((this.props.length == 0) && (this.allprop == false))
	    this.propname = true;
    },

    createXML: function(parent, doc) {
	var node = doc.createElementNS('DAV:', 'propfind');
	if (this.allprop == true)
	    node.appendChild(doc.createElementNS('DAV:', 'D:allprop'));

	if (this.propname == true)
	    node.appendChild(doc.createElementNS('DAV:', 'D:propname'));

	if (this.props.properties.length > 0) {
	    this.props.createXML(node, doc);
	}
	parent.appendChild(node);

    }
}


function DavCreationDate(value) {
    /* Implementation of creationdate XML Element.

       See http://asg.web.cmu.edu/rfc/rfc2518.html#sec-13.1
    */
    this.value = value;
}

DavCreationDate.prototype = {
    getValue: function() {
	return this.value;
    },
    setValue: function(value) {
	this.value = value;
    },
    parseXML: function(node) {
	this.xmlNode = node;
	this.value = node.firstChild.nodeValue;
    },
    createXML: function(parent, doc) {
	var node = doc.createElementNS('DAV:', 'creationdate');
	node.appendChild(doc.createTextNode(this.value));
	parent.appendChild(node);
    }
}


function DavDisplayName(value) {
    /* Implementation of displayname XML Element.

       See http://asg.web.cmu.edu/rfc/rfc2518.html#sec-13.2
    */
    this.value = value;
}

DavDisplayName.prototype = {
    getValue: function() {
	return this.value;
    },
    setValue: function(value) {
	this.value = value;
    },
    parseXML: function(node) {
	this.xmlNode = node;
	this.value = node.firstChild.nodeValue;
    },
    createXML: function(parent, doc) {
	var node = doc.createElementNS('DAV:', 'displayname');
	node.appendChild(doc.createTextNode(this.value));
	parent.appendChild(node);
    }
}


function DavGetContentLanguage(value) {
    /* Implementation of getcontentlanguage XML Element.

       See http://asg.web.cmu.edu/rfc/rfc2518.html#sec-13.3
    */
    this.value = value;
}

DavGetContentLanguage.prototype = {
    getValue: function() {
	return this.value;
    },
    setValue: function(value) {
	this.value = value;
    },
    parseXML: function(node) {
	this.xmlNode = node;
	this.value = node.firstChild.nodeValue;
    },
    createXML: function(parent, doc) {
	node = doc.createElementNS('DAV:', 'getcontentlanguage');
	node.appendChild(doc.createTextNode(this.value));
	parent.appendChild(node);
    }
}


function DavGetContentLength(value) {
    /* Implementation of getcontentlength XML Element.

       See http://asg.web.cmu.edu/rfc/rfc2518.html#sec-13.4
    */
    this.value = value;
}

DavGetContentLength.prototype = {
    getValue: function() {
	return this.value;
    },
    setValue: function(value) {
	this.value = value;
    },
    parseXML: function(node) {
	this.xmlNode = node;
	this.value = node.firstChild.nodeValue;
    },
    createXML: function(parent, doc) {
	node = doc.createElementNS('DAV:', 'getcontentlength');
	node.appendChild(doc.createTextNode(this.value));
	parent.appendChild(node);
    }
}


function DavGetContentType(value) {
    /* Implementation of getcontenttype XML Element.

       See http://asg.web.cmu.edu/rfc/rfc2518.html#sec-13.5
    */
    this.value = value;
}

DavGetContentType.prototype = {
    getValue: function() {
	return this.value;
    },
    setValue: function(value) {
	this.value = value;
    },
    parseXML: function(node) {
	this.xmlNode = node;
	this.value = node.firstChild.nodeValue;
    },
    createXML: function(parent, doc) {
	node = doc.createElementNS('DAV:', 'getcontenttype');
	node.appendChild(doc.createTextNode(this.value));
	parent.appendChild(node);
    }
}


function DavGetEtag(value) {
    /* Implementation of getetag XML Element.

       See http://asg.web.cmu.edu/rfc/rfc2518.html#sec-13.6
    */
    this.value = value;
}

DavGetEtag.prototype = {
    getValue: function() {
	return this.value;
    },
    setValue: function(value) {
	this.value = value;
    },
    parseXML: function(node) {
	this.xmlNode = node;
	this.value = node.firstChild.nodeValue;
    },
    createXML: function(parent, doc) {
	node = doc.createElementNS('DAV:', 'getetag');
	node.appendChild(doc.createTextNode(this.value));
	parent.appendChild(node);
    }
}


function DavGetLastModified(value) {
    /* Implementation of getlastmodified XML Element.

       See http://asg.web.cmu.edu/rfc/rfc2518.html#sec-13.7
    */
    this.value = value;
}

DavGetLastModified.prototype = {
    getValue: function() {
	return this.value;
    },
    setValue: function(value) {
	this.value = value;
    },
    parseXML: function(node) {
	this.xmlNode = node;
	this.value = node.firstChild.nodeValue;
    },
    createXML: function(parent, doc) {
	node = doc.createElementNS('DAV:', 'getlastmodified');
	node.appendChild(doc.createTextNode(this.value));
	parent.appendChild(node);
    }
}


function DavLockDiscovery() {
    /* Implementation of lockdiscovery XML Element.

       See http://asg.web.cmu.edu/rfc/rfc2518.html#sec-13.8
    */
    this.locks = new Array();
}

DavLockDiscovery.prototype = {
    getActiveLocks: function() {
	return this.locks;
    },
    addActiveLock: function(lock) {
	this.locks[this.locks.length] = lock;
    },
    parseXML: function(node) {
	this.xmlNode = node;
	for (var index = 0; index < node.childNodes.length; index++) {
	    sub = node.childNodes[index];
	    if (sub.localName == 'activelock') {
		lock = new DavActiveLock();
		lock.parseXML(sub);
		this.locks[this.locks.length] = lock;
	    }
	}
    },
    createXML: function(parent, doc) {
	node = doc.createElementNS('DAV:', 'lockdiscovery');
	for (var index = 0; index < this.locks.length; index++) {
	    this.locks[index].createXML(node, doc);
	}
	parent.appendChild(node);
    }
}


function DavResourceType(value) {
    /* Implementation of resourcetype XML Element.

       See http://asg.web.cmu.edu/rfc/rfc2518.html#sec-13.9
    */
    if (!value)
	value = '';
    this.value = value;
}

DavResourceType.prototype = {
    getValue: function() {
	return this.value;
    },
    setValue: function(value) {
	this.value = value;
    },
    parseXML: function(node) {
	this.xmlNode = node;
	this.value = node.firstChild.nodeValue;
    },
    createXML: function(parent, doc) {
	var node = doc.createElementNS('DAV:', 'resourcetype');
	node.appendChild(doc.createTextNode(this.value));
	parent.appendChild(node);
    }
}


function DavSource() {
    /* Implementation of source XML Element.

       See http://asg.web.cmu.edu/rfc/rfc2518.html#sec-13.10
    */
    this.links = new Array();
}

DavSource.prototype = {
    getLinks: function() {
	return this.links;
    },
    addLink: function(link) {
	this.links[this.links.length] = link;
    },
    parseXML: function(node) {
	this.xmlNode = node;
	for (var index = 0; index < node.childNodes.length; index++) {
	    sub = node.childNodes[index];
	    if (sub.localName == 'link') {
		link = new DavLink();
		link.parseXML(sub);
		this.links[this.links.length] = link;
	    }
	}
    },
    createXML: function(parent, doc) {
	var node = doc.createElementNS('DAV:', 'source');
	for (var index = 0; index < this.links.length; index++) {
	    this.links[index].createXML(node, doc);
	}
	parent.appendChild(node);
    }
}


function DavSupportedLock() {
    /* Implementation of supportedlock XML Element.

       See http://asg.web.cmu.edu/rfc/rfc2518.html#sec-13.11
    */
    this.entries = new Array();
}

DavSupportedLock.prototype = {
    getEntries: function() {
	return this.entries;
    },
    addEntry: function(entry) {
	this.entries[this.entries.length] = entry;
    },
    parseXML: function(node) {
	this.xmlNode = node;
	for (var index = 0; index < node.childNodes.length; index++) {
	    sub = node.childNodes[index];
	    if (sub.localName == 'lockentry') {
		entry = new DavLockEntry();
		entry.parseXML(sub);
		this.entries[this.entries.length] = entry;
	    }
	}
    },
    createXML: function(parent, doc) {
	var node = doc.createElementNS('DAV:', 'supportedlock');
	for (var index = 0; index < this.entries.length; index++) {
	    this.entries[index].createXML(node, doc);
	}
	parent.appendChild(node);
    }
}


/* jsdav specific exceptions */

function DavInvalidDepthValueError(value) {
    /* Handles invalid depth value errors. The constructor accepts the
     false value. */
    this.value = value;
}

DavInvalidDepthValueError.prototype = {
    serialize: function() {
	return ("The value '" + this.value + "' is not a valid depth. Use " +
                "one of the following values instead: 0, 1, infinity");
    }
}


function DavWrongTypeError(expected, received) {
    /* Handles wrong object type errors. */
    this.expected = expected;
    this.received = received;
}

DavWrongTypeError.prototype = {
    serialize: function() {
	return ("Expected object type to be [" + this.expected + "], but is [" +
	        this.received + "].");
    }
}


function DavInvalidScopeValueError(value) {
    /* Handles invalid scope value errors. The constructor accepts the
     false value. */
    this.value = value;
}

DavInvalidScopeValueError.prototype = {
    serialize: function() {
	return ("The value '" + this.value + "' is not a valid scope. Use " +
                "one of the following values instead: shared, exclusive");
    }
}


function DavInvalidLockTypeError(value) {
    /* Handles invalid lock type value errors. The constructor accepts the
     false value. */
    this.value = value;
}

DavInvalidLockTypeError.prototype = {
    serialize: function() {
	return ("The lock type '" + this.value + "' is not valid. Use " +
                "one of the following values instead: write");
    }
}
