// A raw WebDAV interface
var WebDav = {
  GET: function(url, callback) {
    return this.request('GET', url, null, 'text', callback);
  },

  PROPFIND: function(url, callback) {
    return this.request('PROPFIND', url, null, 'xml', callback);
  },

  MKCOL: function(url, callback) {
    return this.request('MKCOL', url, null, 'text', callback);
  },
  
  DELETE: function(url, callback) {
    return this.request('DELETE', url, null, 'text', callback);
  },

  PUT: function(url, data, callback) {
    return this.request('PUT', url, data, 'text', callback);
  },
  
  request: function(verb, url, data, type, callback) {
    var xhr = new XMLHttpRequest();
    var body = function() {
      var b = xhr.responseText;
      if (type == 'xml') {
        var xml = xhr.responseXML;
        if(xml) {
          b = (xml.firstChild.nextSibling) ? xml.firstChild.nextSibling : xml.firstChild;
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
      }
    }
    xhr.open(verb, url, async);
    xhr.setRequestHeader("Content-Type", "text/xml; charset=UTF-8");
    xhr.send(data);

    if(!async) {
      return body();
    }
  }
};

// An Object-oriented API around WebDav.
WebDav.Fs = {
  file: function(url) {
    this.url = url;
    
    this.read = function(callback) {
      return WebDav.GET(url, callback);
    };

    this.write = function(data, callback) {
      return WebDav.PUT(url, data, callback);
    };

    this.rm = function(callback) {
      return WebDav.DELETE(url, callback);
    };

    return this;
  },
  
  dir: function(url) {
    this.url = url;

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
            result[i] = new WebDav.Fs.dir(href);
          } else {
            result[i] = new WebDav.Fs.file(href);
          }
        }
        return result;
      };

      if(callback) {
        WebDav.PROPFIND(url, function(doc) {
          callback(childrenFunc(doc));
        });
      } else {
        return childrenFunc(WebDav.PROPFIND(url));
      }
    };

    this.rm = function(callback) {
      return WebDav.DELETE(url, callback);
    };

    this.mkdir = function(callback) {
      return WebDav.MKCOL(url, callback);
    };

    return this;
  }
}
