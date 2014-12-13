# WebDAV.js

This is a simple JavaScript library that attempts to implement a subset of the
WebDAV standard. It (currently) doesn't aim to be complete - just support basic
operations.

WebDAV.js has a low-level API (the WebDAV object) and a higher level, more OO API
(WebDAV.Fs).

Both APIs can operate in synchronous and asynchronous mode: All functions that 
declare a callback argument accept an optional function. If a callback function is 
passed, the HTTP request will happen asynchronously, passing the result to that
function. If no callback function is passed, the result is returned directly after
the synchronous HTTP request.

For each function - "result" refers to either the function's return value or the 
argument passed to the callback function (if any).

## WebDAV

This is a very thin wrapper around XMLHttpRequest.

Also, if you would like to provide a custom XMLHttpRequest override the WEBDAV.XMLHttpRequestProvider function e.g:
```
WebDAV.XMLHttpRequestProvider =  function () {
	return new XMLHttpRequest({mozSystem: true});
}
```

## WebDAV.Fs

This is the entry point to the OO interface. Create a new instance like this:

```
var fs = new WebDAV.Fs(url);
```

A WebDAV.Fs object has 2 methods:

* dir(url) - returns a Dir object
* file(url) - returns a File object

The url argument can be an absulute or relative URL. Example:

```
var fs = new WebDAV.Fs('http://localhost:1234/my_files');
var hello = fs.file('/my/hello.txt');
// This is the same as:
var hello = fs.file('http://localhost:1234/my_files/my/hello.txt');
```

### File.read(callback)

Reads the file and passes the contents to the result.

### File.write(data, callback)

Writes data to the file.

### File.rm(callback)

Deletes the file.

### Dir.children(callback)

Lists all files and directories under Dir. The result is an Array of other File
and/or Dir objects.

### Dir.mkdir(callback)

Creates the directory.

### Dir.rm(callback)

Removes the directory.

## Usage/Example

Check out example/index.html

To see it in action in a browser, stand in the root folder and run:

```
ruby spec/webdav_server.rb
```

Then point your browser to [http://localhost:10080/example/index.html](http://localhost:10080/example/index.html)

You should be able to browse and edit everything from within your browser.

## Running tests

You need to download some tools. Run ./install_tools.sh to pull them down.

### In shell A

```
ruby spec/webdav_server.rb spec/fixtures
```

### In shell B

```
ant jsspec
```
