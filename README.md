# teletext-editor

This is a teletext editor implemented in JavaScript, so that people now 
need no more than a JavaScript-enabled browser in order to create their 
own teletext frames. It was written for the 
[teletext40](http://teletext40.com/100/1) project and you can try the 
editor out at http://editor.teletext40.com/ - however, it also works as 
a general-purpose editor.

Most of the functionality of the editor is accessed through key 
sequences beginning with the escape key. They are summarised in a table 
to the right of the the editor. Pressing the escape key takes you into 
command mode, in which the status bar is coloured yellow, and then 
typing a (possibly shifted) letter will insert a control character or 
perform some other function.

## The data is in the URL

Everything is in the HTML file. There are no external dependencies and 
no communication happens with any backend or 'cloud server'. Instead, 
the state of the frame is 'saved' into the URL. Therefore, to save your 
work, you can bookmark the URL in your browser. To share it, you can 
email the URL to others. The server logs don't store this data, even 
when somebody clicks on a link containing it, so your frames are 
private.

In the URL, the nybble before the colon describes the character set the 
page is encoded in (least significant three bytes) and whether the page 
is intended to be rendered with black foreground colours enabled (the 
most significant bit enabled if it is). The part of the URL after the 
colon contains a base-64-encoded sequence of bits, amounting to 1120 
base 64 digits. The encoding is standard 'base64url' with URL and 
Filename Safe Alphabet ([RFC 4648](https://tools.ietf.org/html/rfc4648) 
§5 'Table 2: The "URL and Filename safe" Base 64 Alphabet'). After 
decoding, the seven-bit character code for column _c_ and row _r_ 
appears at bit positions _280r+7c_ to _280r+7c+6_ inclusive, the most 
significant bit appearing first. Contributions of scripts to convert 
these URLs to formats required by other teletext systems would be very 
welcome.

## Licensing

The source code is commented throughout and licenced under the GNU 
General Public Licence v3.0, with additional requirements concerning 
minimisation of the source code. See the notice for more details. Bug 
reports and pull requests are welcome. If you would like to contribute 
but cannot program, documentation and tutorials would be very welcome. 
If you're interested, please comment on issue #3.

## Related links

* Dan Farrimond has written a
  [ten-minute tutorial](http://teletextart.co.uk/teletext40-editor-10-minute-tutorial/)
  which is a great quick-start guide to using the editor.
* Rob of the
  [Teletext Preservation project](http://www.teletext.org.uk/) has contributed a
  [test frame](http://editor.teletext40.com/#0:QIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECAa8WrVq3Jl2ZemVB00aeaDnww48qFAgQIECBAgQIECBAgQIBpH__Qf_6D-vXoP3__9Qf__9AgQIECBAgQIECBAgQIECBAgGkv_______________________-gQIECBAgQIECBAgQIECAaRQL_69Ag__PiD_9-fEH___QIECBAgQIECBAgQIECBAgQIBpL________________________oECBAgQIECBAgQIECBAgGkUCD-gQIP_z4g2fPj9Ag-IECBAgQIECBAgQIECBAgQIECAaS________________________6BAgQIECBAgQIECBAgQIBpH_____________________-gQIECBAgQIECBAgQIECBAgGkv_______________________-gQIECBAgQIECBAgQIECAaR____-vFmTEESfOi_______oECBAgQIECBAgQIECBAgQIBpL________________________oECBAgQIECBAgQIECBAgGkf_____________________6BAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAg)
  for proper double-height handling.
