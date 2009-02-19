eval(loadFile("src/foo.js"));

testCases(test,
	function defaultPropertyIs1() {
		assert.that(foo(), eq('bar'));
	},

	function defaultPropertyIs2() {
		assert.that(foo(), eq('baz'));
	}
);