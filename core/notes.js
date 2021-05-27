const fs = require('fs');
const child_process = require("child_process");
const path = require('path');

function loadTemp(input, output)
{
	if (path.extname(input) == settings.encrypted_extension)
	{
		decrypt(input, output);
	}
	else
	{
		fs.copyFileSync(input, output);
	}
}

function flushTemp(input, output)
{
	if (path.extname(output) == settings.encrypted_extension)
	{
		encrypt(input, output);
	}
	else
	{
		fs.copyFileSync(input, output);	
	}
}

function launchCommand()
{
	var command = process.argv[2];
	if (commands[command])
	{
		commands[command].exec(process.argv[3]);
	}
	else if (command)
	{
		console.log(command + translate("unknown command"));
	}
}

function clearTempFile()
{
	if (fs.existsSync(tempFileName))
	{
		fs.unlinkSync(tempFileName);
	}
}

function autoSync()
{
	if (settings.auto_sync)
	{
		commands.sync.exec();
	}	
}

function startCommand()
{
	switch (process.platform)
	{ 
		case 'darwin' : return 'open';
		case 'win32' : return 'start';
		case 'win64' : return 'start';
		default : return 'xdg-open';
	}
}

function listNotes()
{
	var files = getFiles();
	for (var i = 0; i < files.length; i++)
	{
		var file = files[i];
		if (filter && file.toLowerCase().indexOf(filter.toLowerCase()) === -1)
		{
			continue;
		}
		console.log("[" + i + "] " + files[i]);
	}	
}

function getFileName(index)
{
	var files = getFiles();
	return path.join(settings.local_folder, files[index]);	
}

function loadJson(path)
{
	var data = fs.readFileSync(path, 'utf8');
	return JSON.parse(data);	
}

function loadSettings()
{
  return loadJson('../core/settings.json');
}

function loadLg()
{
	return loadJson('../core/lg.json');
}

function importFile(file)
{
	var newFile = path.join(settings.local_folder, path.basename(file));
	flushTemp(file, newFile);
}

function translate(key)
{
	return lg[key][settings.language];
}

function getFiles()
{
	return fs.readdirSync(settings.local_folder);
}

function usage()
{
	var usages = [];
	for (var i in commands)
	{
		var usage = commands[i].usage;
		if (usage)
		{
			usages.push(usage);
		}
	}
	console.log(usages.join(" | "));
}

function editFile(fileName)
{
	execCommand(settings.editor, [fileName]);
}

function encrypt(input, output)
{
	execCommand("gpg", settings.gpg_options.concat(["-o", output, "-e", input]));
}

function execCommand(command, args)
{
	child_process.spawnSync(command, args,
	{
    	stdio: 'inherit'
	});
}

function home()
{
	listNotes();
	usage();
}

function decrypt(input, output)
{
	execCommand("gpg", settings.gpg_options.concat(["-o", output,"-d", input]));
}

var commands = 
{
	mer:
	{
		exec: function()
		{
			console.log("il et fou!");
		}
	},
	
	filter:
	{
		usage: "notes filter <word>",
		exec: function(word)
		{
			filter = word;
		}
	},

	ed: 
	{
		usage: "notes ed <index>",
		exec: function(index)
		{
			var fileName = getFileName(index);
			loadTemp(fileName, tempFileName);
			editFile(tempFileName);
			flushTemp(tempFileName, fileName);
		}
	},
	
	cat:
	{
		usage: "notes cat <index>",
		exec: function(index)
		{
			var fileName = getFileName(index);

			loadTemp(fileName, tempFileName);
			var data = fs.readFileSync(tempFileName, 'utf8');
			
			console.log(fileName + ":");
			console.log(data);
		}
	},

	add:
	{
		usage: "notes add <fileName>",
		exec: function(arg)
		{
			editFile(tempFileName);
			flushTemp(tempFileName, path.join(settings.local_folder, arg));
		}
	},

	sync:
	{
		usage: "notes sync",
		exec: function()
		{
			execCommand(settings.sync_command, settings.sync_command_options);
		}
	},

	settings:
	{
		usage: "notes settings",
		exec: function()
		{
			editFile('../core/settings.json');
			settings = loadSettings();
		}
	},

	rm:
	{
		usage: "notes rm <index>",
		exec: function(index)
		{
			fs.unlinkSync(getFileName(index));
		}
	},

	import:
	{
		usage: "notes import <path>",
		exec: function(file)
		{
			if (fs.statSync(file).isDirectory())
			{
				var files = fs.readdirSync(file);
				for (var i in files)
				{
					importFile(path.join(file, files[i]));
				}
			}
			else
			{
				importFile(file);
			}
		}
	},
	
	export:
	{
		usage: "notes export <dest>",
		exec: function(dest)
		{
			var files = getFiles();
			for (var index in files)
			{
				var fileName = path.join(settings.local_folder, files[index]);
				if (fs.lstatSync(fileName).isFile())
				{
					var outputFileName = path.join(dest, files[index]);
					loadTemp(fileName, outputFileName);
				}
			}
		}
	},
	
	explore:
	{
		exec: function()
		{
			child_process.exec(startCommand() + ' ' + settings.local_folder);
		}
	},
	
	view:
	{
		usage: "notes view <index>",
		exec: function(index)
		{
			var htmlFileName = tempFileName + '.html';
			var fileName = getFileName(index);
			loadTemp(fileName, tempFileName);
			execCommand('pandoc', [tempFileName, '-o', htmlFileName]);
			
			child_process.exec(startCommand() + ' ' + htmlFileName);
			
			// to improve!
			setTimeout(function()
			{
				fs.unlinkSync(htmlFileName);
			}, 5000);
		}
	}
}

var settings = loadSettings();
var lg = loadLg();
var tempFileName = '.note' + settings.default_temp_extension;
var filter = "";

autoSync();
launchCommand();
clearTempFile();
home();
autoSync();
