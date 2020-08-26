Quick links:
* [edit.tf development blog](https://www.rawles.net/teletext/edit-tf/).
* Free teletext editors:
[edit.tf](http://edit.tf),
[zxnet](https://zxnet.co.uk/teletext/editor/),
[wxTED](https://github.com/peterkvt80/wxted).
* [How-to guide](http://edit.tf/doc/handy-howto.pdf) and
[how-to video](https://www.youtube.com/watch?v=S5WNmw9AHWQ).

# The edit.tf teletext editor

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
the editor by entering the key sequence `Esc ?`.

Pressing the escape key takes you into command mode, in which the status 
bar is coloured yellow, and then typing a (possibly shifted) letter will 
insert a control character or perform some other function. The status 
bar can also be used to view teletext metadata. The key sequence `Esc 9` 
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

The key combination `Esc E` will pop up a box allowing you to export the 
frame. It will appear as a data URI. There are three formats at present. 
Two are raw and differ in how they deal with character codes in the 
range 0x00 to 0x1f. One raw format leaves them untouched, the other sets 
the high bit so they appear as characters in the range 0x80 to 0x9f when 
exported. The other format is 8-bit TTI, designed for use with wxTED, by 
@peterkvt80 - Peter Kwan. This includes metadata which can be viewed 
with `Esc 9` but which unfortunately cannot yet be edited.

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
        // display/edit. Here's the teletext engineering testcard!
        editor.load("0:QIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECAueH8yZosePmAg06Dizo8mdFi0pM6OgJHBh7mVHER5QeHYMi54fzJmix4-YCDToOLOjyZ0WLSkzo6AkcGHuZUcRHlB4dgy_f_3_9__f_3_9__f_3_9__f_3_9__f_3_9__f_3_9__f2DQoaPcyJkqAKgRqAKdBVMvPogoYc-VAgODDxLmWMEwBcwBYNSho9zImSoAqBGoAp0FUy8-iChhz5UCA4MPEuZYwTAFzAFg1AgAKAAgAnkB5AXWEyZYsSJEipUiRKFCiBAUAAQAEABAAWDf9__f_3_9__f_3_9__f_3_9__f_3_9__f_3_9__f_3_9_YOAIACAAgAIACAAgAIACAAgAIACAAgAIACAAgAIACAAgAIBg5_f_3_9__f_3_9__f_3_9__f_3_9__f_3_9__f_3_9__f2LACAAgAIACAAgAIACAAgAIACAAgAIACAAgAIACAAgAIACAYsf3_9__f_3_9__f_3_9__f_3_9__f_3_9__f_3_9__f_39iyAgAIACAAgAIACAAgAIACAAgAIACAAgAIACAAgAIACAAgGLP9__f_3_9__f_3_9__f_3_9__f_3_9__f_3_9__f_3_9_YtAIACAAgAIACAAgAIACAAgAIACAAgAIACAAgAIACAAgAIBi1_f_3_9__f_3_9__f_3_9__f_3_9__f_3_9__f_3_9__f2Lavo09MoOzl2bN_cND84dwKPyy5dwWbhz5d3TCBpZcgSFs65S5pCiRk0iVMnLKFKpWSWLVy8ywYsmZVo1bNyLhy6dlHj18_QIEKJGgSJUydAoUqlaBYtXL0DBiyZoGjVs3QOHLp2gePXz9BAgwoaCJFjR0EiTKloJk2dPQUKNKmgqVa1dBYs2raC5dvX0GDDixoMmXNnQaNOrWg2bd29Bw48uaDp17d0Hjz69oPn39_KYMOLGRyZc2cro06tZLZt3bzXDjy5lunXt3J-PPr2X-ff38GYh792PLh2CI2zDz0A1QsXC3-BNPplw5PJiPv3ZRQp-WvfwUXdn07suXlp3Z0AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA");

    }
    </script>
    <title>edit.tf</title>
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
[the issues for which opinions are currently sought](https://github.com/rawles/edit.tf/labels/opinions%20sought) and contribute to the discussion. The
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
  when the grid is enabled (with `Esc X`). Cells to avoid are not included
  in the grid shown.
* Another application of the editor is for designing BBC Micro frames.
  There are subtle differences in the way each system displays the frame, 
  notably in the handling of double height. The characters in the first
  row of a double-height pair aren't automatically copied to the second
  row. Instead, on a BBC Micro, the two rows need to have identical data.
  This means that effects like the top and bottom of double-height
  characters having different colours, or even different characters
  entirely, may be achieved. This editor does not yet display such effects.
* The editor has a cut and paste function. Firstly, you must define the 
  rectangle you want to cut. After pressing `Esc`, the arrow keys can be 
  used to define the rectangle. During this process, the editor stays in
  escape mode. Lowercase x cuts the rectangle and lowercase c copies it.
  It can then be pasted with `Esc v`.
* You can add an image to the editing window to trace over with `Esc =`. The
  editor prompts you for a URL. The image at this URL will appear beneath
  the editor window, with the editor itself at half opacity.
  Pressing `Esc =` again will make the image disappear again. This is
  demonstrated in 
  [this video by Steve Horsley](https://www.youtube.com/watch?v=CA8U4YW5JZM).
  If you press `=` while defining a rectangle, the image will appear 
  at the size and position of that rectangle.

## Related links

### As seen at...

The editor has been used for various events and systems:

* The editor was originally written for the 
  teletext40 project, a teletext revival project from September 2014 to
  April 2016. When viewing pages
  on the web interface, the user had the option to then edit the page, so that
  it could be submitted back to the site via email.
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
* The editor is used to display [recovered teletext frames](http://www.uniquecodeanddata.co.uk/teletext76/) produced by [Jason Robertson](https://twitter.com/grim_fandango). You can also clean up frames with the editor and send them back to Jason!
* [Adam Dawes](http://www.adamdawes.com/) adapted this code to make 
  [a cool browser interface](http://www.uniquecodeanddata.co.uk/teletext76/bbc2-19830129/) for Jason's recovered frames, which enables you to select pages by 
  page number and step through subpages.
* Heather Merrick uses the editor to prepare
  [Teletext News](https://teletextnews.com/). She describes the process in 
  [an article](https://medium.com/@heathermerrick/teletext-news-behind-the-scenes-372ca36ec179).
* Mr Biffo, of [Digitiser 2000](http://www.digitiser2000.com/) and 
  [lots of other stuff besides](http://www.imdb.com/name/nm1044110/), 
  uses the editor for graphics on the Digitiser2000 site.

The editor has starred in the following videos:

* Carl made a very nice [video tutorial for the editor](https://www.youtube.com/watch?v=S5WNmw9AHWQ).
* Bruno St-Gelais [introduced the editor](https://www.youtube.com/watch?v=SamOoijfBjQ&t=9m19s)
  and some of its functions, using it alongside the wxTED editor. He's also behind the
  teletext-themed animation *[Le Télétexte Malicieux](https://www.youtube.com/watch?v=HBeDH3mlzNg)*.
* Steve Horsley has captured some nice videos [showing how he builds up frames](http://www.horsenburger.com/videos) of his teletext art.
* Mr Biffo used the editor to produce
  [his bizarre ads](https://www.youtube.com/watch?v=RqnnxgmDBvk) and
  [Digifest's intro video](https://www.youtube.com/watch?v=t0aOuPZDxG4).

## Compatibility

* The Windows-based teletext editor [wxTED](https://github.com/peterkvt80/wxted/releases) by Peter Kwan - @peterkvt80 - has 
  implemented import from, and export to, the URLs used in this editor.
  Peter has also produced a Raspberry Pi teletext editor and other cool 
  teletext technologies.

## Splash screens

Teletext artists contribute splash screens which are displayed when the
editor is first loaded. Since a new splash screen replaces the one before,
we keep them here.

* [the original](http://edit.tf/#0:KJGCBgkYIGCRggYJGCBgkYIGCRggYJGCBgkYIGCRggYJGCAo5cOXDlw5cOXDlw5cOXDlw5cOXDlw5cOXDlw5cOXDlw5cOSnvd7_e93v973e_3vd7_e93v973e_3vd7_e93v973e_3vd7CHUBdA4WHixdYsLF1hZYsWLFixYsWLFixYsWGlixZkQIECAodQF9RT-eOf8_Pnz58-fPnz58-fPnz58-fN3___zxzV___yh1AW1FP5441Ohz6BAgQIECBAgQIECBAgQICzUp_PHNX___KHRpfUU_njjU6HPxUERBJNVEBZQgD1DMZAgLNSn88c1f__9AgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQICh1AW1FP5441Ohj6BAgQIECBAgQIECBAgQIC7Up_PHNX___KHUBbUU_njjU6GP9MuzL0y-OiDLk09N_JAgLNSn88c1f__8odQFtRT-eONToc-gQIECBAgQIECBAgQIECAu1KfzxzV___yh00W1IEBYygUrFixYsWLDxdYWLrFhYusWLEyAp_PHNX___Kf____258-fPnz58-fPnz58-fPnz58-fPnz58-fPn5____8odQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQICh0koBUOWXnzDxacNA_BdN6Dtpy90GFBoy7OCDnj5Zcu5cgKHSygNB2bEGblh25UGTD0woNPNBp3IOmjKgq0pi5BU3oECAodDIEHPD2yoPO_ryQd9_LWsQYt-_Xtw8taDpoyoOGHPlXICh0koBQuufmgw7siDh12bEHLLx65efTmg75dmPftyoMPR0gKHQSBBo6dOHN0vX59PTR1xLse_av5Ye-zLzX5cmnot6ZkCAodLKA1Dll58w8WnDQU5EmNUW2g3Tegx7MuHkg6aNPNAgQICh0MgQZuWHblQYd2RBiy59O5Bj5ZcPTTuzoPO_ryQb--5CgKHUCBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECAp3e93_d73f93vd_3e93_d73f93vd_3e93_d73f93vd_3e9ymZNmTZk2ZNmTZk2ZNmTZk2ZNmTZk2ZNmTZk2ZNmTZk2ZNmKIEShEgRKESBEoRIEShEgRKESBEoRIEShEgRKESBEoRIESg)
* [2016-08-29: Steve Horsley](http://edit.tf/#0:QAoW_fr24eWtB00aeaDhhz5UHTeg54e2VB539eSDvv5a0CAo4cOHCAl4KKHDhw4cOHDhw4cOHDhw4cOHDhw4cOHDhw4cOCn79-JKH69IUXbnyZEq_fv379-_fv379-_fv379-_fv379-Kf__96T0f1hLwgI-P_Qor3________________________8ovXryWTwsXJyPj9____rAovXr169evXr169evXr169evXryvx4RwfPn7__fp1e____pSvz58-fPnz58-fPnz58-fPnz58KtyPj___r05Ph86Ed_9iVXL16_-vXr169ev___________8pwI736cns-f____1Ir_7wt__tUGr_q_6v5TgV__0Hz58KcCn_6wJrvvLf_____96sKfC39GhQav-Lnq_lN5X__Qf__8p_Kf_5NctJ7______rViwp_Lf_7X9__6v-r__QFf_9B_alFn8p__l9_sn6____9A-XrSn8t_QIP6D_q_6v5dYV__0H___Kfyn_-9J8PH_____y-zu_Kfy3_-1___-r_q__yqD__Qf2pTh_Kf_5P8vT4eH7ur28OHgp_Lf_7Vfv_6v6r__KoP_9B_alP_8p__k9_dmjVr163oyV_yn_hw4EfRThw4cOHDh04cOHDhw__yqxYkJq__zgR2vSfv-lKqFixIRalVCxYsWLFixYsWLFixYsKIECAv0Jo1__58_P05RAgQICOpCgB1IsyLUi2KiBAgQIECAogQF1X_-9WLMHxgUQIC6BAgItySAGgixJNSfSQIECBAgQICqwv4a7_5L99L__6rpw-fyf9p8KrFixYsWLFixYsWLFixYsKF_X_-yTkv78v__tWX___J_Wm8p8-fPnz58-fPnz58-fPnwvo_6v_9uS-F9rJfoaol-8mvRlPH___________________y65KuXryS5etLr169eUWLFixYvXr169evXr169evXr169evInSaQHQ5ZefNBFpw0CtBaB9N6DHsy4eSDpo080HPHyy5dyAidJpAdDll580EWnDQK0D8Hm38kHTRlQaMuzgg54-WXLuQICJ0ukDwuufmgw7siDll49cvPpzQd8uzHv25ciDD0dIECBAgInS6APo6dOHN0vX59PTR1xLse_av5Ye-zLzX5cmnot6ZkCA), featuring [Mr. Safety](https://www.youtube.com/watch?v=M5lhhFO3Qjw&t=29s).
* [2017-01-27: Raquel Meyers](http://edit.tf/#0:QIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECAi4Q4EyBAgQYEyBAgQIECBAgQIECBAgQIECBAgQIECBAgQEUDVBqQIECBBqQIECBAgLoECBAgQIMHDhgwYMHDggQIECBARQPfGrAsYPEmrAkQIECAugQIECBAw___-rVq1f_7VggQIEBFx19alXBL1ca1LBAgQIC6DUgQePPXf9______9_5fvlgg1EUCBAgQIEHDogQIMCBAgLoNSD1n58-PNX___3-Pjz5897DURQIECBAgQIGqBAg1IECAugRftWoigQF1KxYsWISKAvq1amxFA9YaMjToka6EDTUgQIC6BB_1aiOpRqaePnTQ1SNS-rVqakXHX1q4NWrjruTNdSBAgLoEG_VqI4tjd6r_p9294xL6tWpKRQNUCBAgQIECBA11IECAugQINeojq1Jd_D5wf6krUvq1IUBFApYB2TBi3QEXCFQgQIC6BAg1KuHDgwQIECBAg4cODrUgQIECBAgQIECBAgQIECBAgLoECBEuXr1-bJ8-fOmZcvXr0yBBg_f__RABZNcDJsgjZcS4ugQIECLf____vPnz8____-nQIECr___v0AGHl3dOWVBm38i6BBwcLFixYsWLFixYsWLFizJwQau3Pn-QIAMPft4demndnL4E2r___________________-DL23__-fggQAZGnn038vKwvv-umaNGjRo0aNGjRo0aNGjduf__6_8___0DDw7cXLTkz5S_13_7bPnTJ8-fPnz58-fPmZNg__8_7P__5_nRAgQIEAGrLL___bf9-fPnz58-PPOTJs-IfH9_5__fL_z___2qBAgQIECAvv__2v_OsWLFixZqcuXLv_9__-2___z5t___n_f-iBAgQIC_12_0tV69evXr161WmTJk2bPv__Xfn_9_v_OfN_foECBAgL_06DU1b8-fPnz58-fPnz56XLn___9t__P-_f_6dAgQIECADXioK8GdUQWZ9VCHlT5M5BVpoQMqfJnIKkiKgjValWlFQoAN0Po6dODpev6ZdmXpl8dFvDDy6eV3nDw578nldj37V4G2gQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECA)

### Test frames

Frames to test the correct functionality of the editor appear below. Feel 
free to edit this README with your own test frames, especially if they expose
nasty bugs or demonstrate common mistakes in implementing teletext software.

* Rob of the
  [Teletext Preservation project](http://www.teletext.org.uk/) has contributed a
  [test frame](http://edit.tf/#0:QIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECAa8WrVq3Jl2ZemVB00aeaDnww48qFAgQIECBAgQIECBAgQIBpH__Qf_6D-vXoP3__9Qf__9AgQIECBAgQIECBAgQIECBAgGkv_______________________-gQIECBAgQIECBAgQIECAaRQL_69Ag__PiD_9-fEH___QIECBAgQIECBAgQIECBAgQIBpL________________________oECBAgQIECBAgQIECBAgGkUCD-gQIP_z4g2fPj9Ag-IECBAgQIECBAgQIECBAgQIECAaS________________________6BAgQIECBAgQIECBAgQIBpH_____________________-gQIECBAgQIECBAgQIECBAgGkv_______________________-gQIECBAgQIECBAgQIECAaR____-vFmTEESfOi_______oECBAgQIECBAgQIECBAgQIBpL________________________oECBAgQIECBAgQIECBAgGkf_____________________6BAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAgQIECBAg)
  for proper double-height handling.
