# teletext-editor

This is a teletext editor implemented in JavaScript, so that people now 
need no more than a JavaScript-enabled browser in order to create their 
own teletext frames. You can try the editor out at 
http://edit.tf/ ('`edit` `t`eletext `f`rame')
or by opening the file `index.html`
in your browser. It may also be used for editing BBC Micro mode 7 screens, 
or preparing viewdata frames.

Most of the functionality of the editor is accessed through key 
sequences beginning with the escape key. They are summarised in a table 
to the left of the the editor. Alternatively, the table can be viewed in 
the editor by entering the key sequence ESC-?.

Pressing the escape key takes you into command mode, in which the status 
bar is coloured yellow, and then typing a (possibly shifted) letter will 
insert a control character or perform some other function. The status 
bar can also be used to view teletext metadata. The key sequence ESC-9 
toggles this.

Everything you need to run the editor is in two files. `teletext-editor.js`
is the JavaScript program which allows the editor on `index.html` to be
displayed. There are no other dependencies, so you can email both files to
friends, and, provided they put them both in the same directory, they can
just open `index.html` to edit frames offline on their computer.

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
with ESC-9 but which unfortunately cannot yet be edited.

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

## Using the editor in your own pages

The editor has been packaged so that you can use it external web pages,
where it can be used as a teletext frame viewer and/or as an editor for
those frames.

Some HTML source to do this, as well as to set some other options,
follows.

    <!DOCTYPE html>
    <html>
    <head>
    <meta http-equiv="Content-Type" content="text/html;charset=utf-8" />
    
    <!-- Read in the editor source -->
    <script type="text/javascript" src="http://edit.tf/teletext-editor.js"></script>
    
    <!-- Set up an editor -->
    <script type="text/javascript">
    function init_frames() {
    
        // Create a new editor:
        var editor = new Editor();
    
        // Make it the active editor so it receives keypresses:
        active_editor = editor;
    
        // Also make it the editor which reads from and writes to the URL:
        url_editor = editor;

        // Set the relative size of the editor. We might like it to be rendered
        // at half size (full size is 480x540). This can be omitted.
        editor.set_size(0.5);
    
        // Initialise the editor, placing it in the canvas with HTML ID 'frame'.
        editor.init_frame("frame");

        // Set the editor to display the frame with reveal enabled. Possible
        // values are 0 (off) and 1 (on).
        editor.set_reveal(1);
    
        // You can also give the editor an encoded URL hash string to 
        // display/edit. Here's a welcome screen I made.
        editor.load("0:KIGCBgkYIGCRggYJGCBgkYIGCRggYJGCBgkYIGCRggYJGCAo5cOXDlw5cOXDlw5cOXDlw5cOXDlw5cOXDlw5cOXDlw5cOSnvd7_e93v973e_3vd7_e93v973e_3vd7_e93v973e_3vd7CHUBdA4WHixdYsLF1hZYsWLFixYsWLFixYsWGlixZkQIECAodQF9RT-eOf8_Pnz58-fPnz58-fPnz58-fN3___zxzV___yh1AX1FP5441Ohz6BAgQIECBAgQIECBAgQICzUp_PHNX___KHUBbUU_njjU6GPoEFfLsx79uVB03ukCBAgLtSn88c1f__8odQF9RT-eONToY-gQIECBAgQIECBAgQIECAs1KfzxzV___yh0aW1FP5441Ohz_TLsy9Mvjoty5NPTfyQIC7Up_PHNX___QIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECAodQFtRT-eONToc-gQIECBAgQIECBAgQIECAu1KfzxzV___yh00W1IEBYygUrFixYsWLDxdYWLrFhYusWLEyAp_PHNX___Kf____258-fPnz58-fPnz58-fPnz58-fPnz58-fPn5____8odQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQICh0l8BUOWXnzDxacNA_BdN6Dtpy90GFBoy7OCDnj5Zcu5AgKHQSBBz0b--ndnQYdmxBh7YdOzDi2ZUGPft24d2TmuQIECAodLfA0HZsQZuWHblQZMPTCg080Gncg6aMqCrSmLkFTegQICh0MgQc8PbKg87-vJB338taxBi379e3Dy1oOmjKg4Yc-VcgKHSXwFC65-aBMg4ddmxByy8euXn05oOm90H0dOnDm6Xr0CAodBIA-fT00dcS7Hv2r-WHvsy81_TLsy9Mvjoty5NPTfyQICh0t8DUOWXnzDxacNBTkSY1RbaDdN6DHsy4eSDpo080CBAgKHUCANm5YduVBh3ZEGLLn07kGPllw9NO7Og87-vJBv77kKAp3e93_d73f93vd_3e93_d73f93vd_3e93_d73f93vd_3e9ymZNmTZk2ZNmTZk2ZNmTZk2ZNmTZk2ZNmTZk2ZNmTZk2ZNmKIESBEoRIEShEgRKESBEoRIEShEgRKESBEoRIEShEgRKESA");

    }
    </script>
    <title>teletext-editor</title>
    </head>
    
    <!-- The editor canvas is set up by a call to the function above. -->
    <body onload="init_frames();">
    
    <!-- A canvas is defined with the appropriate name. -->
    <canvas id="frame"></canvas>
    
    </body>
    </html>

When this page is loaded, an editor frame should appear, populated with
the encoded page. When you edit it, the URL will reflect the changing
contents of the frame.

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

Another very useful way to help is to read
[the issues for which opinions are currently sought](https://github.com/rawles/teletext-editor/labels/opinions%20sought) and contribute to the discussion. The
more opinions we have on how we can develop the editor, the more likely we're
going to make it into a useful tool for everyone.

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
* The editor was used by [Dan Farrimond](http://portfolio.illarterate.co.uk/) -
  @illarterate - and Carl Attrill at a
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
  *[Some Nasty Effects](http://www.pouet.net/prod.php?which=66197)*.
  The offline nature of the editor proved useful, since
  it meant the screen could be prepared while broken down for many hours at
  [Chieveley services on the M4](http://motorwayservicesonline.co.uk/Chieveley),
  on the way to the [Sundown](http://sundowndemoparty.net/) 2015 party.

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
  [test frame](http://edit.tf/#0:QIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECAa8WrVq3Jl2ZemVB00aeaDnww48qFAgQIECBAgQIECBAgQIBpH__Qf_6D-vXoP3__9Qf__9AgQIECBAgQIECBAgQIECBAgGkv_______________________-gQIECBAgQIECBAgQIECAaRQL_69Ag__PiD_9-fEH___QIECBAgQIECBAgQIECBAgQIBpL________________________oECBAgQIECBAgQIECBAgGkUCD-gQIP_z4g2fPj9Ag-IECBAgQIECBAgQIECBAgQIECAaS________________________6BAgQIECBAgQIECBAgQIBpH_____________________-gQIECBAgQIECBAgQIECBAgGkv_______________________-gQIECBAgQIECBAgQIECAaR____-vFmTEESfOi_______oECBAgQIECBAgQIECBAgQIBpL________________________oECBAgQIECBAgQIECBAgGkf_____________________6BAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAg)
  for proper double-height handling.
