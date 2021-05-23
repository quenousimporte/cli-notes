const fs = require('fs');
const child_process = require("child_process");
const path = require('path');

function importFile(file)
{
	var newFileName = path.join(settings.local_folder, path.basename(file).replace(settings.default_temp_extension, settings.encrypted_extension));
	encrypt(newFileName, file);
}

function translate(key)
{
	return lg[key][settings.language];
}

function getFiles()
{
	var files = fs.readdirSync(settings.local_folder);
	files = files.filter(function(value, index, arr)
	{ 
        return value.indexOf(settings.encrypted_extension) != -1;
    });

	return files;
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
	execCommand(settings.editor, [fileName || tempFileName]);
}

function encrypt(outputFileName, inputFileName)
{
	inputFileName = inputFileName || tempFileName;
	execCommand("gpg", ["-a", "-r", settings.gpg_recipient, "-o", outputFileName, "-e", inputFileName]);
}

function execCommand(command, args)
{
	var child = child_process.spawnSync(command, args,
	{
    	stdio: 'inherit'
	});
}

function home()
{
	console.log("---");
	console.log(translate("welcome"));
	var files = getFiles();
	for (var i = 0; i < files.length; i++)
	{
		console.log("[" + i + "] " + files[i].replace(settings.encrypted_extension, ""));
	}
	console.log("---");
	usage();
}

function decrypt(originalFileName, outputFileName)
{
	outputFileName = outputFileName || tempFileName;
	execCommand("gpg", ["-r", settings.gpg_recipient, "-o", outputFileName,"-d", originalFileName]);
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

	ed: 
	{
		usage: "notes ed <index>",
		exec: function(index)
		{
			var files = getFiles();
			var originalFileName = path.join(settings.local_folder, files[index]);

			decrypt(originalFileName);
			editFile();
			encrypt(originalFileName);
		}
	},
	
	cat:
	{
		usage: "notes cat <index>",
		exec: function(index)
		{
			var files = getFiles();
			var originalFileName = path.join(settings.local_folder, files[index]);

			decrypt(originalFileName);
			var data = fs.readFileSync(tempFileName, 'utf8');
			
			console.log(originalFileName + ":");
			console.log(data);
		}
	},

	add:
	{
		usage: "notes add <title>",
		exec: function(arg)
		{
			editFile();
			encrypt(path.join(settings.local_folder, arg + ".asc"));
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
			// todo: reload settings?
		}
	},

	rm:
	{
		usage: "notes rm <index>",
		exec: function(index)
		{
			var files = getFiles();
			fs.unlinkSync(path.join(settings.local_folder, files[index]));
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
				var originalFileName = path.join(settings.local_folder, files[index]);
				var outputFileName = path.join(dest, files[index].replace(settings.encrypted_extension, settings.default_temp_extension));
				decrypt(originalFileName, outputFileName);
			}
		}
	}
}

var data = fs.readFileSync('../core/settings.json', 'utf8');
var settings = JSON.parse(data);

data = fs.readFileSync('../core/lg.json', 'utf8');
var lg = JSON.parse(data);

var tempFileName = '.note' + settings.default_temp_extension;
var command = process.argv[2];

if (commands[command])
{
	commands[command].exec(process.argv[3]);
}
else if (command)
{
	console.log(command + translate("unknown command"));
}

home();

if (fs.existsSync(tempFileName))
{
	fs.unlinkSync(tempFileName);
}
