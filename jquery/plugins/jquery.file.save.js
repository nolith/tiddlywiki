/*
jquery.file.save.js
jQuery plugin for saving data to a file
*/

(function($) {

	if(!$.file) {
		$.file = $.extend({});
	}

	$.file.extend({
		defaults : {
			fileUrl: null,
			content: null,
			verbose: false
		},
		setDefaults: function(path,filename) {
			this.defaults.path = path;
			this.defaults.filename = filename;
		},
		save: function(args) {
			var opts = $.extend({},this.defaults,args);
			if(!opts.fileUrl)
				return saveChanges();
			var r = mozillaSaveFile(opts.fileUrl,opts.content);
			if(!r)
				r = ieSaveFile(opts.fileUrl,opts.content);
			if(!r)
				r = javaSaveFile(opts.fileUrl,opts.content);
			return r;
		},
		copy: function(dest,source) {
			return $.browser.msie ? ieCopyFile(dest,source) : false;
		}
	});

	// Private functions.
	function log() {
		if (window.console && window.console.log)
			window.console.log(arguments);
	}

	function getLocalPath(origPath) {
		var originalPath = convertUriToUTF8(origPath,'UTF-8');
		// Remove any location or query part of the URL
		var argPos = originalPath.indexOf("?");
		if(argPos != -1)
			originalPath = originalPath.substr(0,argPos);
		var hashPos = originalPath.indexOf("#");
		if(hashPos != -1)
			originalPath = originalPath.substr(0,hashPos);
		// Convert file://localhost/ to file:///
		if(originalPath.indexOf("file://localhost/") == 0)
			originalPath = "file://" + originalPath.substr(16);
		// Convert to a native file format
		//# "file:///x:/path/path/path..." - pc local file --> "x:\path\path\path..."
		//# "file://///server/share/path/path/path..." - FireFox pc network file --> "\\server\share\path\path\path..."
		//# "file:///path/path/path..." - mac/unix local file --> "/path/path/path..."
		//# "file://server/share/path/path/path..." - pc network file --> "\\server\share\path\path\path..."
		var localPath;
		if(originalPath.charAt(9) == ":") // pc local file
			localPath = unescape(originalPath.substr(8)).replace(new RegExp("/","g"),"\\");
		else if(originalPath.indexOf("file://///") == 0) // FireFox pc network file
			localPath = "\\\\" + unescape(originalPath.substr(10)).replace(new RegExp("/","g"),"\\");
		else if(originalPath.indexOf("file:///") == 0) // mac/unix local file
			localPath = unescape(originalPath.substr(7));
		else if(originalPath.indexOf("file:/") == 0) // mac/unix local file
			localPath = unescape(originalPath.substr(5));
		else // pc network file
			localPath = "\\\\" + unescape(originalPath.substr(7)).replace(new RegExp("/","g"),"\\");
		return localPath;
	}

	// Save this tiddlywiki with the pending changes
	function saveChanges() {
		//# Get the URL of the document
		var originalPath = document.location.toString();
		var localPath = getLocalPath(originalPath);
		var save = false;
		try {
			//# Save new file
			var head = $('head').html();
			var body = $('body').html();
			var revised = '<html>'+ head + body +'</html>';
			save = this.save(localPath,revised);
		} catch (ex) {
			log('exception ', ex);
		}
		if(save) {
			alert("Saved!");
		} else {
			alert("Save failed");
		}
	}

	function ieCreatePath(path) {
		try {
			var fso = new ActiveXObject("Scripting.FileSystemObject");
		} catch(ex) {
			return null;
		}

		//# Remove the filename, if present. Use trailing slash (i.e. "foo\bar\") if no filename.
		var pos = path.lastIndexOf("\\");
		if(pos!=-1)
			path = path.substring(0,pos+1);

		//# Walk up the path until we find a folder that exists
		var scan = [path];
		var parent = fso.GetParentFolderName(path);
		while(parent && !fso.FolderExists(parent)) {
			scan.push(parent);
			parent = fso.GetParentFolderName(parent);
		}

		//# Walk back down the path, creating folders
		for(i=scan.length-1;i>=0;i--) {
			if(!fso.FolderExists(scan[i])) {
				fso.CreateFolder(scan[i]);
			}
		}
		return true;
	}

	function ieCopyFile(dest,source) {
		ieCreatePath(dest);
		try {
			var fso = new ActiveXObject("Scripting.FileSystemObject");
			fso.GetFile(source).Copy(dest);
		} catch(ex) {
			return false;
		}
		return true;
	}

	function ieSaveFile(filePath,content) {
		// Returns null if it can't do it, false if there's an error, true if it saved OK
		ieCreatePath(filePath);
		try {
			var fso = new ActiveXObject("Scripting.FileSystemObject");
		} catch(ex) {
			//# alert("Exception while attempting to save\n\n" + ex.toString());
			return null;
		}
		var file = fso.OpenTextFile(filePath,2,-1,0);
		file.Write(content);
		file.Close();
		return true;
	}

	function mozillaSaveFile(filePath,content) {
		// Returns null if it can't do it, false if there's an error, true if it saved OK
		if(window.Components) {
			try {
				netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");
				var file = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);
				file.initWithPath(filePath);
				if(!file.exists())
					file.create(0,0664);
				var out = Components.classes["@mozilla.org/network/file-output-stream;1"].createInstance(Components.interfaces.nsIFileOutputStream);
				out.init(file,0x22,4,null);
				out.write(content,content.length);
				out.flush();
				out.close();
				return true;
			} catch(ex) {
				alert("Exception while attempting to save\n\n" + ex);
				return false;
			}
		}
		return null;
	}

	function javaUrlToFilename(url) {
		var f = "//localhost";
		if(url.indexOf(f) == 0)
			return url.substring(f.length);
		var i = url.indexOf(":");
		return i > 0 ? url.substring(i-1) : url;
	}

	function javaSaveFile(filePath,content) {
		try {
			if(document.applets["TiddlySaver"])
				return document.applets["TiddlySaver"].saveFile(javaUrlToFilename(filePath),"UTF-8",content);
		} catch(ex) {
		}
		try {
			var s = new java.io.PrintStream(new java.io.FileOutputStream(javaUrlToFilename(filePath)));
			s.print(content);
			s.close();
		} catch(ex) {
			return null;
		}
		return true;
	}

})(jQuery);