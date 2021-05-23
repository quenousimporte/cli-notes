# notes

This is yet another note-taking app, heavily inspired by [nb](https://xwmx.github.io/nb/).

* It uses a very simple CLI
* Your notes are encrypted with GPG
* It is cross-platform (I tested it on some tens: Windows 10, Debian 10, MacOS 10.10)
* You can configure any external editor to write your notes (I tested vim, Sublime Text and Notepad++)
* Your notes can be synchronized with any external tool (WebDAV sync, git...)
* The dependencies are node.js (with no additional package), and OpenGPG

⚠ While you edit your note, it is written unencrypted in a temporary file on your hard drive. I am no security expert. Please do not use this app if your life, reputation, or whatever you value is at stake!

## Installation and setup

Download the source and edit `core/settings.json`

## Usage

To access the main menu:

* Windows: launch `win32\notes`
* Unix (Linux or Mac): launch `unix/notes`

To add your first note, type `notes add "My first note"`. This will open your editor of choice. When you close the editor (the process must be quit), the note will be encrypted with OpenGPG, using the identity set in the settings file.

Your notes are stored in flat .asc files, in the local folder set in the settings file. In the interface they are listed with an index:

![screenshot](https://user.fm/files/v2-2032fe495036d644856fb75c13d2ecc9/38a5bb50-4ef2-46d1-9928-5094f51472c7.png)

You can edit a note using `notes ed <index>`, delete it with `notes rm <index>`, etc.

That's it! 😃
