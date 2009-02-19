load('jsspec/src/jsspec2.js');
load('src/env.rhino.js');

with(jsspec.dsl.TDD) {

suite('Success, failure and error')
	test('Normal execution should be treated as a success', function() {
    var request =  new XMLHttpRequest();
    request.open("GET", 'http://localhost:8085/webdav/folder1', false);
    request.send(null);
	})

run();
};