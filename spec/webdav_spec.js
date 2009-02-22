load('jsspec/src/jsspec2.js');
load('src/env.rhino.js');
load('src/webdav.js');

with(jsspec.dsl.TDD) {

suite('WebDAV')
  setup(function() {
  	this.fs = new WebDavFs('http://localhost:8085/webdav');
  	this.dav = new WebDav();
  })

  test('should read a file', function() {
    var file = this.fs.file('/folder3/stuff.html');
    var expected = "<html><body><h1>stuff.html</h1><ul><li><a href='/webdav/folder3/index.html'>index.html</a><li><a href='/webdav/folder3/stuff.html'>stuff.html</a><li><a href='/webdav/folder3/subfolder1/'>subfolder1</a></ul>rename<form method='POST' action='/webdav/folder3/stuff.html'><input type='text' name='name' value='stuff.html'/><input type='submit'></form></body></html>";
    assertEquals(expected, file.read());
  })

	test('should get directory listing', function() {
	  var doc = this.dav.PROPFIND('http://localhost:8085/webdav/folder3');
    assertEquals(4, doc.childNodes.length);
    // for(var i=0; i<doc.childNodes.length; i++){
    //   print( doc.childNodes[i] );
    // }
	})

run();
};