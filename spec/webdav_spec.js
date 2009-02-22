load('jsspec/src/jsspec2.js');
load('src/env.rhino.js');
load('src/webdav.js');

with(jsspec.dsl.TDD) {

suite('WebDAV')
  setup(function() {
  })

  test('should do GET', function() {
    var stuff = WebDav.GET('http://localhost:8085/webdav/folder3/stuff.html');
      var expected = "<html><body><h1>stuff.html</h1><ul><li><a href='/webdav/folder3/index.html'>index.html</a><li><a href='/webdav/folder3/stuff.html'>stuff.html</a><li><a href='/webdav/folder3/subfolder1/'>subfolder1</a></ul>rename<form method='POST' action='/webdav/folder3/stuff.html'><input type='text' name='name' value='stuff.html'/><input type='submit'></form></body></html>";
      assertEquals(expected, stuff);
  })
  
  test('should read a file', function() {
    var file = WebDav.Fs.file('http://localhost:8085/webdav/folder3/stuff.html');
    var expected = "<html><body><h1>stuff.html</h1><ul><li><a href='/webdav/folder3/index.html'>index.html</a><li><a href='/webdav/folder3/stuff.html'>stuff.html</a><li><a href='/webdav/folder3/subfolder1/'>subfolder1</a></ul>rename<form method='POST' action='/webdav/folder3/stuff.html'><input type='text' name='name' value='stuff.html'/><input type='submit'></form></body></html>";
    assertEquals(expected, file.read());
  })
  
  test('should do PROPFIND', function() {
    var doc = WebDav.PROPFIND('http://localhost:8085/webdav/folder3');
    assertEquals(4, doc.childNodes.length);
  })
  
  test('should do dir', function() {
    var dir = WebDav.Fs.dir('http://localhost:8085/webdav/folder3');
    assertEquals(4, dir.children().length);
  
    assertEquals('http://localhost:8085/webdav/folder3/',           dir.children()[0].url);
    assertEquals('http://localhost:8085/webdav/folder3/index.html', dir.children()[1].url);
    assertEquals('http://localhost:8085/webdav/folder3/stuff.html', dir.children()[2].url);
    assertEquals('http://localhost:8085/webdav/folder3/subfolder1', dir.children()[3].url);
  })
  
  test('should mkdir', function() {
    var dir = WebDav.Fs.dir('http://localhost:8085/webdav/testmkdir');
    dir.rm();
    var expectedFailure = false;
    try {
      dir.children();
    } catch(e) {
      expectedFailure = true;
      dir.mkdir();
    }
    assertTrue(expectedFailure);
    assertEquals(1, dir.children().length);
  })

run();
};