// A raw WebDAV interface
// callbacks are all : function(body,error,xhrobj).  
var WebDAV = {
  GET: function(url, callback) {
    return this.request('GET', url, {}, null, 'text', callback);
  },

  PROPFIND: function(url, callback) {
    return this.request('PROPFIND', url, {Depth: "1"}, null, 'xml', callback);
  },

  MKCOL: function(url, callback) {
    return this.request('MKCOL', url, {}, null, 'text', callback);
  },
  
  DELETE: function(url, callback) {
    return this.request('DELETE', url, {}, null, 'text', callback);
  },

  PUT: function(url, data, callback) {
    return this.request('PUT', url, {}, data, 'text', callback);
  },
  
  COPY: function(url, desturl, callback) {
	return this.request('COPY',url, {"Destination":desturl, "Depth":'infinity'}, null, 'text', callback);
  },
  
  MOVE: function(url, desturl, callback) {
	return this.request('MOVE',url, {"Destination":desturl, "Depth":'infinity'}, null, 'text', callback);
  },
  
  
  request: function(verb, url, headers, data, type, callback) {
    var xhr = new XMLHttpRequest();
    var body = function() {
      var b = xhr.responseText;
      if (type == 'xml') {
        var xml = xhr.responseXML;
        if(xml) {
          b = xml.firstChild.nextSibling ? xml.firstChild.nextSibling : xml.firstChild;
        }
      }
      return b;
    };
    
    if(callback) {
      xhr.onreadystatechange = function() {
        if(xhr.readyState == 4) { // complete.
		  callback((body() || ""), xhr.status >= 400, xhr);
        }
      };
    }
    xhr.open(verb, url, !!callback);
    if(data != null) xhr.setRequestHeader("Content-Type", "text/xml; charset=UTF-8");
    for (var header in headers) {
      xhr.setRequestHeader(header, headers[header]);
    }
    xhr.send(data);

    if(!callback) {
      return body();
    }
  }
};

// An Object-oriented API around WebDAV.
WebDAV.Fs = function(rootUrl) {
	//Make url absolute
  if(!/^http/.test(rootUrl)) rootUrl = location.protocol + '//' + location.host + rootUrl;
	
  this.rootUrl = rootUrl.replace(/\/$/, ''); // Strip trailing slash;

  var fs = this;
  
  function addcommon(obj) {
		//Copy: callback will receive the new file/dir object or undefined if error occurs with xhr object to fetch details
		obj.copy = function(desturl, callback) {
		  return WebDAV.COPY(this.url, fs.urlFor(desturl), function(body,error,xhr) {
			  callback(error ? undefined : fs[obj.type](desturl),xhr);
		  });
		}
		
		obj.move = function(desturl, callback) {
		  return WebDAV.MOVE(this.url, fs.urlFor(desturl), function(body,error,xhr) {
			  callback(error ? undefined : fs[obj.type](desturl),xhr);
		  });
		}
		
		this.rm = function(callback) {
		  return WebDAV.DELETE(this.url, callback);
		}
  }
  
  this.file = function(href, urlisabsolute) {
    this.type = 'file';

    this.url = urlisabsolute ? href : fs.urlFor(href);;

    this.name = fs.nameFor(this.url);

    this.read = function(callback) {
      return WebDAV.GET(this.url, callback);
    };

    this.write = function(data, callback) {
      return WebDAV.PUT(this.url, data, callback);
    };

	addcommon(this);
	
    return this;
  };
  
  this.dir = function(href,urlisabsolute) {
    this.type = 'dir';

    this.url = urlisabsolute ? href : fs.urlFor(href);

    this.name = fs.nameFor(this.url);

    this.children = function(callback) {
      var childrenFunc = function(doc) {
        if(doc.childNodes == null) {
          throw('No such directory: ' + url);
        }
        var result = [];
        // Start at 1, because the 0th is the same as self.
        for(var i=1; i< doc.children.length; i++) {
          var response     = doc.children[i];
          var href         = response.getElementsByTagNameNS('DAV:','href')[0].firstChild.nodeValue;
          href = href.replace(/\/$/, ''); // Strip trailing slash
          var propstat     = response.getElementsByTagNameNS('DAV:','propstat')[0];
          var prop         = propstat.getElementsByTagNameNS('DAV:','prop')[0];
          var resourcetype = prop.getElementsByTagNameNS('DAV:','resourcetype')[0];
          var collection   = resourcetype.getElementsByTagNameNS('DAV:','collection')[0];

          if(collection) {
            result[i-1] = new fs.dir(href,true);
          } else {
            result[i-1] = new fs.file(href,true);
          }
        }
        return result;
      };

      if(callback) {
        WebDAV.PROPFIND(this.url, function(doc) {
          callback(childrenFunc(doc));
        });
      } else {
        return childrenFunc(WebDAV.PROPFIND(this.url));
      }
    };

    addcommon(this);

    this.mkdir = function(callback) {
      return WebDAV.MKCOL(this.url, callback);
    };

    return this;
  };
  
  this.urlFor = function(href) {
    return (/^http/.test(href) ? href : this.rootUrl + href);
  };
  
  this.nameFor = function(url) {
    return url.replace(/.*\/(.*)/, '$1');
  };

  return this;
};
