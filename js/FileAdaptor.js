//--
//-- Server adaptor for talking to static files
//--

function FileAdaptor()
{
	this.host = null;
	this.store = null;
	return this;
}

FileAdaptor.NotLoadedError = "TiddlyWiki file has not been loaded";
FileAdaptor.serverType = 'file';

// Open the specified host/server
//#   host - url of host (eg, "http://www.tiddlywiki.com/" or "www.tiddlywiki.com")
//#   context is itself passed on as a parameter to the callback function
//#   callback - optional function to be called on completion
//# Return value is true if the request was successfully issued, false if this connector doesn't support openHost(),
//#   or an error description string if there was a problem
//# The callback parameters are callback(context)
//#   context.status - true if OK, string if error
//#   context.adaptor - reference to this adaptor object
//#   context - parameters as originally passed into the openHost function
FileAdaptor.prototype.openHost = function(host,context,userParams,callback)
{
	this.host = host;
	if(!context)
		context = {};
	context.adaptor = this;
	context.callback = callback;
	context.userParams = userParams;
	var ret = loadRemoteFile(host,FileAdaptor.openHostCallback,context);
	return typeof(ret) == "string" ? ret : true;
}

FileAdaptor.openHostCallback = function(status,context,responseText,url,xhr)
{
	var adaptor = context.adaptor;
	context.status = status;
	if(!status) {
		context.statusText = "Error reading file: " + xhr.statusText;
	} else {
		// Load the content into a TiddlyWiki() object
		adaptor.store = new TiddlyWiki();
		adaptor.store.importTiddlyWiki(responseText);
	}
	context.callback(context,context.userParams);
}

// Gets the list of workspaces on a given server
//#   context is itself passed on as a parameter to the callback function
//#   callback - optional function to be called on completion
//# Return value is true if the request was successfully issued, false if this connector doesn't support getWorkspaceList(),
//#   or an error description string if there was a problem
//# The callback parameters are callback(context)
//#   context.status - true if OK, false if error
//#   context.statusText - error message if there was an error
//#   context.adaptor - reference to this adaptor object
//#   context - parameters as originally passed into the getWorkspaceList function
FileAdaptor.prototype.getWorkspaceList = function(context,userParams,callback)
{
	if(!context)
		context = {};
	context.workspaces = [{title:"(default)"}];
	context.status = true;
	window.setTimeout(function() {callback(context,userParams);},10);
	return true;
}

// Open the specified workspace
//#   workspace - name of workspace to open
//#   callback - function to be called on completion
//#   context - passed to callback function
//# Return value is true if the request was successfully issued
//#   or an error description string if there was a problem
//# The callback parameters are callback(status,adaptor,context)
//#   status - true if OK, string if error
//#   adaptor - reference to this adaptor object
//#   context - parameters as originally passed into the openWorkspace function
FileAdaptor.prototype.openWorkspace = function(workspace,context,userParams,callback)
{
	if(!context)
		context = {};
	context.status = true;
	window.setTimeout(function() {callback(context,userParams);},10);
	return true;
}

// Gets the list of tiddlers within a given workspace
//#   callback - function to be called on completion
//#   context - passed on to callback function
//# Return value is true if the request was successfully issued,
//#   or an error description string if there was a problem
//# The callback parameters are callback(status,adaptor,context,tiddlerList)
//#   status - true if OK, false if error
//#   adaptor - reference to this adaptor object
//#   context - parameters as originally passed into the getTiddlerList function
//#   tiddlerList - array of objects describing each tiddler
FileAdaptor.prototype.getTiddlerList = function(context,userParams,callback)
{
	if(!this.store)
		return FileAdaptor.NotLoadedError;
	if(!context)
		context = {};
	context.tiddlers = [];
	this.store.forEachTiddler(function(title,tiddler)
		{
		var t = new Tiddler(title);
		t.text = tiddler.text;
		t.modified = tiddler.modified;
		t.modifier = tiddler.modifier;
		t.fields['server.page.revision'] = tiddler.modified.convertToYYYYMMDDHHMM();
		t.tags = tiddler.tags;
		context.tiddlers.push(t);
		});
	context.status = true;
	window.setTimeout(function() {callback(context,userParams);},10);
	return true;
}

FileAdaptor.prototype.generateTiddlerInfo = function(tiddler)
{
	var info = {};
	info.uri = tiddler.fields['server.host'] + "#" + tiddler.title;
	return info;
}

// Retrieves a tiddler from a given workspace on a given server
//#   title - title of the tiddler to get
//#   callback - function to be called on completion
//#   context - passed on as a parameter to the callback function
//# Return value is true if the request was successfully issued,
//#   or an error description string if there was a problem
//# The callback parameters are callback(status,adaptor,context,tiddler)
//#   status - true if OK, false if error
//#   adaptor - reference to this adaptor object
//#   context - as passed into the function
//#   tiddler - the retrieved tiddler, or null if it cannot be found
FileAdaptor.prototype.getTiddler = function(title,context,userParams,callback)
{
	if(!this.store)
		return FileAdaptor.NotLoadedError;
	if(!context)
		context = {};
	context.tiddler = this.store.fetchTiddler(title);
	context.tiddler.fields['server.type'] = FileAdaptor.serverType;
	context.tiddler.fields['server.host'] = this.host;
	context.tiddler.fields['server.page.revision'] = context.tiddler.modified.convertToYYYYMMDDHHMM();
	context.status = true;
	window.setTimeout(function() {callback(context,userParams);},10);
	return true;
}

FileAdaptor.prototype.close = function()
{
	delete this.store;
	this.store = null;
}

config.adaptors[FileAdaptor.serverType] = FileAdaptor;

