// A raw WebDAV interface
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
    
    var async = !(callback == null);
    if(async) {
      xhr.onreadystatechange = function(readyState) {
        if(readyState == 4 || readyState == null) { // complete. (null check is workaround for env.rhino.js).
          if(body()) { // Workaround for env.rhino.js
            callback(body());
          }
        }
      };
    }
    xhr.open(verb, url, async);
    xhr.setRequestHeader("Content-Type", "text/xml; charset=UTF-8");
    for (var header in headers) {
      xhr.setRequestHeader(header, headers[header]);
    }
    xhr.send(data);

    if(!async) {
      return body();
    }
  }
};

// An Object-oriented API around WebDAV.
WebDAV.Fs = function(rootUrl) {
  var fs = this;
  
  this.file = function(href) {
    if(/^http/.test(href)) {
      this.url = href;
    } else {
      this.url = rootUrl + href;
    }
    
    this.read = function(callback) {
      return WebDAV.GET(this.url, callback);
    };

    this.write = function(data, callback) {
      return WebDAV.PUT(this.url, data, callback);
    };

    this.rm = function(callback) {
      return WebDAV.DELETE(this.url, callback);
    };

    return this;
  };
  
  this.dir = function(href) {
    if(/^http/.test(href)) {
      this.url = href;
    } else {
      this.url = rootUrl + href;
    }

    this.children = function(callback) {
      var childrenFunc = function(doc) {
        if(doc.childNodes == null) {
          throw('No such directory: ' + url);
        }
        var result = [];
        for(var i=0; i< doc.childNodes.length; i++) {
          var response     = doc.childNodes[i];
          var href         = response.getElementsByTagName('D:href')[0].firstChild.nodeValue;
          var propstat     = response.getElementsByTagName('D:propstat')[0];
          var prop         = propstat.getElementsByTagName('D:prop')[0];
          var resourcetype = prop.getElementsByTagName('D:resourcetype')[0];
          var collection   = resourcetype.getElementsByTagName('D:collection')[0];

          if(collection) {
            result[i] = new fs.dir(href);
          } else {
            result[i] = new fs.file(href);
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

    this.rm = function(callback) {
      return WebDAV.DELETE(this.url, callback);
    };

    this.mkdir = function(callback) {
      return WebDAV.MKCOL(this.url, callback);
    };

    return this;
  };
  
  return this;
};
