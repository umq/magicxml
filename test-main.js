var allTestFiles = [];
var TEST_REGEXP = /^\/base\/test\/.*(spec|test)\.js$/i;

// Get a list of all the test files to include
Object.keys(window.__karma__.files).forEach(function(file) {
  if (TEST_REGEXP.test(file)) {
    allTestFiles.push(
      // Normalize paths to RequireJS module names.
	  file.replace(/^\/base\/test\//g, '../test/').replace(/\.js$/g, '')
	);
  }
});

require.config({
  // Karma serves files under /base, which is the basePath from your config file
  baseUrl: '/base/src',

  // dynamically load all test files
  deps: allTestFiles,

  // we have to kickoff jasmine, as it is asynchronous
  callback: window.__karma__.start
});
