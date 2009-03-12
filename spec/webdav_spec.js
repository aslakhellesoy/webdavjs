load('jsspec/src/jsspec2.js');
load('spec/env.rhino.js');
load('src/webdav.js');

function xtest(){}

with(jsspec.dsl.TDD) {

suite('WebDAV.Fs')
  setup(function() {
  })

  test('should read cotents of a relative File', function() {
    var bla = new WebDAV.Fs('http://localhost:10080').file('/a/bla');
    assertEquals('bla', bla.read());
  })

  test('should read cotents of an absolute File', function() {
    var bla = new WebDAV.Fs('http://localhost:10080').file('http://localhost:10080/a/bla');
    assertEquals('bla', bla.read());
  })
  
  test('should list contents of directory', function() {
    var fs = new WebDAV.Fs('http://localhost:10080');
    var dir = fs.dir('/a');

    assertEquals(3, dir.children().length);

    assertEquals('http://localhost:10080/a',     dir.children()[0].url);
    assertEquals('http://localhost:10080/a/b/',   dir.children()[1].url);
    assertEquals('http://localhost:10080/a/bla', dir.children()[2].url);
  })
  
  test('should mkdir', function() {
    var dir = new WebDAV.Fs('http://localhost:10080').dir('/testmkdir');
    try {
      dir.rm();
    } catch(e) {
    }

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

  xtest('should create file', function() {
    var file = WebDAV.Fs.file('http://localhost:10080/a/new.txt');
    file.write("Some\nFile data");
    assertEquals("Some\nFile data", file.read());
    file.rm();
  })

run();
};