This is a teletext editor implemented in JavaScript, so that people now 
need no more than a JavaScript-enabled browser in order to create their 
own teletext frames. It was written for the 
[teletext40](http://teletext40.com/100/1) project and
you can try the editor out at http://editor.teletext40.com/ - however,
it can also be used as a general-purpose editor.

Most of the functionality of the editor is accessed through keystrokes, 
shown in a table in the editor. Pressing escape takes you into command 
mode, in which the statusbar is coloured yellow, and then typing a 
(possibly shifted) letter will insert a control character or perform 
some other function.

Everything is in the HTML file. There are no external dependencies and 
no communication happens with any backend or 'cloud server'. Instead, 
the state of the frame is 'saved' into the URL. Therefore, to save your 
work, you can bookmark the URL in your browser. To share it, you can 
email the URL to others.

In the URL, the nybble before the colon describes the character set the 
page is encoded in (least significant three bytes) and whether the page 
is intended to be rendered with black foreground colours enabled (the 
most significant bit enabled if it is). The 1,920 (!) hexadecimal digits 
after the colon are such that the byte for row r and column c (both 
zero-indexed) is described by the two hex digits starting at position 
(80r+2c).

The source code is commented throughout and licenced under the GNU 
General Public Licence v3.0, with additional requirements concerning 
minimisation of the source code. See the notice for more details. Bug 
reports and pull requests are welcome.

