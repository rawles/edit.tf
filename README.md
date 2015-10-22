# teletext-editor

This is a teletext editor implemented in JavaScript, so that people now 
need no more than a JavaScript-enabled browser in order to create their 
own teletext frames. You can try the editor out at 
http://rawl.es/teletext-editor or by opening the file `index.html` in 
your browser. It may also be used for editing BBC Micro mode 7 screens, 
or preparing viewdata frames.

Most of the functionality of the editor is accessed through key 
sequences beginning with the escape key. They are summarised in a table 
to the left of the the editor. Pressing the escape key takes you into 
command mode, in which the status bar is coloured yellow, and then 
typing a (possibly shifted) letter will insert a control character or 
perform some other function. The status bar can also be used to view 
teletext metadata. The key sequence ESC-L toggles this.

Everything is supplied in a single HTML file. There are no external 
dependencies. You can email the HTML file to friends so that they can 
edit frames on their computer.

## All frame data is kept in the URL.

No communication happens with any backend or 'cloud server'. You don't 
need to be connected to the internet to use the editor. The editor 
doesn't save any data to the local disk either. Instead, the state of 
the frame is 'saved' into the URL. Therefore, to save your work, you can 
bookmark the URL in your browser. To share it, you can email the URL to 
others or post it on social networks. The server logs don't store this 
data, even when somebody clicks on a link containing it, so your frames 
are private.

In the URL, the nybble before the colon describes the character set the 
page is encoded in (the least significant three bytes) and whether the 
page is intended to be rendered with black foreground colours enabled 
(the most significant bit enabled if it is). The part of the URL after 
the colon contains a base-64-encoded sequence of bits, amounting to 1167 
base 64 digits. The encoding is standard 'base64url' with URL and 
Filename Safe Alphabet ([RFC 4648](https://tools.ietf.org/html/rfc4648) 
§5 'Table 2: The "URL and Filename safe" Base 64 Alphabet'). After 
decoding, the seven-bit character code for column _c_ and row _r_ 
appears at bit positions _280r+7c_ to _280r+7c+6_ inclusive, the most 
significant bit appearing first. There are therefore two bits at the
end of the encoding which are not used.

The key combination ESC-E will pop up a box allowing you to export the 
frame. It will appear as a data URI. There are three formats at present. 
Two are raw and differ in how they deal with character codes in the 
range 0x00 to 0x1f. One raw format leaves them untouched, the other sets 
the high bit so they appear as characters in the range 0x80 to 0x9f when 
exported. The other format is 8-bit TTI, designed for use with wxTED, by 
@peterkvt80 - Peter Kwan. This includes metadata which can be viewed 
with ESC-L but which unfortunately cannot yet be edited.

Alternatively, a script, `url2raw.pl`, in the `tools/` directory, is 
provided to assist with conversion on the command line. Supply an editor 
URL on standard input and it will output the raw frame, with lines 
delimited with newlines, on standard output.

We are happy to implement export to other formats if an unambiguous 
specification document can be found for them. Contributions of scripts 
to convert these URLs to formats required by other teletext systems 
would also be very welcome.

Before September 2015, the editor frame was 24 lines and not 25, so 
authors of conversion scripts and routines may wish to consider also 
supporting encodings of length 1120, describing the first 24 lines. (In 
this case, there are no left-over bits!). `url2raw.pl` supports both 
frame lengths.

## The editor is licenced under GPLv3.

The source code is commented throughout and licenced under the GNU 
General Public Licence v3.0, with additional requirements concerning 
minimisation of the source code. See the notice for more details.

Associated scripts and other tools are licenced under the same terms.

## Ways to contribute

Bug reports, enhancement requests and pull requests are welcome. If you 
would like to contribute but cannot program, documentation and tutorials 
would also be very welcome. If you're interested in contributing in this 
way, please comment on issue #3 so that everybody can suggest ways for
you to help.

## Hints, tips and caveats

* The editor allows you to edit the whole frame, but if you are preparing
  a frame for broadcast teletext, you should bear in mind that the last
  line is used for Fastext links and the first one is used for the header
  and will usually be overwritten by the broadcaster. Furthermore, the 
  first eight characters of the first line are never transmitted, instead
  being used to encode the page metadata. The television usually displays
  the page number here instead. A reminder of these restrictions is given
  when the grid is enabled (with ESC-X). Cells to avoid are not included
  in the grid shown.
* Another application of the editor is for designing BBC Micro frames.
  There are subtle differences in the way each system displays the frame, 
  notably in the handling of double height. The characters in the first
  row of a double-height pair aren't automatically copied to the second
  row. Instead, on a BBC Micro, the two rows need to have identical data.
  This means that effects like the top and bottom of double-height
  characters having different colours, or even different characters
  entirely, may be achieved. This editor does not yet display such effects.

## Related links

### As seen at...

The editor has been used for various events and systems:

* The editor was originally written for the 
  [teletext40](http://www.teletext40.com/100/1/) project. When viewing pages
  on the web interface, the user has the option to then edit the page, so that
  it can be submitted back to the site via email.
* The editor was used by Dan Farrimond - @illarterate - and Carl Attrill at a
  workshop called *[Block Party](http://www.tate.org.uk/whats-on/tate-britain/performance-and-music/late-tate-june-2015)* 
  at the Tate Britain art gallery in June 2015.
  It was also used by Dan at *St. Helens Versus the Lizards* and *Superbyte*
  and continues to be used at other teletext events.
* The editor was used by the [CCC Video Operation Center](http://c3voc.de/) -
  @voc - as part of their DVB-T system. It broadcasted a signal containing 
  teletext to televisions belonging to the participants of the
  [Chaos Communication Camp 2015](https://events.ccc.de/camp/2015/wiki/Main_Page) in August 2015.
* The editor was used to prepare the closing screens of BBC Micro demos
  produced by the demo group [CRTC](http://crtc.tv/), including 
  *Some Nasty Effects*. The offline nature of the editor proved useful, since
  it meant the screen could be prepared while broken down for many hours
  in Newbury Services on the M4, on the way to the Sundown 2015 party.

### Compatibility

* The Windows-based teletext editor [wxTED](http://teastop.co.uk/teletext/wxted/) by Peter Kwan - @peterkvt80 - has 
  implemented import from, and export to, the URLs used in this editor.
  Peter has also produced a Raspberry Pi teletext editor and other cool 
  teletext technologies.

### Test frames

Frames to test the correct functionality of the editor appear below. Feel 
free to edit this README with your own test frames, especially if they expose
nasty bugs or demonstrate common mistakes in implementing teletext software.

* Rob of the
  [Teletext Preservation project](http://www.teletext.org.uk/) has contributed a
  [test frame](http://rawl.es/teletext-editor/#0:QIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECAa8WrVq3Jl2ZemVB00aeaDnww48qFAgQIECBAgQIECBAgQIBpH__Qf_6D-vXoP3__9Qf__9AgQIECBAgQIECBAgQIECBAgGkv_______________________-gQIECBAgQIECBAgQIECAaRQL_69Ag__PiD_9-fEH___QIECBAgQIECBAgQIECBAgQIBpL________________________oECBAgQIECBAgQIECBAgGkUCD-gQIP_z4g2fPj9Ag-IECBAgQIECBAgQIECBAgQIECAaS________________________6BAgQIECBAgQIECBAgQIBpH_____________________-gQIECBAgQIECBAgQIECBAgGkv_______________________-gQIECBAgQIECBAgQIECAaR____-vFmTEESfOi_______oECBAgQIECBAgQIECBAgQIBpL________________________oECBAgQIECBAgQIECBAgGkf_____________________6BAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAg)
  for proper double-height handling.
