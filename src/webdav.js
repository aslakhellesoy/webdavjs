// var request =  new XMLHttpRequest();
// request.open("GET", 'http://localhost:8085/webdav/folder1', false);
// request.send(null);
WebDav = function() {
  this.GET = function(url, callback) {
    return this.request('GET', url, 'text', callback);
  };

  this.PROPFIND = function(url, callback) {
    return this.request('PROPFIND', url, 'xml', callback);
  };
  
  this.request = function(verb, url, type, callback) {
    var xhr = new XMLHttpRequest();
    var body = function() {
      var b = xhr.responseText;
      if (type == 'xml') {
        var xml = xhr.responseXML;
        b = (xml.firstChild.nextSibling) ? xml.firstChild.nextSibling : xml.firstChild;
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
    xhr.send(null);
    
    if(!async) {
      return body();
    }
  };
  
  return this;
};

WebDavFs = function(baseUrl) {
  this.file = function(path) {
    var url = baseUrl + path;
    
    this.read = function(callback) {
      return new WebDav().GET(url, callback);
    };

    return this;
  };
}
