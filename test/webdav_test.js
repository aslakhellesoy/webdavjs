eval(loadFile("src/foo.js"));

testCases(test,
	function fooShouldBeBar() {
		assert.that(foo(), eq('bar'));
	},

	function xhrShouldWork() {
		assert.that(xhr(), eq('baz'));
	}
);