// @licstart  The following is the entire license notice for the 
//  JavaScript code in this page.
//
// Copyright 2015-2017 Simon Rawles, Alan Davies, Tim Hutton, Steve
// Horsley, Alistair Cree, Peter Fagan and David Hall.
//
// The JavaScript code in this page is free software: you can
// redistribute it and/or modify it under the terms of the GNU
// General Public License (GNU GPL) as published by the Free Software
// Foundation, either version 3 of the License, or (at your option)
// any later version.  The code is distributed WITHOUT ANY WARRANTY;
// without even the implied warranty of MERCHANTABILITY or FITNESS
// FOR A PARTICULAR PURPOSE.  See the GNU GPL for more details.
//
// As additional permission under GNU GPL version 3 section 7, you
// may distribute non-source (e.g., minimized or compacted) forms of
// that code without the copy of the GNU GPL normally required by
// section 4, provided you include this license notice and a URL
// through which recipients can access the Corresponding Source.
//
// @licend  The above is the entire license notice for the JavaScript
//  code in this page.

// Several editors can be on a single page. We need to keep track of
// which editor receives keypresses and mouse events.
var active_editor = null;

// We also need to allow at most one editor to read to and write from
// the URL.
var url_editor = null;

// Editor is the main object, and encapsulates all the functionality
// of a single editor canvas.
function Editor() { // beginning of Editor, but we're not indenting.

var editor_this = this;

///////////////////////
///// GLOBAL DATA /////
///////////////////////

// These mostly define the state of the frame or the editor UI.

				 // Descriptions refer to (x,y), ie row y, column x.

var cc = [];	 // cc[y][x] = the character code (0..127) at (x,y).

var fg = [];	 // fg[y][x] = foreground colour (0..7) at (x,y).

var bg = [];	 // bg[y][x] = background colour (0..7) at (x,y).

var tg = [];	 // text or graphics at (x,y)?
				 // tg[y][x] = 0 if text, 1 if graphics.

var cs = [];	 // contiguous or separated graphics at (x,y)?
				 // cs[y][x] = 0 if contiguous, 1 if separated.

var nd = [];	 // normal or double height text at (x,y)?
				 // nd[y][x] = 0 if normal, 1 if double,
				 //   2 if normal but has been reset from double.

var hg = [];	 // has held graphics been enabled for (x,y)?
				 // hg[y][x] = 0 if held graphics disabled, 1 if enabled.

var sc = [];	 // is the character at (x,y) shown or concealed?
				 // sc[y][x] = 0 if shown, 1 if concealed.

var sf = [];	 // is the character at (x,y) steady or flashing?
				 // sf[y][x] = 0 if steady, 1 if flashing.

var fs = [];	 // is row y the first or second row of double height?
				 // fs[y] = 0 if unassigned, 1 if first, 2 if second.

var font = [];	 // font[c][y] = integer describing the bit pattern for
				 // character c, row y.

var curx = 0;	 // the column at which the cursor is currently.
var cury = 0;	 // the row at which the cursor is currently.

// When doing cut and paste we display a rectangle which represents the area
// which is going to be cut. Usually this is set to -1 in both coordinates to
// show no area is active. Actually, when *either* is set to -1 we assume that
// rectangle selection is not active.
// When the escape key is pressed, they are set.

var curx_opposite = -1;
var cury_opposite = -1;

var clipboard = []; // clipboard[y][x] is the clipped character at row y, col x
var clipboard_size_x = 0;
var clipboard_size_y = 0;

var escape = 0;	 // has escape been pressed? 0 if no, 1 if yes.
var dead_key = 0; // dead key pressed previously. 0 if not, otherwise char code
var statusmode = 0; // what is the statusbar showing?
		 // 0 means the usual information about the current cell.
		 // 1 means the additional teletext metadata
var statushidden = 1; // is the statusbar temporarily hidden with ESC-0?
		 // 0 if no, 1 if yes.
var helpscreenshown = 0; // is the help screen being shown?
		 // 0 if no, 1 if yes
var showcc = 0;  // are we showing control characters? 0 if no, 1 if yes.
var cset = 0;	 // the current character set (1..8).
var reveal = 0;  // is reveal on? 0 if no, 1 if yes.
var grid = 1;	 // is the grid shown? 0 if no, 1 if guides, 2 if yes.
var blackfg = 0; // do we permit the use of black foreground (0x0 and
		 // 0x10) control codes? 0 if not, 1 if so.

var trace = 0; // Are we in tracing mode? 0 if no, 1 if yes
var trace_url = ""; // The last image URL used for this.

// We hold the trace rectangle in global state so that we can handle
// changes in aspect ratio.
var trace_position_x = 0;
var trace_position_y = 0;
var trace_size_x = 0;
var trace_size_y = 0;
var trace_whole_area = 0; // Does the trace image fill the whole area?
var trace_opacity = 1;

var full_pix_scale = 2;
		 // draw at a higher resolution than we display at, to
				 // look better zoomed in.
var pix_scale = full_pix_scale;
		 // specifies how much to stretch the x direction.
var aspect_ratios = [1, 1.1, 1.2, 1.22, 1.3, 1.33, 1.36, 1.4, 1.5, 1.75, 2];
var current_ratio = 2; // index of aspect_ratios
var aspect_ratio = aspect_ratios[current_ratio];
var pix_size = 1;
		 // If all the pixels are 1:1

var active_export = 0;
		 // if non-zero, there are URLs for export on the screen
		 // which should be invalidated on a change.
var canvasid = "canvas";
		 // The HTML id for the canvas.

// Page metadata:
var m_page = 0x100; // This page's number within the magazine.
			// This is hexadecimal. range: 0x100..0x7ff
var m_subpage = 0;  // This page's subpage number within the
			// page. Not necessarily the subcode. Range
			// is 0x00 to 0xff.
var m_subcode = 0x3f7f;  // This page's subcode/subpage number.
			// This is hexadecimal. range: 0x0..0x3f7f
			// Note that the third nybble may only range from
			// 0 to 7.
var m_control = [];  // The control bits for this page.

var m_fastext_red = 0x8FF;
var m_fastext_green = 0x8FF;
var m_fastext_yellow = 0x8FF;
var m_fastext_cyan = 0x8FF;
var m_fastext_link = 0x8FF;
var m_fastext_index = 0x8FF;
			// These are fastext links to other pages.
			// Also hexadecimal, but may be 0x8FF to indicate
			// no link.

// Initialises the state of the screen.
var init_state = function() {

	init_canvas();

	// Set up the arrays...
	for (var r = 0; r <= 24; r++) {
		cc[r] = []; fg[r] = []; bg[r] = [];
		tg[r] = []; cs[r] = []; nd[r] = [];
		hg[r] = []; sc[r] = []; sf[r] = [];
		fs[r] = 0; clipboard[r] = [];
		for (var c = 0; c < 40; c++) {
			clear_char(c,r);
		}
	}

	// Initialise the font to the default character set.
	init_font(cset);

	// Set the control bits
	for ( var i = 4; i <= 14; i++ ) { m_control[i] = 0; }

	// Load the page data from the hash, if possible.
	load_from_hash();
}


// init_canvas() is called also when the aspect ratio is adjusted.
var init_canvas = function() {

	// The dimensions depend on whether the status bar is shown
	width = 480; height = 540;
	if ( statushidden == 1 ) { height = 500; }

	var c = document.getElementById(canvasid);

	// set the 'logical' width and height, the code is designed for 480x520,
	// scaled up to look better when zoomed in
	c.width = width*pix_scale;
	c.height = height*pix_scale;

	// set the width and hight to display on-screen, with the modified aspect ratio
	c.style.width = (pix_size*width*aspect_ratio)+"px";
	c.style.height = (pix_size*height)+"px";

	// Clear the canvas with a background colour
	var ctx = c.getContext("2d");
	ctx.fillStyle = "#000";
	ctx.fillRect(0, 0, width*pix_scale, height*pix_scale);
	ctx.textAlign = "left";

	// Initialise the background trace image
	init_trace();
}

var init_trace = function() {
	var cfdiv = document.querySelector("div#canvasframe");
	var cf = document.querySelector("canvas#frame");
	if ( trace == 0 ) {
		cfdiv.style.background = "";
		cfdiv.style.backgroundSize = "";
		trace_opacity = 1;
		cf.style.opacity = "";
	}
	if ( trace == 1 ) {
		if ( trace_whole_area == 1 ) { // We are tracing the whole area
			cfdiv.style.background = "url(\"" + trace_url + "\") no-repeat center top";
		} else { // We are tracing a sub-rectangle
			cfdiv.style.background = "url(\"" + trace_url + "\") no-repeat "
				+ ( trace_position_x * aspect_ratio) + "px " + trace_position_y + "px";
		}
		cfdiv.style.backgroundSize = ( trace_size_x * aspect_ratio ) + "px " + trace_size_y + "px";
		cfdiv.style.backgroundOrigin = "content-box";
		set_trace_opacity(0.5);
	}
}

var set_trace_opacity = function(new_trace_opacity) {
	// If trace is disabled, this makes no sense.
	if ( trace == 0 ) { return; }
	var cf = document.querySelector("canvas#frame");
	trace_opacity = new_trace_opacity;
	cf.style.opacity = trace_opacity;
}

// Resets an individual character at position (x,y) to default
// attributes, like you would find at the start of a line.
var clear_char = function(x,y) {
	cc[y][x] = 32; fg[y][x] = 7; bg[y][x] = 0;
	tg[y][x] = 0; cs[y][x] = 0; nd[y][x] = 0;
	hg[y][x] = 0; sc[y][x] = 0; sf[y][x] = 0;
}

// Sets the grid on or off and renders the whole
// frame again to show it.
var show_grid = function(newgrid) {
	grid = newgrid;
	render(0, 0, 40, 25);
}
var toggle_grid = function() {
	var newgrid = grid + 1;
	if ( newgrid == 3 ) { newgrid = 0; }
	show_grid(newgrid);
}

// Changes whether we allow black foreground.
var set_blackfg = function(newblackfg) {
	blackfg = newblackfg;

	// We have to do a full redraw because the *meaning* of
	// some control codes have changed!
	redraw();
}

// Enables or disables the display of control codes and
// refreshes the affected cells.
var toggle_codes = function() {
	showcc = 1 - showcc;
	show_codes(showcc);
	}

var show_codes = function(newcode) {
	showcc = newcode;

	// Update all cells which contain a control character
	for (var r = 0; r < 25; r++) {
		for (var c = 0; c < 40; c++) {
			if (
				( cc[r][c] >= 0 && cc[r][c] <= 31 ) // a control character
			||	( sc[r][c] > 0 ) // a concealed character
				) {
				autorender(c, r, 1, 1, 2);
			}
		}
	}
}

// Clears those pixels corresponding to the cells described.
// The cells' top-left corner is (x,y), and the area has width
// w and height h.
var cls = function(ctx,x,y,w,h) {
	ctx.clearRect(x*12*pix_scale, y*20*pix_scale, w*12*pix_scale, h*20*pix_scale);
}

// Performs a fill character copy, including attributes.
// Copies from cell (x1, y1) to (x2,y2).
var copy_char = function(x1,y1,x2,y2) {
	cc[y2][x2] = cc[y1][x1]; fg[y2][x2] = fg[y1][x1];
	bg[y2][x2] = bg[y1][x1]; tg[y2][x2] = tg[y1][x1];
	cs[y2][x2] = cs[y1][x1]; nd[y2][x2] = nd[y1][x1];
	hg[y2][x2] = hg[y1][x1]; sc[y2][x2] = sc[y1][x1];
	sf[y2][x2] = sf[y1][x1];
}

// Deletes the row that the cursor is on.
var delete_row = function(r) {
	invalidate_export();

	// For each row, copy the data from the row below.
	for ( var y = r; y < 24; y++ ) {
		for ( var x = 0; x < 40; x++ ) {
			copy_char(x,y+1,x,y);
		}
	}

	// Clear the bottom row.
	for ( var x = 0; x < 40; x++ ) {
		clear_char(x,24)
	}

	// We may have deleted a double height character, so
	// we need may need to adjust for this.
	adjustdh_fullscreen(0);

	// Re-render the affected area.
	render(0, r, 40, 25-r);
}

// Inserts an empty row at row r.
var insert_row = function(r) {
	invalidate_export();

	// Working up from the bottom of the screen, copy the
	// data from the row above.
	for ( var y = 23; y >= r; y-- ) {
		for ( var x = 0; x < 40; x++ ) {
			copy_char(x,y,x,y+1);
		}
	}

	// Clear the row.
	for ( var x = 0; x < 40; x++ ) {
		clear_char(x,r)
	}

	adjustdh_fullscreen(0);
	render(0, r, 40, 25-r);
}

// Duplicates row r to the one below it, shifting all
// the rows below it down.
var duplicate_row = function(r) {
	invalidate_export();

	// Working up from the bottom of the screen, copy the
	// data from the row above.
	for ( var y = 23; y >= r; y-- ) {
		for ( var x = 0; x < 40; x++ ) {
			copy_char(x,y,x,y+1);
		}
	}

	adjustdh_fullscreen(0);
	render(0, r, 40, 25-r);
}

// Redraw the whole screen by deleting its contents and
// re-writing each character onto it.
var redraw = function() {
	// Clear all attributes
	for ( var y = 0; y < 25; y++ ) {
		for ( var x = 0; x < 40; x++ ) {
			fg[y][x] = 7; bg[y][x] = 0;
			tg[y][x] = 0; cs[y][x] = 0; nd[y][x] = 0;
			hg[y][x] = 0; sc[y][x] = 0; sf[y][x] = 0;
		}
	}

	// Write each character back to the screen.
	for ( var r = 0; r < 25; r++) {
		for ( var c = 0; c < 40; c++) {
			var code = cc[r][c];
			if ( placeable(code) == 1 ) {
				place_code(c, r, code, 0);
			} else {
				cc[r][c] = code;
			}
		}
	}

	// Re-render the whole screen.
	render(0,0,40,25);
}

// Clear each character and reset the double height
// row. If andrender is non-zero, also re-renders the
// frame.
var wipe = function(andrender) {
	invalidate_export();

	// clear out stored extended hash string key=value pairs
	hashStringKeys = [];
	hashStringValues = [];

	m_page = 0x100;
	m_subcode = 0x3f7f;
	for ( var i = 4; i <= 14; i++ ) { m_control[i] = 0; }
	m_fastext_red = 0x8FF;
	m_fastext_green = 0x8FF;
	m_fastext_yellow = 0x8FF;
	m_fastext_cyan = 0x8FF;
	m_fastext_link = 0x8FF;
	m_fastext_index = 0x8FF;

	for ( var r = 0; r < 25; r++ ) {
		for ( var c = 0; c < 40; c++ ) {
			clear_char(c, r);
		}
		fs[r] = 0;
	}
	if ( andrender != 0 ) {
		render(0,0,40,25,0);
	}
}

////////////////////////////////
///// MOUSE EVENT HANDLING /////
////////////////////////////////

// The following three variables together identify the subpixel which was
// last flipped, so that we don't rapidly flicker a subpixel on and off
// when the button is pressed.
var mouse_last_x = -1;
var mouse_last_y = -1;
var mouse_last_bitflip = -1;

// A change to graphics characters might have a knock-on effect via held
// graphics to other cells. Computing this on each bit-flip is expensive,
// so we store the span (the character cells between locations (x1,y1)
// and (x2,y2)) so that its effect on other characters can be determined.
var mouse_span_x1 = -1;
var mouse_span_y1 = -1;
var mouse_span_x2 = -1;
var mouse_span_y2 = -1;

// The status of the mouse button, describing whether it's up (0) or
// down (1).
var mouse_button = 0;

// 'State' here means whether we're clearing or setting pixels for a
// particular period of holding the mouse button.
// -1 means we haven't yet got an on-off state for this,
// 0 means turn off for this drag
// 1 means turn on for this drag
var mouse_state = -1;

// Handle a mouse click. (canvasx, canvasy) are the coordinates of the
// click relative to the canvas, rather than the browser window, or
// something else. state enables the caller to pass in a current value
// of the state, and if unset (-1) sets it to the right value.
// 'Click' is a misnomer. If the mouse is dragged, that's considered a
// series of clicks.
var mouse_click = function(canvasx, canvasy, state) {

	// Before processing the click, hide the help screen if it's being
	// displayed.
	hide_help_screen();

	// First, locate the position in the character grid (x,y) of this click,
	// and the position in the character cell (sx,sy) itself.
	var x = Math.floor( canvasx / (12*aspect_ratio) );
	var y = Math.floor( canvasy / 20 );
	var sx = canvasx - ( 12 * x * aspect_ratio);
	var sy = canvasy - ( 20 * y );

	// Just check that we're not in rectangle selection mode. If we are, we
	// just want to reposition the opposite end of the rectangle, re-render
	// and return.
	if ( curx_opposite != -1 && cury_opposite != -1 ) {
		old_curx = curx
		old_cury = cury
		cury = y
		curx = x
		var x1 = Math.min(old_curx, curx, curx_opposite);
		var y1 = Math.min(old_cury, cury, cury_opposite);
		var x2 = Math.max(old_curx, curx, curx_opposite);
		var y2 = Math.max(old_cury, cury, cury_opposite);
		render(x1, y1, x2 - x1 + 1, y2 - y1 + 1);
		return state;
	}

	// Double height, of course, complicates things. If we are in double
	// height mode, flipping a bit would need to be done on maybe the
	// cell (x,y) and maybe the cell above. The actual character we're
	// editing is called (ex,ey)
	var ex = x; var ey = y;

	// dh_part identifies one of four situations we could be in with respect
	// to double height. We default to 0, which means the normal height,
	// nothing special or unusual.
	var dh_part = 0;

	if ( y > 0 && nd[y][x] == 1 && fs[y] == 1 ) {
		// The top row of a double height line
		dh_part = 1;
	}
	if ( y > 0 && nd[y-1][x] == 1 && fs[y] == 2 ) {
		// The bottom row of a double height line
		ey = y - 1;
		dh_part = 2;
	}
	if ( y > 0 && ( nd[y-1][x] == 0 || nd[y-1][x] == 2 ) && fs[y] == 2 ) {
		// The bottom row of a double height line, but one in which there's
		// no double height showing there (it's normal height or has been
		// reset from double height).
		ey = y - 1;
		dh_part = 3;

		// This can't be edited, so we just ignore it by returning the
		// supplied state.
		return state;
	}

	// Can we even edit the character here? If not just return the state
	// unchanged.

	// If this is a text character, let's reposition the cursor there (bug
	// #20) and return.
	if ( tg[ey][ex] == 0 ) {
		old_curx = curx
		old_cury = cury
		cury = ey
		curx = ex
		render(old_curx, old_cury, 1, 1);
		render(curx, cury, 1, 1);
		return state;
	}

	if ( ! ( tg[ey][ex] == 1 &&
		( ( cc[ey][ex] >= 32 && cc[ey][ex] < 64 )
		|| ( cc[ey][ex] >= 96 && cc[ey][ex] < 128 ) ) ) ) { return state; }

	// 'Bitflip' here means the value of the bit which we want to flip.
	// It therefore uniquely identifies the subpixel.
	var bitflip = 0;

	// In the normal case, we just need to look up which subpixel we're
	// in by considering the region each subpixel occupies.
	if ( dh_part == 0 ) {
		if ( sx < 6 && sy < 6 ) { bitflip = 1; }
		if ( sx > 5 && sy < 6 ) { bitflip = 2; }
		if ( sx < 6 && sy > 5 && sy < 14 ) { bitflip = 4; }
		if ( sx > 5 && sy > 5 && sy < 14 ) { bitflip = 8; }
		if ( sx < 6 && sy > 13 ) { bitflip = 16; }
		if ( sx > 5 && sy > 13 ) { bitflip = 64; }
	}

	// If it's part of a line, we need to consider these regions
	// stretched over two lines, and what the boundaries of this stretched
	// region would be on each of those lines.
	if ( dh_part == 1 ) { // top part
		if ( sx < 6 && sy < 12 ) { bitflip = 1; }
		if ( sx > 5 && sy < 12 ) { bitflip = 2; }
		if ( sx < 6 && sy > 11 ) { bitflip = 4; }
		if ( sx > 5 && sy > 11 ) { bitflip = 8; }
	}
	if ( dh_part == 2 ) { // bottom part
		if ( sx < 6 && sy < 8 ) { bitflip = 4; }
		if ( sx > 5 && sy < 8 ) { bitflip = 8; }
		if ( sx < 6 && sy > 7 ) { bitflip = 16; }
		if ( sx > 5 && sy > 7 ) { bitflip = 64; }
	}

	// We might just have done this, and don't want to blink the bit
	// forever, so if this was the last one, just return here with
	// the state unchanged.
	if ( mouse_last_x == ex && mouse_last_y == ey
		&& mouse_last_bitflip == bitflip ) { return state; }

	// If we've moved into this subpixel (or clicked on it), and
	// we've not yet decided whether we're going to set or clear
	// pixels on this drag, then decide.
	if ( state == -1 ) {
		if ( ( cc[ey][ex] & bitflip ) > 0 ) { state = 0; } else { state = 1; }
	}

	// Perform the flip.
	if ( state == 0 ) { cc[ey][ex] &= ~bitflip } // Switch off
	if ( state == 1 ) { cc[ey][ex] |= bitflip; } // Switch on

	// This will invalidate any export.
	invalidate_export();

	// Extend the span if we're outside of it, so we can update the
	// effects of this flip on characters affected by held graphics.
	if ( mouse_span_x1 == -1 || mouse_span_y1 == -1 || ey < mouse_span_y1
		|| ( ey == mouse_span_y1 && ex < mouse_span_x1 )) {
		mouse_span_x1 = ex;
		mouse_span_y1 = ey;
	}
	if ( mouse_span_x2 == -1 || mouse_span_y2 == -1 || ey > mouse_span_y2
		|| ( ey == mouse_span_y2 && ex > mouse_span_x2 )) {
		mouse_span_x2 = ex;
		mouse_span_y2 = ey;
	}

	// Render this character
	autorender(ex,ey,1,1,0);

	// Update the last subpixel visited.
	mouse_last_x = ex;
	mouse_last_y = ey;
	mouse_last_bitflip = bitflip;

	// Return the (possibly new) value of state to the caller.
	return state;
}

// click_listener takes the mouse events along with the current state
// and extracts the position of the click relative to the canvas.
var click_listener = function(event, state) {

	// Is it a right-click? If so, ignore it - the user is likely
	// trying to save the canvas.
	if ( ( event.which && event.which == 3 )
	|| ( event.button && event.button == 2 ) ) {
	// Just return the state which we're in already.
	return state;
	}

	// Compute the position of the canvas.
	var offsetx = 0;
	var offsety = 0;
	var frame_element = document.getElementById(canvasid);

	// Step up through the frame's parents and accumulate their
	// contribution to the offset.
	do {
		offsetx += frame_element.offsetLeft - frame_element.scrollLeft;
		offsety += frame_element.offsetTop - frame_element.scrollTop;
	}
	while( frame_element = frame_element.offsetParent )

	// Taking the position of the click relative to the page, subtract
	// the offset of the canvas to get the position relative to the
	// canvas.
	var x = event.pageX - offsetx;
	var y = event.pageY - offsety;

	// We clip the result to the canvas coordinates.
	if ( x < 0 ) { x = 0; }
	if ( x >= 12*40*aspect_ratio ) { x = 12*40*aspect_ratio - 1; }
	if ( y < 0 ) { y = 0; }
	if ( y >= 20*25 ) { y = 20*25 - 1; }

	// mouse_click will assign a new state which we can store in the
	// global variable mouse_state
	return mouse_click(x, y, state);
}

// Sets up the listeners for the mouse.
var init_mouse = function() {
	var canvas = document.getElementById(canvasid);

	// What happens when the mouse button is clicked ...
	canvas.addEventListener("mousedown", function (e) {
		mouse_button = 1;
		// what will the state be for this drag?
		mouse_state = click_listener(e, -1)

	// This click makes the editor associated with this
	// canvas the active editor.
	active_editor = editor_this;

	}, false);

	// ... and when it's released ...
	canvas.addEventListener("mouseup", function (e) {
		mouse_button = 0;

		// reset all the 'last' values
		mouse_last_x = -1; mouse_last_y = -1; mouse_last_bitflip = -1;
		mouse_state = -1;

		// Update characters if we've affected them through
		// held graphics
		if ( mouse_span_x1 != -1 && mouse_span_y1 != -1
			&& mouse_span_x2 != -1 && mouse_span_y2 != -1 ) {
			gfx_change(mouse_span_x1, mouse_span_y1,
				mouse_span_x2, mouse_span_y2);
		}

		// Reset the span, now we have dealt with it.
		mouse_span_x1 = -1;
		mouse_span_y1 = -1;
		mouse_span_x2 = -1;
		mouse_span_y2 = -1;

		// update the url now the mouse has been released
		save_to_hash();
	}, false);

	// ... and when it's dragged.
	canvas.addEventListener("mousemove", function (e) {

		// If the button is down, record this as a click.
		if ( mouse_button == 1 ) {
			mouse_state = click_listener(e, mouse_state);
		}
	}, false);
}


////////////////////////////////////////////////
///// LOADING AND SAVING FROM THE URL HASH /////
////////////////////////////////////////////////

// The editor doesn't communicate with a 'cloud' or anything like
// that. Teletext frames are small enough to sit in the URL itself.
// You can then save by bookmarking the page, or pasting it into an
// email to your teletext friends, etc. The data is in the 'hash'
// part of the URL, ie the part after the # symbol. These two functions
// help us load from it and save to it. This should be very cheap
// so while we could compress and decompress, we don't need to.

// The URL contains a base-64-encoded sequence of bits. The encoding
// is standard 'base64url' with URL and Filename Safe Alphabet (RFC
// 4648 §5 'Table 2: The "URL and Filename safe" Base 64 Alphabet').
// After decoding, the seven-bit character code for column c and row
// r appears at bit positions (280r+7c) to (280r+7c+6), the most
// significant bit appearing first. This gives hash strings of 'only'
// 1122 characters.

// A direct way to load and render a hashstring.
this.load = function(hashstring) {
	load_from_hashstring(hashstring);
	render(0, 0, 40, 25, 0);
}

// Loads data from the hash into the frame.
var load_from_hash = function() {

	// Stop here if this isn't the editor reading from the hash.
	if ( editor_this != url_editor ) { return; }

	// We fetch the hash's value and remove the first character
	// which is the hash symbol itself.
	var hashstring = window.location.hash.substring(1);

	load_from_hashstring(hashstring);
}

var hashStringKeys = [];
var hashStringValues = [];

var load_from_hashstring = function(hashstring) {
	// It's a good idea to have a bit of metadata here describing
	// which character set we're using. If the colon is there, this
	// metadata is assumed to be supplied.
	if ( hashstring.indexOf(":") > -1 ) {

		// The metadata is here, so split it out.
		var parts = hashstring.split(":");

		// metadata is one nybble. The most significant bit is
		// whether we're enabling black foreground. The three
		// least significant bits describe the character set we're
		// using.

		// Extract the base-10 integer, assuming 0 (English) if it
		// turns out not to make sense.
		var metadata = parseInt(parts[0], 16);
		if ( isNaN(metadata) ) { metadata = 0; }

		var cset_reqd = metadata % 8;
		blackfg = 0;
		if ( metadata >= 8 ) { blackfg = 1; }

		// A change of character set requires a reload of the font.
		if ( cset_reqd >= 0 && cset_reqd < 8 && cset != cset_reqd ) {
			cset = cset_reqd;
			init_font(cset);
		}

		// The data replaces the value in hashstring ready for
		// decoding.
		hashstring = parts[1];

		// store any extended page hash key=value pairs
		hashStringKeys = [];
		hashStringValues = [];

		for (i = 2; i < parts.length; i++){
			var keyPair = parts[i];
			var delimOffset = keyPair.search("=");
			if (delimOffset > 0){
				hashStringKeys.push(keyPair.slice(0,delimOffset));
				hashStringValues.push(keyPair.slice(delimOffset+1));
			} else {
				console.log("invalid keypair ",keyPair);
			}
		}

		var hashPageNumber;
		if (hashStringKeys.indexOf("PN") > -1){
			hashPageNumber = parseInt(hashStringValues[hashStringKeys.indexOf("PN")],16);
		} else {
			hashPageNumber = 0x8FF;
		}
		if (hashPageNumber < 0x100 || hashPageNumber > 0x8FF || (hashPageNumber & 0xFF) == 0xFF || isNaN(hashPageNumber)){
			m_page = 0x8FF;
		} else {
			m_page = hashPageNumber;
		}

		var hashSubpageNumber;
		if (hashStringKeys.indexOf("SC") > -1){
			hashSubpageNumber = parseInt(hashStringValues[hashStringKeys.indexOf("SC")],16);
		} else {
			hashSubpageNumber = 0x3F7F;
		}
		if (hashSubpageNumber & 0xC080 || hashSubpageNumber > 0x3F7E || isNaN(hashSubpageNumber)){
			m_subcode = 0x3F7F;
		} else {
			m_subcode = hashSubpageNumber;
		}

		var hashPageOptions;
		if (hashStringKeys.indexOf("PS") > -1){
			hashPageOptions = parseInt(hashStringValues[hashStringKeys.indexOf("PS")],16);
		} else {
			hashPageOptions = 0;
		}
		if (hashPageOptions > 0xC3FF || isNaN(hashPageOptions)){
			hashPageOptions = 0;
		}
		m_control[4] = (hashPageOptions & 0x4000) ? true : false;
		m_control[5] = (hashPageOptions & 0x0001) ? true : false;
		m_control[6] = (hashPageOptions & 0x0002) ? true : false;
		m_control[7] = (hashPageOptions & 0x0004) ? true : false;
		m_control[8] = (hashPageOptions & 0x0008) ? true : false;
		m_control[9] = (hashPageOptions & 0x0010) ? true : false;
		m_control[10] = (hashPageOptions & 0x0020) ? true : false;
		m_control[11] = (hashPageOptions & 0x0040) ? true : false;
		m_control[12] = (hashPageOptions & 0x0200) ? true : false;
		m_control[13] = (hashPageOptions & 0x0100) ? true : false;
		m_control[14] = (hashPageOptions & 0x0080) ? true : false;

		var hashFasttextLinks = "";
		var navigationPages = [];
		if (hashStringKeys.indexOf("X270") > -1){
			hashFasttextLinks = hashStringValues[hashStringKeys.indexOf("X270")];
		} else {
			/* clear navigation links */
			for (var i=0; i<6; i++){
				hashFasttextLinks += "8FF3F7F";
			}
		}

		m_fastext_red = parseInt(hashFasttextLinks.slice(0,3), 16);
		m_fastext_red = isNaN(m_fastext_red)?0x8FF:m_fastext_red;
		m_fastext_green = parseInt(hashFasttextLinks.slice(7,10), 16);
		m_fastext_green = isNaN(m_fastext_green)?0x8FF:m_fastext_green;
		m_fastext_yellow = parseInt(hashFasttextLinks.slice(14,17), 16);
		m_fastext_yellow = isNaN(m_fastext_yellow)?0x8FF:m_fastext_yellow;
		m_fastext_cyan = parseInt(hashFasttextLinks.slice(21,24), 16);
		m_fastext_cyan = isNaN(m_fastext_cyan)?0x8FF:m_fastext_cyan;
		m_fastext_link = parseInt(hashFasttextLinks.slice(28,31), 16);
		m_fastext_link = isNaN(m_fastext_link)?0x8FF:m_fastext_link;
		m_fastext_index = parseInt(hashFasttextLinks.slice(35,38), 16);
		m_fastext_index = isNaN(m_fastext_index)?0x8FF:m_fastext_index;

	}

	// We may be dealing with old hexadecimal format, in which the
	// 1920 hexadecimal digits after the colon are such that the
	// byte for row r and column c (both zero-indexed) is described
	// by the two hex digits starting at position 80r+2c. Base-64
	// is the new format. If we get a URL in the hexadecimal format
	// the editor will convert it.

	if ( hashstring.length == 1920 ) {
		// The alphabet of symbols!
		var hexdigits = "0123456789abcdef";

		// Iterate through each row and each column in that row.
		for ( var r = 0; r < 24; r++) {

			// It's a good test to do this backwards!
			for ( var c = 39 ; c >= 0; c--) {

				// Default to a space.
				cc[r][c] = 32;

				// The characte offset for this value is as follows:
				var offset = 2 * ( ( r * 40 ) + c );

				// If the data is here, turn it into an integer between 0 and
				// 127, and set the cc-array with that code.
				// If it's a control character, place it, so the attributes update.
				if ( offset + 1 < hashstring.length ) {
					var hv1 = hexdigits.indexOf(hashstring.substr(offset, 1));
					var hv2 = hexdigits.indexOf(hashstring.substr(offset + 1, 1));
					if ( hv1 > -1 && hv2 > -1 ) {
						var newcode = ( ( hv1 * 16 ) + hv2 ) % 128;
						if ( placeable(newcode) == 1 ) {
							place_code(c, r, newcode, 0);
						} else {
							cc[r][c] = newcode;
						}
					}
				}
			}
		}
	}

	// This block deals with the new base 64 format.

	// We need to be able to handle two cases here, depending on the
	// size of the frame. 24-line frames have 1120 characters, and
	// 25-line frames, the new way we do things, have 1167 characters.
	// 25-line frames have two bits at the end which are ignored and
	// just exist for padding.

	if ( hashstring.length == 1120 || hashstring.length == 1167 ) {
		var numlines = 25;
		if ( hashstring.length == 1120 ) { numlines = 24; }

		// As we scan across the hashstring, we keep track of the
		// code for the current character cell we're writing into.
		var currentcode = 0;

		// p is the position in the string.
		for ( var p = 0; p < hashstring.length; p++ ) {
			var pc = hashstring.charAt(p);
			var pc_dec = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_"
				.indexOf(hashstring.charAt(p));

			// b is the bit in the 6-bit base-64 character.
			for ( var b = 0; b < 6; b++ ) {

				// The current bit posiiton in the character being
				// written to.
				var charbit = ( 6*p + b ) % 7;

				// The bit value (set or unset) of the bit we're
				// reading from.
				var b64bit = pc_dec & ( 1 << ( 5 - b ) );
				if ( b64bit > 0 ) { b64bit = 1; }

				// Update the current code.
				currentcode |= b64bit << ( 6 - charbit );

				// If we've reached the end of this character cell
				// and it's the last bit in the character we're
				// writing to, set the character code or place the
				// code.
				if ( charbit == 6 ) {

					// Work out the cell to write to and put it there.
					var charnum = ( ( 6*p + b ) - charbit ) / 7;
					var c = charnum % 40;
					var r = (charnum - c) / 40;
					if ( placeable(currentcode) == 1 ) {
						place_code(c, r, currentcode, 0);
					} else {
						cc[r][c] = currentcode;
					}

					// Reset for next time.
					currentcode = 0;
				}
			}
		}

		// If we only read in a 24-line file, we need to blank the final
		// line.
		if ( numlines == 24 ) {
			for ( var x = 0; x < 40; x++ ) { clear_char(x,24) }
		}
	}
}

// Similarly, we want to save the page to the hash. This simply
// converts the character set and page data into a hex string and
// puts it there.

// Now that the editor is 25 lines, this format is the one we
// save to. There are two whole left-over bits at the end of
// the encoding. Yes, it's wasteful, but for now, we'll have to
// let that go.
var save_to_hash = function() {

	// Stop here if this isn't the editor reading from the hash.
	if ( editor_this != url_editor ) { return; }

	var encoding = "";
	if (mouse_button == 1) {
		// optimisation: don't update hash while drawing
		return;
	}

	// Construct the metadata as described above.
	var metadata = cset;
	if ( blackfg != 0 ) { metadata += 8; }
	encoding += metadata.toString(16);
	encoding += ":";

	// Construct a base-64 array by iterating over each character
	// in the frame.
	var b64 = [];
	for ( var r=0; r<25; r++ ) {
		for ( var c=0; c<40; c++ ) {
			for ( var b=0; b<7; b++ ) {

				// How many bits into the frame information we
				// are.
				var framebit = 7 * (( r * 40 ) + c) + b;

				// Work out the position of the character in the
				// base-64 encoding and the bit in that position.
				var b64bitoffset = framebit % 6;
				var b64charoffset = ( framebit - b64bitoffset ) / 6;

				// Read a bit and write a bit.
				var bitval = cc[r][c] & ( 1 << ( 6 - b ));
				if ( bitval > 0 ) { bitval = 1; }
				b64[b64charoffset] |= bitval << ( 5 - b64bitoffset );
			}
		}
	}

	// Encode bit-for-bit.
	for ( var i = 0; i < 1167; i++ ) {
		encoding += "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_".charAt(b64[i]);
	}

	/* restore extended hash key=value pairs */
	for (var i = 0; i < hashStringKeys.length; i++){
		encoding += ":"+hashStringKeys[i]+"="+hashStringValues[i];
	}

	if (window.location.hash != encoding) { window.location.hash = encoding; }
}

// Many people asked for a way to export frames from the editor. This function
// provides one way to do that which is easier than converting the URL. It
// converts the frame to raw format, and then edits the document to show a link
// using the data URI scheme. The user can save this link to their own computer
// without the server needing to store it.
var export_frame = function() {

	// People have requested graphic file exports, so we hide the status
	// bar in case we need to do this here.
	hide_status_bar();

	// We can't substitute characters for the base64 in the address bar
	// becase the output must constain newlines and the addressbar uses
	// seven bits for each character. Therefore we must export in a
	// different way.

	var rawstring_0 = "";
	var rawstring_1 = "";

	// We also construct TTI files for wxTED.
	// PN: page number
	var ttistring = "PN,"
		+ m_page.toString(16).toUpperCase()
		+ padstring("0", 2, m_subpage.toString())
		+ "\r\n";
	// DE: description
	ttistring = ttistring + "DE,edit.tf\r\n";

	// We construct the TTI page status (PS) value by copying over
	// the values of the control bits.
	var tti_ps = 0x8000; // normal parallel transmission
	if ( m_control[4] != 0 ) { tti_ps += 0x4000; }
	if ( m_control[5] != 0 ) { tti_ps += 0x0001; }
	if ( m_control[6] != 0 ) { tti_ps += 0x0002; }
	if ( m_control[7] != 0 ) { tti_ps += 0x0004; }
	if ( m_control[8] != 0 ) { tti_ps += 0x0008; }
	if ( m_control[9] != 0 ) { tti_ps += 0x0010; }
	if ( m_control[10] != 0 ) { tti_ps += 0x0020; }
	if ( m_control[11] != 0 ) { tti_ps += 0x0040; }
	if ( m_control[12] != 0 ) { tti_ps += 0x0200; }
	if ( m_control[13] != 0 ) { tti_ps += 0x0100; }
	if ( m_control[14] != 0 ) { tti_ps += 0x0080; }

	ttistring = ttistring + "PS,"
		+ padstring("0", 4, tti_ps.toString(16).toUpperCase())
		+ "\r\n";

	// SC: subcode
	ttistring = ttistring + "SC,"
		+ padstring("0", 4, m_subcode.toString(16).toUpperCase())
		+ "\r\n";

	for ( var r=0; r<25; r++ ) {
		var ttirowstring = "";
		var blankrow = true;
		for ( var c=0; c<40; c++ ) {
			var xcc = cc[r][c];
			if (xcc != 0x20) { blankrow = false; }
			rawstring_0 = rawstring_0 + String.fromCharCode(xcc);
			if ( xcc < 32 ) {
				rawstring_1 = rawstring_1 + String.fromCharCode(xcc + 128);
				if ( r > 0 ) {
					ttirowstring = ttirowstring + String.fromCharCode(0x1B);
					ttirowstring = ttirowstring + String.fromCharCode(xcc + 64);
				}
			} else {
				rawstring_1 = rawstring_1 + String.fromCharCode(xcc);
				if ( r > 0 ) {
					ttirowstring = ttirowstring + String.fromCharCode(xcc);
				}
			}
		}
		rawstring_0 = rawstring_0 + "\n";
		rawstring_1 = rawstring_1 + "\n";
		if ( r > 0 && !blankrow) {
			// OL: output line
			ttistring = ttistring + "OL," + r + "," + ttirowstring + "\r\n";
		}
	}

	// FL: fastext link
	if ((m_fastext_red & m_fastext_green & m_fastext_yellow & m_fastext_cyan & m_fastext_link & m_fastext_index) != 0x8FF){
		ttistring = ttistring + "FL,"
			+ m_fastext_red.toString(16)
			+","+ m_fastext_green.toString(16)
			+","+ m_fastext_yellow.toString(16)
			+","+ m_fastext_cyan.toString(16)
			+","+ m_fastext_link.toString(16)
			+","+ m_fastext_index.toString(16)
			+"\r\n";
	}

		// We provide an experimental EP1 format. This probably isn't
		// compliant with any specification. Particularly, the values at
		// positions 1 to 5 mean nothing to me. They are probably metadata.
		// Perhaps if the specification were freely available, I could
		// figure out how to export properly. Thanks for Peter Kwan for
		// helping me with this. --rawles
		var ep1string = String.fromCharCode(254);
		ep1string = ep1string + String.fromCharCode(1);
		ep1string = ep1string + String.fromCharCode(9);
		ep1string = ep1string + String.fromCharCode(0);
		ep1string = ep1string + String.fromCharCode(0);
		ep1string = ep1string + String.fromCharCode(0);
		for ( var r=0; r<25; r++ ) {
		for ( var c=0; c<40; c++ ) {
						ep1string = ep1string + String.fromCharCode(cc[r][c]);
				}
		}
		ep1string = ep1string + String.fromCharCode(0);
		ep1string = ep1string + String.fromCharCode(0);

	var datauri_0 = "data:text/plain;base64,"+window.btoa(rawstring_0);
	var datauri_1 = "data:text/plain;base64,"+window.btoa(rawstring_1);
	var datauri_tti = "data:text/plain;base64,"+window.btoa(ttistring);
	var datauri_ep1 = "data:text/plain;base64,"+window.btoa(ep1string);
	var hashstring = "";
	if ( window.location.hash.length > 0 ) {
		hashstring = window.location.hash.substring(1);
	}
	var datauri_hs =
		"data:text/plain;base64,"+window.btoa(hashstring);

	var datauri_png =
		document.getElementById('frame').toDataURL('image/png');

	document.getElementById('export').innerHTML =
		"<div class=\"exportbox\">Export as: "
		+ "<a href=\""+datauri_hs+"\">URI hash</a>, "
		+ "<a href=\""+datauri_0+"\">raw (0x00-0x7f)</a>, "
		+ "<a href=\""+datauri_1+"\">raw (0x20-0x9f)</a>,<br/>"
		+ "<a href=\""+datauri_tti+"\">TTI</a>, "
			+ "<a href=\""+datauri_ep1+"\">EP1</a>, "
			+ "<a href=\""+datauri_png+"\">PNG</a>, "
		+ "<a href=\"http://zxnet.co.uk/teletext/editor/#"+hashstring+"\" target=\"_blank\">zxnet editor</a>"
		+ "</div>";
	active_export = 1;
}

// When a page changes, invalidate_export is called to remove any export links
// on the screen, since they no longer reflect the frame as shown.
var invalidate_export = function() {
	if ( active_export != 0 ) {
		document.getElementById('export').innerHTML = "";
		active_export = 0;
	}
}



///////////////////
///// COLOURS /////
///////////////////


// The colours for the frame, and some related colours like for
// cursors and control codes, are decided by this function.
// The colour numbers are described below. For each colour the
// option to return a highlighted version (highlight > 0 ) is given.
// this is for the highlighting that a cursor does, mostly.
var colour = function(number, highlight) {

	// 0: black
	if ( number == 0 && highlight == 0 ) { return "#000000"; }
	if ( number == 0 && highlight == 1 ) { return "#2c2c2c"; }
	if ( number == 0 && highlight == 2 ) { return "#585858"; }

	// 1: red
	if ( number == 1 && highlight == 0 ) { return "#ff0000"; }
	if ( number == 1 && highlight == 1 ) { return "#dd0000"; }
	if ( number == 1 && highlight == 2 ) { return "#bb0000"; }

	// 2: green
	if ( number == 2 && highlight == 0 ) { return "#00ff00"; }
	if ( number == 2 && highlight == 1 ) { return "#00dd00"; }
	if ( number == 2 && highlight == 2 ) { return "#00bb00"; }

	// 3: yellow
	if ( number == 3 && highlight == 0 ) { return "#ffff00"; }
	if ( number == 3 && highlight == 1 ) { return "#dddd00"; }
	if ( number == 3 && highlight == 2 ) { return "#bbbb00"; }

	// 4: blue
	if ( number == 4 && highlight == 0 ) { return "#0000ff"; }
	if ( number == 4 && highlight == 1 ) { return "#0000dd"; }
	if ( number == 4 && highlight == 2 ) { return "#0000bb"; }

	// 5: magenta
	if ( number == 5 && highlight == 0 ) { return "#ff00ff"; }
	if ( number == 5 && highlight == 1 ) { return "#dd00dd"; }
	if ( number == 5 && highlight == 2 ) { return "#bb00bb"; }

	// 6: cyan
	if ( number == 6 && highlight == 0 ) { return "#00ffff"; }
	if ( number == 6 && highlight == 1 ) { return "#00dddd"; }
	if ( number == 6 && highlight == 2 ) { return "#00bbbb"; }

	// 7: white
	if ( number == 7 && highlight == 0 ) { return "#ffffff"; }
	if ( number == 7 && highlight == 1 ) { return "#dddddd"; }
	if ( number == 7 && highlight == 2 ) { return "#bbbbbb"; }

	// 8 is a special colour number for control characters
	if ( number == 8 && highlight == 0 ) { return "#888888"; }
	if ( number == 8 && highlight == 1 ) { return "#5c5c5c"; }
	if ( number == 8 && highlight == 2 ) { return "#333333"; }

	// 9 is for control characters copied from the line
	// above in the case of double height, so we can see
	// the relationship.
	if ( number == 9 && highlight == 0 ) { return "#555555"; }
	if ( number == 9 && highlight == 1 ) { return "#3b3b3b"; }
	if ( number == 9 && highlight == 2 ) { return "#222222"; }

	// For all other values just return white!
	return "#fff";
	}

// This simple helper function just gives a name to each colour.
var colour_name = function(col) {
	if ( col == 0 ) { return "black"; }
	if ( col == 1 ) { return "red"; }
	if ( col == 2 ) { return "green"; }
	if ( col == 3 ) { return "yellow"; }
	if ( col == 4 ) { return "blue"; }
	if ( col == 5 ) { return "magenta"; }
	if ( col == 6 ) { return "cyan"; }
	if ( col == 7 ) { return "white"; }
}


//////////////////////
///// STATUS BAR /////
//////////////////////

// The status bar appears at the bottom of the editor and gives lots
// of handy information about the state of the editor. It is called
// frequently, whenever the state of the editor changes.
// There are two flavours of status bar. One shows mostly
// the attributes for the current cell, and is used in editing.
// The other shows the metadata for the frame, and is used
// when attaching links and other metadata to the frame prior
// to export.
// The variable 'statusmode' indicates which of these is active.
var draw_status_bar = function() {

	// There is nothing to draw if the status bar has been hidden.
	if ( statushidden != 0 ) { return; }

	var c = document.getElementById(canvasid);
	var ctx = c.getContext("2d");

	// If we're in escape mode, colour the status bar to make it clear.
	if ( escape == 1 ) { 
		if ( curx_opposite != -1 && cury_opposite != -1 
			&& ( curx_opposite != curx || cury_opposite != cury ) ) {
				ctx.fillStyle = "#399";
			} else {
				ctx.fillStyle = "#993";
			}
	}
	if ( escape != 1 ) { ctx.fillStyle = "#808080"; }

	// Draw the background to the bar and set up the font.
	ctx.fillRect(0, (25*20+2)*pix_scale, 40*12*pix_scale, 36*pix_scale);

	ctx.font = (13*pix_scale)+"px Arial";
	ctx.fillStyle = "#000";
	ctx.textAlign = "left";

	if ( statusmode == 0 ) { draw_status_bar_frame(ctx); }
	if ( statusmode == 1 ) { draw_status_bar_metadata(ctx); }
	
	highlight_hints();
}

var draw_status_bar_metadata = function(ctx) {
	var offset = 5*pix_scale;
	var spacing = 43*pix_scale;

	ctx.fillText("p" + m_page.toString(16), offset, 516*pix_scale);
	ctx.fillText("subpage " +
		padstring("0", 2, m_subpage.toString()),
		offset+(0.75*spacing), 516*pix_scale);
	ctx.fillText("subcode=" +
		padstring("0", 4, m_subcode.toString(16).toUpperCase()),
		offset+(2.5*spacing), 516*pix_scale);
	ctx.fillText("fastext links: ", offset+(4.75*spacing), 516*pix_scale);

	ctx.fillStyle = "#f00";
	// XXX is displayed when there is no link.
	var displayed_page = "XXX";
	if ( m_fastext_red >= 0x100 && m_fastext_red < 0x8ff ) {
		displayed_page = m_fastext_red.toString(16).toUpperCase();
	}
	ctx.fillText(displayed_page, offset+(6.5*spacing), 516*pix_scale);

	ctx.fillStyle = "#0f0";
	displayed_page = "XXX";
	if ( m_fastext_green >= 0x100 && m_fastext_green < 0x8ff ) {
		displayed_page = m_fastext_green.toString(16).toUpperCase();
	}
	ctx.fillText(displayed_page, offset+(7.25*spacing), 516*pix_scale);

	ctx.fillStyle = "#ff0";
	displayed_page = "XXX";
	if ( m_fastext_yellow >= 0x100 && m_fastext_yellow < 0x8ff ) {
		displayed_page = m_fastext_yellow.toString(16).toUpperCase();
	}
	ctx.fillText(displayed_page, offset+(8*spacing), 516*pix_scale);

	ctx.fillStyle = "#0ff";
	displayed_page = "XXX";
	if ( m_fastext_cyan >= 0x100 && m_fastext_cyan < 0x8ff ) {
		displayed_page = m_fastext_cyan.toString(16).toUpperCase();
	}
	ctx.fillText(displayed_page, offset+(8.75*spacing), 516*pix_scale);

	// This link is just a hint to the decoder to cache an possible
	// subsequent page. I didn't know what colour to use, so, because
	// it's less important, I used grey.
	ctx.fillStyle = "#666";
	displayed_page = "XXX";
	if ( m_fastext_link >= 0x100 && m_fastext_link < 0x8ff ) {
		displayed_page = m_fastext_link.toString(16).toUpperCase();
	}
	ctx.fillText(displayed_page, offset+(9.5*spacing), 516*pix_scale);

	// The index link is white.
	ctx.fillStyle = "#fff";
	displayed_page = "XXX";
	if ( m_fastext_index >= 0x100 && m_fastext_index < 0x8ff ) {
		displayed_page = m_fastext_index.toString(16).toUpperCase();
	}
	ctx.fillText(displayed_page, offset+(10.25*spacing), 516*pix_scale);

	// And now the control bits. These are a bit esoteric for most
	// usages, but the user may need to refer to them or edit them.
	// There's no attempt to explain the meaning of each bit - I
	// think that would take up too much space on the bar.
	ctx.fillStyle = "#000";
	ctx.fillText("control: ", offset, 532*pix_scale);
	ctx.fillText((m_control[4]==0)?"c4=0":"c4=1", offset+(1.25*spacing),
		532*pix_scale);
	ctx.fillText((m_control[5]==0)?"c5=0":"c5=1", offset+(2.25*spacing),
		532*pix_scale);
	ctx.fillText((m_control[6]==0)?"c6=0":"c6=1", offset+(3.25*spacing),
		532*pix_scale);
	ctx.fillText((m_control[7]==0)?"c7=0":"c7=1", offset+(4.25*spacing),
		532*pix_scale);
	ctx.fillText((m_control[8]==0)?"c8=0":"c8=1", offset+(5.25*spacing),
		532*pix_scale);
	ctx.fillText((m_control[9]==0)?"c9=0":"c9=1", offset+(6.25*spacing),
		532*pix_scale);
	ctx.fillText((m_control[10]==0)?"c10=0":"c10=1", offset+(7.25*spacing),
		532*pix_scale);
	ctx.fillText((m_control[11]==0)?"c11=0":"c11=1", offset+(8.25*spacing),
		532*pix_scale);

	// This is the national option character subset. We display it as a
	// binary string.
	var charsubset =
		((m_control[12]!=0)?"1":"0")
	+	((m_control[13]!=0)?"1":"0")
	+	((m_control[14]!=0)?"1":"0");
	ctx.fillText("c12..c14=" + charsubset, offset+(9.25*spacing),
		532*pix_scale);
}

var draw_status_bar_frame = function(ctx) {
	// Values are spaced out by specifying multipliers of spacing units
	// and offset by the offset value below. This way we can stretch
	// the positioning a bit.
	var offset = 5*pix_scale;
	var spacing = 43*pix_scale;

	// The items in the status bar:

	// character code
	ctx.fillText("0x" + cc[cury][curx].toString(16), offset, 516*pix_scale);

	// cursor position, or the corners of the cursor rectangle
	if ( curx_opposite == -1 || cury_opposite == -1 ) {
		ctx.fillText(curx+","+cury, offset+(0.8*spacing), 516*pix_scale);
		} else {
		//ctx.fillText(curx+";"+cury, offset+(0.8*spacing), 516*pix_scale);
		ctx.fillText(curx+","+cury+" "+curx_opposite+","+cury_opposite, offset+(0.8*spacing), 516*pix_scale);
		}

	// foreground and background colour
	ctx.fillText(
		colour_name(fg[cury][curx])
		+" "+(tg[cury][curx]==0?"text":"graphics")
		+" on "+colour_name(bg[cury][curx]),
		offset+(2.5*spacing), 516*pix_scale);

	// normal or double height?
	var heighttext = "normal height";
	if ( nd[cury][curx] == 1 ) { heighttext = "double height"; }
	if ( nd[cury][curx] == 2 ) { heighttext = "height reset"; }
	ctx.fillText(heighttext, offset+(6.9*spacing), 516*pix_scale);

	// In the spare space, a hint for getting more help, in case
	// the editor is shown on a page without the key sequences table.
	ctx.fillText("ESC-? for help", offset+(9.0*spacing), 516*pix_scale);

	// Set the name for the character set
	var charsetname = "Unknown";
	if ( cset == 0 ) { charsetname = "English"; }
	if ( cset == 1 ) { charsetname = "German"; }
	if ( cset == 2 ) { charsetname = "Swedish"; }
	if ( cset == 3 ) { charsetname = "Italian"; }
	if ( cset == 4 ) { charsetname = "Belgian"; }
	if ( cset == 5 ) { charsetname = "ASCII"; }
	if ( cset == 6 ) { charsetname = "Hebrew"; }
	if ( cset == 7 ) { charsetname = "Cyrillic"; }

	ctx.fillText(charsetname, offset, 532*pix_scale);

	// is reveal on or off?
	ctx.fillText(reveal==0?"reveal off":"reveal on", offset+(1.25*spacing), 532*pix_scale);

	// released or held graphics?
	ctx.fillText(hg[cury][curx]==0?"released":"held", offset+(2.75*spacing), 532*pix_scale);

	// is this concealed? (shown or hidden?)
	ctx.fillText(sc[cury][curx]==0?"shown":"hidden", offset+(4.25*spacing), 532*pix_scale);

	// steady or flash?
	ctx.fillText(sf[cury][curx]==0?"steady":"flash", offset+(5.5*spacing), 532*pix_scale);

	// Are we allowing 0x0 chars?
	ctx.fillText(blackfg==0?"no black fg":"black fg", offset+(6.65*spacing), 532*pix_scale);

	// contiguous or separated?
	ctx.fillText(cs[cury][curx]==0?"contiguous":"separated", offset+(8.3*spacing), 532*pix_scale);

	// aspect ratio
	ctx.fillText(aspect_ratio+"x", offset+9.9*spacing, 532*pix_scale);

	// compliance light
	ctx.beginPath();
	ctx.arc(offset+10.8*spacing, 528*pix_scale, 6*pix_scale,
		0, 2 * Math.PI, false);
	ctx.fillStyle = "black";
	ctx.fill();
	ctx.closePath();
	ctx.beginPath();
	ctx.arc(offset+10.8*spacing, 528*pix_scale, 5*pix_scale,
		0, 2 * Math.PI, false);

	var compliance = compliance_level();
	ctx.fillStyle = "#000000";
	if ( compliance >= 0 ) { ctx.fillStyle = "#ff0000"; }
	if ( compliance >= 1 ) { ctx.fillStyle = "#990000"; }
	if ( compliance >= 2 ) { ctx.fillStyle = "#999900"; }
	if ( compliance >= 3 ) { ctx.fillStyle = "#009900"; }
	if ( compliance >= 4 ) { ctx.fillStyle = "#00ff00"; }
	ctx.fill();
}

// If we have hidden the status bar, we only want to do so until something
// else happens, to avoid the user from editing with no guidance. This
// function is called when there's a keyboard event, to make sure the
// status bar is back.
var unhide_status_bar = function() {
	if ( statushidden != 0 ) {
		statushidden = 0;

		// Because this is likely to be used for editing, return
		// to the full underlying resolution.
		pix_scale = full_pix_scale;
		init_canvas();
		render(0,0,40,25,0);
		draw_status_bar();
		highlight_hints();
	}
}

var hide_status_bar = function() {
	if ( statushidden == 0 ) {
		statushidden = 1;

		// Because this is likely to be used for a screen shot,
		// reduce the underlying resolution.
		pix_scale = 1;
		init_canvas();
		render(0,0,40,25,0);
		highlight_hints();
	}
}

var highlight_hints = function() { 
	var rectangle_select = 0;
	if ( curx_opposite != -1 && cury_opposite != -1
		&& ( curx_opposite != curx
			|| cury_opposite != cury ) ) {
		rectangle_select = 1;
	}
	var roffgroup = document.getElementById("rectangle-off");
	if ( escape == 1 && ( ! ( rectangle_select == 1 ) ) ) { 
		roffgroup.style.background = "#111";
	} else {
		roffgroup.style.background = "#222";
	}
	var rongroup = document.getElementById("rectangle-on");
	if ( escape == 1 && rectangle_select == 1 ) { 
		rongroup.style.background = "#111";
	} else {
		rongroup.style.background = "#222";
	}
	var eoffgroup = document.getElementById("esc-off");
	if ( escape == 0 ) { 
		eoffgroup.style.background = "#111";
	} else {
		eoffgroup.style.background = "#222";
	}
}

var compliance_level = function() {
	// Bright red means that the frame can't exist on a broadcast system.
	for (var c = 0; c <= 7; c++) { if ( cc[0][c] != 32 ) return 0; }
	for (var c = 0; c <= 39; c++) {
		if ( cc[0][c] == 13 || cc[23][c] == 13 || cc[24][c] == 13  )
			return 0;
	}

	// Dull red means that the user has overwritten the header line.
	for (var c = 8; c <= 39; c++) { if ( cc[0][c] != 32 ) return 1; }

	// Yellow means that row 24, reserved for Fastext, has been overwritten.
	for (var c = 0; c <= 39; c++) { if ( cc[24][c] != 32 ) return 2; }

	// Dull green means the frames can be fixed without looking any
	// different, for example by removing control characters, and be
	// compliant.

	// Bright green means everything is groovy.
	return 4;
}

this.set_escape = function(newvalue) {
	if ( newvalue == 0 && escape == 1 ) { disappear_cursor_rectangle(); }
	if ( newvalue == 1 && escape == 0 ) {
		curx_opposite = curx;
		cury_opposite = cury;
	}
	escape = newvalue;
}

////////////////////
///// KEYBOARD /////
////////////////////

// Here we handle keyboard events. Some events are keydown (a key is
// pressed) and others are keypress (a character is produced). I developed
// this code with Firefox, so I also handle some of its quirks here.

this.keydown = function(event) {

	// The editor does nothing with a modifier key event on its own.
	// therefore, ignore any keydown event which is a modifier key.
	var shifted = 0;
	if ( event.shiftKey || event.altKey || event.ctrlKey || event.metaKey ) {
		shifted = 1;
	}

	var code = ('which' in event) ? event.which : event.keyCode;

	// Escape key toggles the escape mode and redraws the status bar.
	if ( code == 27 ) {
		escape++;
		escape = escape % 2;
		if ( escape == 0 ) {
			disappear_cursor_rectangle();
		}
		if ( escape == 1 ) {
			curx_opposite = curx;
			cury_opposite = cury;
		}
		draw_status_bar();
		return;
	}

	unhide_status_bar();
	hide_help_screen();

	var rectangle_select = is_rectangle_select();
	
	if ( rectangle_select == 0 || ( rectangle_select == 1 && shifted == 0 ) ) {
		// The four cursor keys are handled by their own functions.
		if ( code == 37 ) { cursor_left(); return; }
		if ( code == 39 ) { cursor_right(); return; }
		if ( code == 40 ) { cursor_down(); return; }
		if ( code == 38 ) { cursor_up(); return; }
	}
	
	if ( rectangle_select == 1 && shifted == 1 ) { 
		var x1 = Math.min(curx_opposite, curx);
		var x2 = Math.max(curx_opposite, curx);
		var y1 = Math.min(cury_opposite, cury);
		var y2 = Math.max(cury_opposite, cury);
		
		if ( code == 37 ) { shift_sixels(x1, y1, x2, y2, -1, 0); }
		if ( code == 39 ) { shift_sixels(x1, y1, x2, y2, 1, 0); }
		if ( code == 40 ) { shift_sixels(x1, y1, x2, y2, 0, 1); }
		if ( code == 38 ) { shift_sixels(x1, y1, x2, y2, 0, -1); }
		
		gfx_change(x1, y1, x2, y2);
		autorender(x1, y1, 40 - x1, y2 - y1 + 1);
	}

	// Pressing return is considered a cursor action here.
	if ( code == 13 ) { cursor_nl(); return; }

	// Backspace deletes a character while tab inserts one. These have
	// special meanings in Firefox, so I block the keypress going to Firefox
	// with preventDefault().
	if ( code == 8 ) { event.preventDefault(); cursor_bs(); return; }
	if ( code == 9 ) { event.preventDefault(); cursor_tab(); return; }

	// Handle dead keys for input of diacritical marks
	if ( code == 221) { dead_key = code; }
	if ( code == 187) { dead_key = code; }
}

this.keypress = function(event) {
	var code = ( 'charCode' in event ) ? event.charCode : event.keyCode;

	// Code 0 means there was simply no keypress.
	if ( code == 0 ) { return; }

	code = keymap(code, dead_key);

	// If dead key was set it has been used by now
	dead_key = 0

	// On Internet Explorer, ESC key triggers keypress too,
	// so return since we've already handled ESC in keydown
	if ( code == 27 ) { return; }

	// Stop Firefox interpreting this keypress as a shortcut for the
	// app. Non-Latin keyboards sometimes send Latin character keypresses
	// if a meta key is pressed.
	if ( code >= 32 && code < 128 && typeof event.preventDefault === "function" ) { event.preventDefault(); }

	unhide_status_bar();

	// We will need to redraw the status bar if we've changed the escape
	// state.
	var old_esc = escape;

	// We can set this for commands which retain the rectangle and the
	// escape mode.
	var retain_rectangle = 0;

	if ( escape == 1 ) { // if we're in escape mode...

		var rectangle_select = 0;
		if ( curx_opposite != -1 && cury_opposite != -1
			&& ( curx_opposite != curx
				|| cury_opposite != cury ) ) {
			rectangle_select = 1;
		}

		// We keep track of whether we've found an action for this key
		// with these two variables.
		var matched = 0; var placed_code = -1;

		// I want to reserve the following keys for future features
		// that I expect to be used a lot: [P]age and [L]oad.
		// [S] is used for separated graphics, but [T]ransmit might
		// work with an API. Maybe Separa*T*ed and Con*T*iguous, or
		// *T*iled might work as a mnemonic.

		// First, the colours...
		if ( blackfg != 0 && code == 107 ) { placed_code = 0; }  // blac[k]
		if ( code == 114 ) { placed_code = 1; }  // [r]ed
		if ( code == 103 ) { placed_code = 2; }  // [g]reen
		if ( code == 121 ) { placed_code = 3; }  // [y]ellow
		if ( code == 98 )  { placed_code = 4; }  // [b]lue
		if ( code == 109 ) { placed_code = 5; }  // [m]agenta
		if ( rectangle_select == 0 && code == 99 ) { // [c]yan
			placed_code = 6;
		}
		if ( code == 119 ) { placed_code = 7; }  // [w]hite

		if ( blackfg != 0 && code == 75 )  { placed_code = 16; } // Blac[K]
		if ( code == 82 )  { placed_code = 17; } // [R]ed
		if ( code == 71 )  { placed_code = 18; } // [G]reen
		if ( code == 89 )  { placed_code = 19; } // [Y]ellow
		if ( code == 66 )  { placed_code = 20; } // [B]lue
		if ( code == 77 )  { placed_code = 21; } // [M]agenta
		if ( code == 67 )  { placed_code = 22; } // [C]yan
		if ( code == 87 )  { placed_code = 23; } // [W]hite

		// A = allow or disallow black foreground
		if ( rectangle_select == 0 && code == 65 ) { set_blackfg(1); matched = 1; }
		if ( rectangle_select == 0 && code == 97 ) { set_blackfg(0); matched = 1; }

		// Q = toggle hide/show control codes
		if ( code == 81 || code == 113 ) { toggle_codes(); matched = 1; }
		// J = insert block
		// This just resets the code and it falls through to the case
		// where the user has pressed escape but no action is bound to
		// the next keypress, ie to just write it to the screen.
		if ( code == 74 || code == 106 ) { code = 127; }

		// X = toggle the grid
		if ( rectangle_select == 0 && ( code == 88 || code == 120 ) ) {
			matched = 1; toggle_grid();
		}

		// I = insert and delete a row
		if ( code == 73 ) { matched = 1; delete_row(cury); }
		if ( code == 105 ) { matched = 1; insert_row(cury); }

		// U = duplicate a row
		if ( code == 85 || code == 117 ) { matched = 1; duplicate_row(cury); }

		// D = double height (and normal height)
		if ( rectangle_select == 0 && code == 68 ) { placed_code = 13; }
		if ( rectangle_select == 0 && code == 100 ) { placed_code = 12; }

		// F = flash (and steady)
		if ( code == 70 ) { placed_code = 8; }
		if ( code == 102 ) { placed_code = 9; }

		// H = hold (and release) graphics
		if ( code == 72 ) { placed_code = 30; }
		if ( code == 104 ) { placed_code = 31; }

		// - = toggle reveal
		if ( code == 45 ) {
			matched = 1; toggle_reveal_state();
		}

		// O = insert a conceal character
		if ( code == 79 || code == 111 ) { placed_code = 24; }

		// N = new background (and black background)
		if ( code == 78 ) { placed_code = 29; }
		if ( code == 110 ) { placed_code = 28; }

		// S = separated (and contiguous)
		if ( rectangle_select == 0 && code == 83 ) { placed_code = 26; }
		if ( rectangle_select == 0 && code == 115 ) { placed_code = 25; }

		// Z = wipe or redraw the screen
		if ( code == 90 ) { matched = 1; if (confirm("Clear whole screen?")) wipe(1); }
		if ( code == 122 ) { matched = 1; redraw(); }

		// E = export frame
		if ( code == 69 || code == 101 ) { matched = 1; export_frame(); }

		// 9 = teletext metadata
		if ( code == 57 ) {
			matched = 1;
			statusmode = 1 - statusmode;
		}

		// < and > (formerly [ and ], still supported) = narrower/wider screen
		if ( code == 91 || code == 60 ) {
			matched = 1;
			current_ratio--;
			if ( current_ratio < 0 ) { current_ratio = 0; }
			aspect_ratio = aspect_ratios[current_ratio];
			init_canvas();
			render(0,0,40,25,0);
		}

		if ( code == 93 || code == 62 ) {
			matched = 1;
			current_ratio++;
			if ( current_ratio >= aspect_ratios.length ) {
				current_ratio = aspect_ratios.length - 1;
			}
			aspect_ratio = aspect_ratios[current_ratio];
			init_canvas();
			render(0,0,40,25,0);
		}

		// We can also switch between character sets here.
		// & cycles to the next one.
		if ( code == 38 ) { matched = 1; cycle_charset(); }
		
		// The use of digits to select character set is obsolete, but will
		// remain here until the keys are needed.
		if ( code == 49 ) { matched = 1; set_charset(0); }   // [1] English
		if ( code == 50 ) { matched = 1; set_charset(1); }   // [2] German
		if ( code == 51 ) { matched = 1; set_charset(2); }   // [3] Swedish
		if ( code == 52 ) { matched = 1; set_charset(3); }   // [4] Italian
		if ( code == 53 ) { matched = 1; set_charset(4); }   // [5] Belgian
		if ( code == 54 ) { matched = 1; set_charset(5); }   // [6] US-ASCII
		if ( code == 55 ) { matched = 1; set_charset(6); }   // [7] Hebrew
		if ( code == 56 ) { matched = 1; set_charset(7); }   // [8] Cyrillic

		// We can hide the status bar with ESC-0:
		if ( code == 48 ) {
			matched = 1;
			hide_status_bar();
		}

		// We can show the help screen wth ESC-?:
		if ( code == 63 ) {
			matched = 1;
			show_help_screen();
		}

		// [v] to paste
		if ( code == 86 || code == 118 ) {
			matched = 1;

			if ( clipboard_size_x != -1 && clipboard_size_y != -1 ) {
				// We need to clip the size of the rectangle to avoid writing
				// off the edge of the screen.

				var x_max = curx + clipboard_size_x; if ( x_max > 40 ) { x_max = 40; }
				var y_max = cury + clipboard_size_y; if ( y_max > 25 ) { y_max = 25; }

				for ( var y = cury; y < y_max; y++ ) {
					for ( var x = curx; x < x_max; x++ ) {
						put_char(x, y, clipboard[y-cury][x-curx]);
					}
					// hint that this span may have had graphics changed.
					gfx_change(x1, y, x2, y);
				}
				
				// When we paste, we select the pasted cells so we can more easily
				// re-cut.
				curx_opposite = curx + clipboard_size_x - 1;
				if ( curx_opposite > 39 ) { curx_opposite = 39; }
				cury_opposite = cury + clipboard_size_y - 1;
				if ( cury_opposite > 24 ) { cury_opposite = 24; }
				retain_rectangle = 1;
				
				// Normally we'd render as we wrote each character. This isn't a good
				// idea since we'll end up re-rendering the cell lots. Instead we put
				// the characters, still updating the control codes, and render at the
				// end. We just render to the end of each line.
				autorender(curx, cury, 40-curx, clipboard_size_y);
			}

		}

		// [x] to cut, [c] to copy
		if ( rectangle_select == 1
			&& ( code == 67 || code == 99
				|| code == 88 || code == 120 )
			) {
			matched = 1;

			// is this a cut or a copy (do we delete the cells)
			var cut = 0;
			if ( code == 88 || code == 120 ) { cut = 1; }

			var x1 = Math.min(curx_opposite, curx);
			var x2 = Math.max(curx_opposite, curx);
			var y1 = Math.min(cury_opposite, cury);
			var y2 = Math.max(cury_opposite, cury);
			for (var y = y1; y <= y2; y++ ) {
				for (var x = x1; x <= x2; x++ ) {
					clipboard[y-y1][x-x1] = cc[y][x];
					if ( cut == 1 ) { put_char(x, y, 32); }
				}
				// hint that this span may have had graphics changed.
				if ( cut == 1 ) { gfx_change(x1, y, x2, y); }
			}
			clipboard_size_x = x2 - x1 + 1;
			clipboard_size_y = y2 - y1 + 1;
			
			// When we cut we move the cursor to the top left corner of the 
			// rectangle so we can more easily re-paste.
			curx = x1;
			cury = y1;
			
			disappear_cursor_rectangle();
			if ( cut == 1 ) {
				autorender(x1, y1, 40 - x1, y2 - y1 + 1);
			}
			// If we haven't changed the content of the cells, we just need
			// to do a simple render to remove the shading that shows the
			// rectangle.
			if ( cut == 0 ) {
				render(x1, y1, 40 - x1, y2 - y1 + 1);
			}
		}

		if ( code == 61 ) { // [=] to 'trace-me-do'
			matched = 1;
			invert_trace = 0;
			if ( trace == 0 ) {
				var pattern1 = new RegExp("^https?:\/\/");
				var pattern2 = new RegExp("^file:\/\/");
				trace_url = prompt("URL of image to use for tracing:", trace_url);
				if ( trace_url == null ) { trace_url = ""; }
				if ( pattern1.test(trace_url) || pattern2.test(trace_url) ) {
					if ( curx_opposite != -1 && cury_opposite != -1
						&& ( curx_opposite != curx || cury_opposite != cury ) ) {
						// We are in block select greater than 1x1
						// Here the user wants the background to appear for only a subrectangle
						// of the screen. Compute the position and size of this rectangle.
						trace_position_x = Math.min(curx, curx_opposite) * 12;
						trace_position_y = Math.min(cury, cury_opposite) * 20;
						trace_size_x = ( Math.abs(curx - curx_opposite) + 1 ) * 12;
						trace_size_y = ( Math.abs(cury - cury_opposite) + 1 ) * 20;
						trace_whole_area = 0;
					} else { // regular cursor mode, or 1x1 block select. Fill the area!
						trace_position_x = 0;
						trace_position_y = 0;
						trace_size_x = 480;
						trace_size_y = 500;
						trace_whole_area = 1;
					}
					invert_trace = 1;
				}
			}
			if ( trace == 1 ) { invert_trace = 1; }
			if ( invert_trace == 1 ) { trace = 1 - trace; }

			init_trace();
		}

		if ( code == 123 ) {
			new_trace_opacity = trace_opacity + 0.25;
			if ( new_trace_opacity > 1 ) {
				new_trace_opacity = 1;
			}
			set_trace_opacity(new_trace_opacity);
			matched = 1;
		}

		if ( code == 125 ) {
			new_trace_opacity = trace_opacity - 0.25;
			if ( new_trace_opacity < 0.25 ) {
				new_trace_opacity = 0.25;
			}
			set_trace_opacity(new_trace_opacity);
			matched = 1;
		}

		// If this action is to place a character code, do that, move
		// the cursor on, and record that we've made a match.
		if ( placed_code > -1 ) {
			check_for_remove_code(curx, cury, 1);
			place_code(curx, cury, placed_code, 1);
			advance_cursor();
			matched = 1;
		}

		// If we didn't make a match, we need to interpret this as a regular
		// keypress, dropping out of escape mode.
		if ( matched == 0 ) {
			escape = 0;
			disappear_cursor_rectangle();
		}
	}

	if ( escape == 0 ) { // if we're not in escape mode...
		invalidate_export();
		if ( tg[cury][curx] == 0 ) {
			if ( code >= 32 && code <= 127 ) { // and this is a simple text character...

				// Just overwrite it, and rerender
				check_for_remove_code(curx, cury, 1);
				cc[cury][curx] = code;

				// The cursor move handles the rendering of this insertion, so
				// we only need update the cell below if we're in double height.
				if ( nd[cury][curx] > 0 && fs[cury] == 1 && cury < 24 ) {
					render(curx, cury+1, 1, 1); }

				// Move the cursor right (and render that)
				advance_cursor();
			}
		} else { // If we're in graphics mode...

			if (  // and the character here is a graphics (mosaic) character
				( cc[cury][curx] >= 32 && cc[cury][curx] < 64 )
			||	( cc[cury][curx] >= 96 && cc[cury][curx] < 128 )
				) {

				// Keep track of whether anything changed, in case we don't
				// actually need to render this change (another key was pressed,
				// for example)
				var occ = cc[cury][curx];

				// QWASZX do subpixel twiddling.
				if ( code == 113 || code == 55 ) { cc[cury][curx] ^= 1; }   // [q] or [7]
				if ( code == 119 || code == 56 ) { cc[cury][curx] ^= 2; }   // [w] or [8]
				if ( code == 97 || code == 52 )  { cc[cury][curx] ^= 4; }   // [a] or [4]
				if ( code == 115 || code == 53 ) { cc[cury][curx] ^= 8; }   // [s] or [5]
				if ( code == 122 || code == 49 ) { cc[cury][curx] ^= 16; }  // [z] or [1]
				if ( code == 120 || code == 50 ) { cc[cury][curx] ^= 64; }  // [x] or [2]

				// Some operations on the whole cell - all six subpixels.
				if ( code == 99 || code == 57 )  { cc[cury][curx] &= 32; }  // [c]lear or [9]
				if ( code == 102 || code == 54 ) { cc[cury][curx] |= 95; }  // [f]ill or [6]
				if ( code == 114 || code == 51 ) { cc[cury][curx] ^= 95; }  // [r]everse or [3]

				// If anything changed, update the canvas.
				if ( occ != cc ) {
					autorender(curx, cury, 1, 1);

					// Something else might depend on this via the held
					// graphics mechanism.
					gfx_change(curx, cury, curx, cury);
				}
			}

			// We can also type letters in graphics mode, sometimes called
			// break-through letters. The key that was pressed might be
			// possible to interpret as a break-through letter.
			if ( code == 32 || ( code >= 64 && code <= 95 ) ) {

				// Insert the letter, checking whether we removed anything.
				check_for_remove_code(curx, cury, 1);
				cc[cury][curx] = code;
				autorender(curx, cury, 1, 1);

				// Update held graphics if needed
				gfx_change(curx, cury, curx, cury);

				// Move the cursor right.
				advance_cursor();
			}
		}
	}

	// Finally, turn off escape and redraw the status bar to reflect that.
	if ( retain_rectangle == 0 ) { escape = 0; }
	if ( old_esc != escape ) {
		draw_status_bar();
		if ( escape == 0 && retain_rectangle == 0 ) {
			disappear_cursor_rectangle();
		}
	}
}


var put_char = function(c, r, code) {
	check_for_remove_code(c, r, 0);
	if ( placeable(code) == 1 ) {
		place_code(c, r, code, 0);
	} else {
		cc[r][c] = code;
	}
}

//////////////////
///// CURSOR /////
//////////////////

// The following functions handle movements of the cursor. There's
// a theme to most of these. By moving the cursor we have to update two
// cells - the cell the cursor was moved from and the one it was moved
// to. In most situations the cells will be together, but if we're splitting
// over a line (or from the bottom to top of the screen), we need to treat
// them separately. If split == 1, it's necessary to call the render
// function twice.

var advance_cursor = function() {
	// We might be in Hebrew mode. If so, advancing means to go
	// left. Otherwise, it means to go right.
	if ( cset == 6 ) { cursor_left_for_hebrew(); return; }
	cursor_right();
}

var cursor_right = function() {
	if ( ( curx_opposite != -1 && cury_opposite != -1 ) && curx == 39 ) { return; }
	// The first cell that needs to be re-rendered is the original one.
	var old_curx = curx; var old_cury = cury;

	if ( curx_opposite == -1 || cury_opposite == -1 ) {
		// Is this a 'split render'?
		var split = 1;

		// Move the cursor and wrap it if needed.
		curx++;
		if ( curx > 39 ) { cury++; curx = 0; } else { split = 0; }
		if ( cury > 24 ) { cury = 0; }

		// Render, depending on whether it's a split or not.
		if ( split == 0 ) { render(curx-1, cury, 2, 1, 1); }
		if ( split == 1 ) {
			render(old_curx, old_cury, 1, 1);
			render(curx, cury, 1, 1);
		}
	}

	// The above is probably not needed when we render the
	// following.
	if ( curx_opposite != -1 && cury_opposite != -1 ) {
		curx++;
		var x_to_render = old_curx;
		if ( curx > curx_opposite ) { x_to_render = curx; }
		render(curx-1, cury, 2, 1, 1);
		render(x_to_render, Math.min(cury, cury_opposite),
			1, Math.abs(cury - cury_opposite) + 1);
	}
}

// If we're using the editor in Hebrew mode, we need to move the cursor
// left.
var cursor_left_for_hebrew = function() {
	if ( ( curx_opposite != -1 && cury_opposite != -1 ) && curx == 0 ) { return; }
	var old_curx = curx; var old_cury = cury;

	if ( curx_opposite == -1 || cury_opposite == -1 ) {
		var split = 1;
		curx--;
		if ( curx < 0 ) { cury++; curx = 39; } else { split = 0; }
		if ( cury > 24 ) { cury = 0; }
		if ( split == 0 ) { render(curx, cury, 2, 1, 1); }
		if ( split == 1 ) {
			render(old_curx, old_cury, 1, 1);
			render(curx, cury, 1, 1);
		}
	}

	// The above is probably not needed when we render the
	// following.
	if ( curx_opposite != -1 && cury_opposite != -1 ) {
		curx--;
		var x_to_render = old_curx;
		if ( curx < curx_opposite ) { x_to_render = curx; }
		render(curx, cury, 2, 1, 1);
		render(x_to_render, Math.min(cury, cury_opposite),
		1, Math.abs(cury - cury_opposite) + 1);
	}
}

// The other functions work in a similar way.
var cursor_left = function() {
	if ( ( curx_opposite != -1 && cury_opposite != -1 ) && curx == 0 ) { return; }
	var old_curx = curx; var old_cury = cury;

	if ( curx_opposite == -1 || cury_opposite == -1 ) {
		var split = 1; // is it necessary to call render() twice?
		curx--;
		if ( curx < 0 ) { cury--; curx = 39; } else { split = 0; }
		if ( cury < 0 ) { cury = 24; }
		if ( split == 0 ) { render(curx, cury, 2, 1, 1); }
		if ( split == 1 ) {
			render(old_curx, old_cury, 1, 1);
			render(curx, cury, 1, 1);
		}
	}

	// The above is probably not needed when we render the
	// following.
	if ( curx_opposite != -1 && cury_opposite != -1 ) {
		curx--;
		var x_to_render = old_curx;
		if ( curx < curx_opposite ) { x_to_render = curx; }
		render(curx, cury, 2, 1, 1);
		render(x_to_render, Math.min(cury, cury_opposite),
			1, Math.abs(cury - cury_opposite) + 1);
	}
}

var cursor_up = function() {
	if ( ( curx_opposite != -1 && cury_opposite != -1 ) && cury == 0 ) { return; }
	var old_curx = curx; var old_cury = cury;

	if ( curx_opposite == -1 || cury_opposite == -1 ) {
		var split = 1; // is it necessary to call render() twice?
		cury--;
		if ( cury < 0 ) { cury = 24; } else { split = 0; }
		if ( split == 0 ) { render(curx, cury, 1, 2, 1); }
		if ( split == 1 ) {
			render(old_curx, old_cury, 1, 1);
			render(curx, cury, 1, 1);
		}
	}

	// The above is probably not needed when we render the
	// following.
	if ( curx_opposite != -1 && cury_opposite != -1 ) {
		cury--;
		var y_to_render = old_cury;
		if ( cury < cury_opposite ) { y_to_render = cury; }
		render(curx, cury, 1, 2, 1);
		render(Math.min(curx, curx_opposite), y_to_render,
			Math.abs(curx - curx_opposite) + 1, 1);
	}
}

var cursor_down = function() {
	if ( ( curx_opposite != -1 && cury_opposite != -1 ) && cury == 24 ) { return; }
	var old_curx = curx; var old_cury = cury;

	if ( curx_opposite == -1 || cury_opposite == -1 ) {
		var split = 1; // is it necessary to call render() twice?
		cury++;
		if ( cury > 24 ) { cury = 0; } else { split = 0; }
		if ( split == 0 ) { render(curx, cury-1, 1, 2, 1); }
		if ( split == 1 ) {
			render(old_curx, old_cury, 1, 1);
			render(curx, cury, 1, 1);
		}
	}

	// The above is probably not needed when we render the
	// following.
	if ( curx_opposite != -1 && cury_opposite != -1 ) {
		cury++;
		var y_to_render = old_cury;
		if ( cury > cury_opposite ) { y_to_render = cury; }
		render(curx, cury-1, 1, 2, 1);
		render(Math.min(curx, curx_opposite), y_to_render,
			Math.abs(curx - curx_opposite) + 1, 1);
	}
}

// Newlines are considered to be just another kind of cursor
// movement, but
var cursor_nl = function() {
	var old_curx = curx;
	var old_cury = cury;
	cury++; curx = 0;
	if ( cury > 24 ) { cury = 0; }
	render(old_curx, old_cury, 1, 1);
	render(curx, cury, 1, 1);
}


// Tab inserts a new character.
var cursor_tab = function() {
	// Determine the attributes of the new cell by copying those of the
	// previous cell, apart from the actual character code, which should be
	// a space. The exception is where the previous cell is a set-after
	// control code, in which case, its individual effect (specific to
	// the code in question) needs to be copied.

	// Default settings:
	var newbg = 0; var newfg = 7; var newtg = 0;
	var newcs = 0; var newnd = 0; var newhg = 0;
	var newsc = 0; var newsf = 0;

	// Attributes from the previous cell:
	if ( curx > 0  ) {
		newfg = fg[cury][curx-1]; newbg = bg[cury][curx-1];
		newtg = tg[cury][curx-1]; newcs = cs[cury][curx-1];
		newnd = nd[cury][curx-1]; newhg = hg[cury][curx-1];
		newsc = sc[cury][curx-1]; newsf = sf[cury][curx-1];
	}

	var prev_char = 32;
	if ( curx > 0 ) { prev_char = cc[cury][curx-1]; }
	if ( ( prev_char >= 1 && prev_char <= 7 )
		|| ( blackfg != 0 && prev_char == 0 )
		|| ( prev_char >= 17 && prev_char <= 23 )
		|| ( blackfg != 0 && prev_char == 16 )  ) {
		newfg = fg[cury][curx];
		newtg = tg[cury][curx];
		newsc = sc[cury][curx];
	}
	if ( prev_char == 8 ) { // flash
		newsf = sf[cury][curx];
	}
	if ( prev_char == 13 ) { // double
		newnd = nd[cury][curx];
	}
	if ( prev_char == 31 ) { // release
		newhg = hg[cury][curx];
	}

	// We shift everything from where we are forward one cell,
	// starting from the end.
	for ( var c = 39; c > curx; c-- ) {
		copy_char(c-1, cury, c, cury);
	}

	fg[cury][curx] = newfg; bg[cury][curx] = newbg;
	tg[cury][curx] = newtg; cs[cury][curx] = newcs;
	nd[cury][curx] = newnd; cc[cury][curx] = 32;
	hg[cury][curx] = newhg; sc[cury][curx] = newsc;
	sf[cury][curx] = newsf;

	// We begin by assuming that this insertion causes the
	// cursor to go to the next line (a 'split').
	var split = 1;

	var old_curx = curx; var old_cury = cury;

	// Advance the cursor and render, as above, but this time, if
	// there was no split, we do the whole rest of the line, including
	// any double height effects, etc
	curx++;
	if ( curx > 39 ) { cury++; curx = 0; } else { split = 0; }
	if ( cury > 24 ) { cury = 0; }
	if ( split == 0 ) {
		autorender(old_curx, cury, 40-old_curx, 1);
	}
	if ( split == 1 ) {
		autorender(old_curx, old_cury, 1, 1);
		render(curx, cury, 1, 1);
	}

	// If this change was done in a section of the frame which has
	// graphics, it may affect held graphics later on.
	gfx_change(curx, cury, curx, cury);
}

// A bit like the opposite of tab, backspace deletes a character like
// in most other editors. The pattern is the same, but we need to ensure
// we're considering what we're deleting.
var cursor_bs = function() {
	var old_curx = curx;
	var old_cury = cury;
	var split = 1;
	curx--;
	if ( curx < 0 ) { cury--; curx = 39; } else { split = 0; }
	if ( cury < 0 ) { cury = 24; }

	// Are we deleting a control code? If so correct for this.
	check_for_remove_code(curx, cury, 0);

	// We either have to shift the row back one character and put
	// a space on the end, or, if the backspace action went over
	// the screen edge and wrapped, just render the two cursor
	// positions.
	if ( split == 0 ) {
		for ( var c = curx; c < 39; c++ ) {
			copy_char(c+1, cury, c, cury);
		}
		cc[cury][39] = 32;
		autorender(curx, cury, 40 - curx, 1, 0);
	}
	if ( split == 1 ) {
		render(old_curx, old_cury, 1, 1);
		render(curx, cury, 1, 1);
	}

	// If this is in a graphics bit, it may affect held graphics
	// later on. (e.g. bs over graphics part)
	gfx_change(curx,cury,curx,cury);

}

// Rendering the 'cursor rectangle', used for cut and paste, is assisted
// by the following functions.
var disappear_cursor_rectangle = function() {
	if ( curx_opposite != -1 && cury_opposite != -1 ) {
		// We need to remove the rectangle by re-rendering
		// its area.
		var x1 = curx_opposite;
		var y1 = cury_opposite;
		curx_opposite = -1;
		cury_opposite = -1;
		var x2 = curx;
		var y2 = cury;
		if ( x1 > x2 ) { var t = x1; x1 = x2; x2 = t; }
		if ( y1 > y2 ) { var t = y1; y1 = y2; y2 = t; }
		render(x1, y1, x2 - x1 + 1, y2 - y1 + 1);
		
		highlight_hints();
	}
}


//////////////////////
///// PLACE CODE /////
//////////////////////

// Some characters are control codes which have an effect on
// the attributes of the characters following it in the line
// (and sometimes, if the code is 'set-at', on the character
// itself). These characters have to be set with a call to
// place_code(), which sets the character, handles its effects,
// and if specified, re-renders the affected characters. These
// characters are called 'placeable codes'.

// It's worth briefly discussing set-at and set-after codes,
// which, along with held graphics, lead to confusion for those
// intrepid enough to implement teletext viewers and editors.
// 'Set-at' simply means that the attribute in question is
// changed on cell occupied by the control character itself,
// and 'set-after' means that it changes on the next character.
// These need to be taken account of in all kinds of situations.

// place_code() works in conjunction with check_for_remove_code().
// Whenever a control character is put somewhere, place_code() needs
// to be called, but if it's removed, the lack of it changes the
// attribute settings later in the line. Therefore, if you're
// changing a character, you need to first call
// check_for_remove_code() and then place_code().

// placeable() defines placeable codes, and is
// called to test whether a code is handled by
// place_code().
var placeable = function(code) {
	if (   ( code >= 0  && code <= 7 )
		|| ( code == 8 || code == 9 )
		|| ( code == 12 || code == 13 )
		|| ( code >= 16 && code <= 23 )
		|| ( code == 24 )
		|| ( code == 25 || code == 26 )
		|| ( code == 28 || code == 29 )
		|| ( code == 30 || code == 31 ) ) {
		return 1;
	}
	return 0;
}

// Before we consider place_code() itself, the handling of double
// height brings a problem. The removal of a code might mean that
// the value of fs (first or second row) differs, for example because
// the first first row on the screen is no longer double height.

// When this function is called, a double height code has been placed
// at column x on row y, and we need to determine its effect on the
// fs array. Call this after the character has been placed to update
// fs and re-render the affected cells. If andrender is non-zero,
// the affected cells are re-rendered. This code is also used for
// removal, so the final argument is 0 where the code has been placed,
// and 1 where it has been removed.
var adjustdh = function(x,y,andrender,removal) {

	// We start by considering the state of the row above.
	var above = 0;
	if ( y > 0 ) { above = fs[y-1]; }

	// Scanning down each row in the screen in order
	for ( var r = y; r < 25; r++ ) {

		// The original value of the fs array:
		var fs_from = fs[r];

		// Does this row contain a double-height character (13)?
		var dhfound = 0;
		for ( var c = 0; c < 40; c++ ) {
			var ecc = cc[r][c];
			if ( removal == 1 && x == c && y == r ) { ecc = 32; }
			if ( ecc == 13 ) { dhfound = 1; }
		}

		// We determine the new value of this row, fs_to,
		var fs_to = 0;
		if ( above == 0 && dhfound == 0 ) { fs_to = 0; }
		if ( above == 1 && dhfound == 0 ) { fs_to = 2; }
		if ( above == 2 && dhfound == 0 ) { fs_to = 0; }
		if ( above == 0 && dhfound == 1 ) { fs_to = 1; }
		if ( above == 1 && dhfound == 1 ) { fs_to = 2; }
		if ( above == 2 && dhfound == 1 ) { fs_to = 1; }

		// And re-assign for the next row.
		above = fs_to;
		fs[r] = fs_to;

		// Now render the line.
		if ( andrender == 1 ) {
			render(0, r, 40, 1, 0);
		}

		// We can stop after this point if we wouldn't make a
		// difference to the rest of the screen.
		if ( ( fs_from != 1 ) && ( fs_to != 1 ) ) {
			break;
		}
	}
}

// We may also need to adjust the double heigh of the whole screen,
// so this function is provided for convenience. It works a lot
// like the one above.
var adjustdh_fullscreen = function(andrender) {
	var above = 0;
	for ( var r = 0; r < 25; r++ ) {
		var fs_from = fs[r];
		var dhfound = 0;
		for ( var c = 0; c < 40; c++ ) {
			var ecc = cc[r][c];
			if ( ecc == 13 ) { dhfound = 1; }
		}
		var fs_to = 0;
		if ( above == 0 && dhfound == 0 ) { fs_to = 0; }
		if ( above == 1 && dhfound == 0 ) { fs_to = 2; }
		if ( above == 2 && dhfound == 0 ) { fs_to = 0; }
		if ( above == 0 && dhfound == 1 ) { fs_to = 1; }
		if ( above == 1 && dhfound == 1 ) { fs_to = 2; }
		if ( above == 2 && dhfound == 1 ) { fs_to = 1; }
		above = fs_to;
		fs[r] = fs_to;
		if ( andrender == 1 ) {
			render(0, r, 40, 1, 0);
		}
	}
}

// place_code() is called when the supplied code is to be set at
// position (x,y). If andrender is non-zero, it also renders the
// character.
var place_code = function(x,y,code,andrender) {

	// Quickly invalidate any export we have going
	invalidate_export();

	// Firstly, text and graphic colour codes. These change the
	// foreground colour and text/graphics mode.
	if ( ( code >= 0 && code <= 7 )
		|| ( code >= 16 && code <= 23 ) ) {

		cc[y][x] = code;

		// Is black foregrounding allowed? If not, we only
		// place the character, rather than letting it take any
		// effect.
		if ( blackfg == 0 && code == 0 ) { return; }
		if ( blackfg == 0 && code == 16 ) { return; }

		// Determine the colour we're changing to.
		var col = code;
		var gfx = 0;
		if ( col > 7 ) { col -= 16; gfx = 1; }

		// Colour changes are a pain, because their effect is
		// much more than the next foreground colour. They also
		// affect background colour, text/graphics attributes,
		// concealed text, and held graphics knock-on effects.
		// This part of place_code() is therefore a bit more
		// complicated.

		// In all of these cases, limit refers to the first
		// character which is no longer affected by the changes.
		var limit = 40;

		// This is used to update held graphics dependencies
		// later on in the frame. We keep track of the span of
		// graphics character we find so we can pass it to the
		// function handling changes in held graphics.
		var earliest_gfx = -1;
		var latest_gfx = -1;

		// The following are the values of the attributes if
		// they've been affected by the control code. Where they
		// are no longer affected, they have the value -1.
		var fg_affected = col; // we've just changed it.
		var bg_affected = -1;  // not unless we detect it.
		var tg_affected = gfx; // this is always set.
		var sc_affected = -1;  // concealed text

		if ( sc[y][x] == 1 ) {
			// If we're concealing, this got cancelled by this
			// colour code. Note that conceal is set-at.
			sc[y][x] = 0;
			sc_affected = 0;
			}

		// Let's scan the rest of the row for effects. Colour codes
		// are set-after, so we start with the next character.
		for ( var c = x + 1; c < 40; c++ ) {
			var codehere = cc[y][c];

			// First, set-at code tests appear. This is because later
			// we'll break out of this loop if the current character is
			// not affected any more, so we need to consider set-at
			// effects before that.

			if ( codehere == 28 ) { // black background
				bg_affected = -1;
			}
			if ( codehere == 29 ) { // new background
				bg_affected = fg_affected;
			}

			// Another colour code or a conceal character will mean
			// we're no longer affecting the concealing of text.
			if ( ( codehere >= 1 && codehere <= 7 )
				|| ( codehere >= 16 && codehere <= 23)
				|| ( codehere == 24 )
				|| ( blackfg != 0 && codehere == 0 )
				|| ( blackfg != 0 && codehere == 16 ) ) {
				sc_affected = -1;
				}

			// If there is still a change in effect for any of the kinds
			// of attributes, then set it.
			if ( fg_affected > -1 ) { fg[y][c] = fg_affected; }
			if ( bg_affected > -1 ) { bg[y][c] = bg_affected; }
			if ( tg_affected > -1 ) { tg[y][c] = tg_affected; }
			if ( sc_affected > -1 ) { sc[y][c] = sc_affected; }

			// Update the span (earliest_gfx .. latet_gfx)
			if ( tg_affected > -1 && earliest_gfx == -1 ) { earliest_gfx = c; }
			if ( tg_affected > -1 && latest_gfx < c ) { latest_gfx = c; }

			// Test whether we are now free of the effects of the change. If so,
			// break out and set the limit here.
			if ( fg_affected == -1
				&& bg_affected == -1
				&& tg_affected == -1
				&& sc_affected == -1 ) {
				limit = c; break;
			}

			// Now, we do set-after tests. These will then be picked up on the
			// next iteration of this loop.

			// Did another text or graphics code take over?
			if ( ( codehere >= 1 && codehere <= 7)
			|| ( codehere >= 17 && codehere <= 23)
			|| ( blackfg != 0 && codehere == 0 )
			|| ( blackfg != 0 && codehere == 16 ) ) {
				fg_affected = -1;
				tg_affected = -1;
			}
		}

		// Render if required.
		if ( andrender != 0 ) {
			autorender(x, y, limit-x, 1);
		}

		// and, if applicable, all cells with changes to how their held graphics
		// appear.
		if ( earliest_gfx > -1 && latest_gfx > -1 ) {
			gfx_change(earliest_gfx, y, latest_gfx, y);
		}

	}

	// The rest of the code is pretty similar to the above pattern, so I won't
	// repeat it each time. The general plan is to scan along the rest of the
	// row for the 'limit' - the point where the effect of the attribute change
	// is guaranteed not to reach. Then we update to the limit and re-render
	// if required.

	// Black and new background. Both of these are set-at.
	if ( code == 28 || code == 29 ) {
		cc[y][x] = code;

		var limit = 40;
		for ( var c = x + 1; c < 40; c++ ) {
			if ( cc[y][c] == 28 || cc[y][c] == 29 ) {
				limit = c; break;
			}
		}

		// newbg is the new background colour.
		var newbg = fg[y][x];
		if ( code == 28 ) { newbg = 0; }
		for ( var c = x; c < limit; c++ ) { // set-at
			bg[y][c] = newbg;
		}

		if ( andrender != 0 ) {
			autorender(x, y, limit-x, 1);
		}
	}

	// Separated and contiguous graphics, both of which are set-at.
	if ( code == 25 || code == 26 ) {
		cc[y][x] = code;
		var newsep = code - 25;

		var limit = 40;
		for ( var c = x + 1; c < 40; c++ ) {
			if ( cc[y][c] == 25 || cc[y][c] == 26 ) {
				limit = c; break;
			}
		}

		for ( var c = x; c < limit; c++ ) { // set-at
			cs[y][c] = newsep;
		}

		if ( andrender != 0 ) {
			autorender(x, y, limit-x, 1);
		}
	}

	// Normal and double height. Recall that double height can have three
	// values. 0 means normal height, 1 means double height, and 2 means the
	// height has been reset to normal height again.
	if ( code == 12 || code == 13 ) {

		cc[y][x] = code;

		// determine the new value of nd
		var newheight = 0;
		if ( code == 13 ) { newheight = 1; }
		if ( code == 12 ) {
			if ( x > 0 && nd[y][x-1] == 1 ) { newheight = 2; }
		}

		var limit = 40;
		for ( var c = x + 1; c < 40; c++ ) {
			if ( cc[y][c] == 12 && nd[y][c] == 2 ) {
				limit = c; break;
			}
			if ( cc[y][c] == 13 ) {
				// Set-after means we need to set the
				// nd attribute for one more cell.
				limit = c+1; break;
			}
		}

		// Normal height is set-at, while double height is set-after. That means
		// we have to choose where we start scanning from.
		var startfrom = x;
		if ( newheight == 1 ) { startfrom = x + 1; }

		for ( var c = startfrom; c < limit; c++ ) {

			// We must remember to keep propogating the value of 2 to regions which
			// have switched back but aren't yet marked as 2.
			if ( cc[y][c] == 12 ) { newheight = 2; }
			nd[y][c] = newheight;
		}

		// We've changed the double height, so we need to re-adjust for the
		// remaining rows.
		adjustdh(x, y, 1, 0);

		if ( andrender != 0 ) {
			autorender(x, y, limit-x, 1);
		}
	}

	// Hold and release graphics. Again, the situation is complicated by the
	// fact that release is set-after and hold is set-at. This changes the
	// point at which we determine the limit and where we begin the updated of
	// affected characters.
	if ( code == 30 || code == 31 ) {
		cc[y][x] = code;

		// New value of hg
		var newhg = 1;
		if ( code == 31 ) { newhg = 0; }

		var limit = 40;
		for ( var c = x + 1; c < 40; c++ ) {
			if ( cc[y][c] == 30 ) { // hold is set-at
				limit = c; break;
			}
			if ( cc[y][c] == 31 ) { // release is set-after
				limit = c+1; break;
			}
		}

		if ( newhg == 0 ) { // released
			for ( var c = x + 1; c < limit; c++ ) {
				hg[y][c] = newhg;
			}
		}
		if ( newhg == 1 ) { // held
			for ( var c = x; c < limit; c++ ) {
				hg[y][c] = newhg;
			}
		}

		if ( andrender != 0 ) {
			autorender(x, y, limit-x, 1);
		}
	}

	// Conceal is set-at - previous versions has it as set-after,
	// but ETS 300 706 is clear on the matter.
	if ( code == 24 ) {
		cc[y][x] = code;

		var limit = 40;
		for ( var c = x + 1; c < 40; c++ ) {

			// Conceal is cancelled by a text or mosaic colour
			// code.
			if ( ( cc[y][c] > 0 && cc[y][c] < 8 )
			|| ( cc[y][c] > 16 && cc[y][c] < 24 )
			|| ( blackfg != 0 && cc[y][c] == 0 )
			|| ( blackfg != 0 && cc[y][c] == 16 ) ) {
				limit = c; break;
			}
			// If another conceal character is encountered, then
			// it has 'taken over' and we can stop. Conceal is
			// set-at so we set the limit at this point
			if  ( cc[y][c] == 24 ) {
				limit = c; break;
			}
		}

		// Update started from the next character...
		for ( var c = x; c < limit; c++ ) {
			sc[y][c] = 1;
		}

		if ( andrender != 0 ) {
			autorender(x, y, limit-x, 1);
		}
	}

	// Finally, we consider flashing characters. Flash is set-after and
	// steady, which resets it, is set-at. Flashing characters are
	// independent of anything else (nothing else sets or unsets this
	// attribute)
	if ( code == 8 || code == 9 ) {
		cc[y][x] = code;

		var newsf = 0;
		if ( code == 8 ) { newsf = 1; }

		var limit = 40;
		for ( var c = x + 1; c < 40; c++ ) {
			if ( cc[y][c] == 8 ) { limit = c+1; break; } // flash is set-after
			if ( cc[y][c] == 9 ) { limit = c; break; } // steady is set-at
		}

		if ( code == 8 ) {
			for ( var c = x+1; c < limit; c++ ) { // flash is set-after
				sf[y][c] = newsf;
			}
		}
		if ( code == 9 ) {
			for ( var c = x; c < limit; c++ ) {  // steady is set-at
				sf[y][c] = newsf;
			}
		}

		if ( andrender != 0 ) {
			autorender(x, y, limit-x, 1);
		}
	}
}


///////////////////////
///// REMOVE CODE /////
///////////////////////

// Just like we have to call place_code() to determine the effects
// of a control character we place, we also need to call
// check_for_remove_code() to process the effects of a control
// character we remove, for example text no longer be marked in
// a particular colour. We call this before we delete anything.

// We check here whether the character has changed the state of the
// attributes for each character following it, and updates the
// state, hopefully efficiently. As soon as we get to a control
// code which somehow takes the effect of the removal away, we can
// stop. place_code() and check_for_remove_code() work together.

// Much of the code here relates closely to its counterpart in
// place_code(), and the general process is similar. Firstly, we
// consider what the new value of the atttribute will be, then
// determine its limit, then update, and finally render.

// Handles removal of a character code at (x,y), and, if andrender
// is non-zero, renders the characters it affects.

var check_for_remove_code = function(x, y, andrender) {

	var code = cc[y][x];

	// The first case is that we're deleting a colour code.
	if ( ( code >= 1 && code <= 7 )
		|| ( code >= 17 && code <= 23 )
		|| ( blackfg != 0 && code == 0 )
		|| ( blackfg != 0 && code == 16 ) ) {

		// The character in (x,y) will inherit the attributes
		// of the character before it. However, foreground
		// colour and text/graphics control codes are set-after,
		// so we read the character (x,y).
		var lastcode = fg[y][x];
		var gfx = tg[y][x];

		// We also consider concealed text, which is set-at and
		// therefore requires that we check the character before.
		var lastsc = 0;
		var sc_affected = -1;
		if ( x > 0 ) {
			lastsc = sc[y][x-1];
		}

		// This set-at attribute needs to be cancelled
		// now before we consider the later characters.
		sc[y][x] = lastsc;
		if ( lastsc == 1 ) {
			sc_affected = 0;
		}

		// And we compute the limit in a similiar way to the way
		// it's done in place_code(), so have a look there for
		// more detailed comments.
		var limit = 40;
		var fg_affected = lastcode; // we've just changed it.
		var bg_affected = -1;       // not unless we detect it.
		var tg_affected = gfx;      // this is always set.

		var earliest_gfx = -1;
		var latest_gfx = -1;

		for ( var c = x + 1; c < 40; c++ ) {
			var codehere = cc[y][c];

			// Firstly, set-at attributes:
			if ( codehere == 28 ) { // Black background
				bg_affected = -1;
			}
			if ( codehere == 29 ) { // New background
				bg_affected = fg_affected;
			}

			if ( ( codehere >= 1 && codehere <= 7 )
				|| ( codehere >= 17 && codehere <= 23)
				|| ( blackfg != 0 && codehere == 0 )
				|| ( blackfg != 0 && codehere == 16 )
				|| ( codehere == 24 ) ) {
				sc_affected = -1;
				}

			if ( fg_affected == -1 && bg_affected == -1 &&
				tg_affected == -1 && sc_affected == -1 ) {
				limit = c; break;
				// We are now free of the effects of the change.
			}

			if ( fg_affected > -1 ) { fg[y][c] = fg_affected; }
			if ( bg_affected > -1 ) { bg[y][c] = bg_affected; }
			if ( tg_affected > -1 ) { tg[y][c] = tg_affected; }
			if ( sc_affected > -1 ) { sc[y][c] = sc_affected; }

			if ( tg_affected > -1 && earliest_gfx == -1 ) { earliest_gfx = c; }
			if ( tg_affected > -1 && latest_gfx < c ) { latest_gfx = c; }

			// Now, set-after attributes
			if ( ( codehere >= 1 && codehere <= 7 ) || ( codehere >= 17 && codehere <= 23 )
				|| ( blackfg != 0 && codehere == 0 ) || ( blackfg != 0 && codehere == 16 ) ) {
				fg_affected = -1; // another code took over
				tg_affected = -1;
			}
		}

		if ( andrender != 0 ) {
			autorender(x, y, limit-x, 1);
		}
		if ( earliest_gfx > -1 && latest_gfx > -1 ) {
			gfx_change(earliest_gfx, y, latest_gfx, y);
		}

	}

	// Next we consider changes in background colour, both
	// of which are set-at. For example, if a 'new background'
	// control code is delete, set of background attributes
	// need to be changed.
	if ( code == 28 || code == 29 ) {
		var limit = 40;
		for ( var c = x + 1; c < 40; c++ ) {
			if ( cc[y][c] == 28 || cc[y][c] == 29 ) {
				limit = c; break;
			}
		}
		var newbg = 0;
		if ( x > 0 ) { newbg = bg[y][x-1]; } // Set-at
		for ( var c = x; c < limit; c++ ) { // Set-at
			bg[y][c] = newbg;
		}
		if ( andrender != 0 ) {
			autorender(x, y, limit-x, 1);
		}

	}

	// Separated and contiguous graphics, both of which are set-at.
	if ( code == 25 || code == 26 ) {
		var newsep = 0;
		if ( x > 0 ) {
			newsep = cs[y][x-1]; // Set-at
		}
		var limit = 40;
		for ( var c = x + 1; c < 40; c++ ) {
			if ( cc[y][c] == 25 || cc[y][c] == 26 ) {
				limit = c; break;
			}
		}
		for ( var c = x; c < limit; c++ ) { // Set-at
			cs[y][c] = newsep;
		}

		if ( andrender != 0 ) {
			autorender(x, y, limit-x, 1);
		}
	}

	// Double and normal height. Normal is set-at and double is
	// set-after, so things are a little more complicated.
	if ( code == 12 || code == 13 ) {

		var newheight = 0;

		if ( code == 12 && x > 0 ) {
			newheight = nd[y][x-1]; // normal height is 'set-at'
		}
		if ( code == 13 ) {
			newheight = nd[y][x];   // double height is 'set-after'
		}
		var limit = 40;
		var char_at_limit = -1;
		for ( var c = x + 1; c < 40; c++ ) {
			if ( cc[y][c] == 12 && newheight == 2 ) {
				// Here we are changing from double height to
				// normal text.
				limit = c; break; // set-at
			}
			if ( cc[y][c] == 13 ) {
				limit = c+1; break; // set-after
			}
		}
		if ( code == 12 ) {
			// Set-at, so we start at this character.
			for ( var c = x; c < limit; c++ ) {
				nd[y][c] = newheight;
			}
		}
		if ( code == 13 ) {
			// Set-after, so we start at the next character.
			for ( var c = x + 1; c < limit; c++ ) {
				if ( cc[y][c] == 12 ) { newheight = 2; }
				nd[y][c] = newheight;
			}
		}

		// We've noticed a change in the double height structure of
		// the page, so we adjust that, if needed.
		adjustdh(x, y, 1, 1);

		// And render if neccessary.
		if ( andrender != 0 ) {
			autorender(x, y, limit-x, 1);
		}
	}

	// The process for held and released graphics is pretty much the
	// same. Like in the case above, one code is set-at (hold graphics)
	// and one code is set-after (release graphics)
	if ( code == 30 || code == 31 ) {
		var newhg = 0;
		if ( code == 30 && x > 0 ) { // Set-at
			newhg = hg[y][x-1];
		}
		if ( code == 31 ) { // Set-after
			newhg = hg[y][x];
		}
		var limit = 40;
		var char_at_limit = -1;
		for ( var c = x + 1; c < 40; c++ ) {
			if ( cc[y][c] == 30 ) { // Set-at
				limit = c; char_at_limit = 30; break;
			}
			if ( cc[y][c] == 31 ) { // Set-after
				limit = c+1; char_at_limit = 31; break;
			}
		}
		if ( code == 30 ) { // Set-at
			for ( var c = x; c < limit; c++ ) {
				hg[y][c] = newhg;
			}
		}
		if ( code == 31 ) { // Set-after
			for ( var c = x+1; c < limit; c++ ) {
				hg[y][c] = newhg;
			}
		}
		if ( andrender != 0 ) {
			autorender(x, y, limit-x, 1);
		}
	}

	// Concealed text is set-at and is cancelled by a change of
	// text or graphics colour.
	if ( code == 24 ) {
		var newsc = 0;
		if ( x > 0 ) {
			newsc = sc[y][x-1];
		}
		var limit = 40;
		for ( var c = x + 1; c < 40; c++ ) {
			if ( ( cc[y][c] > 0 && cc[y][c] < 8 )
			|| ( cc[y][c] > 16 && cc[y][c] < 24 )
			|| ( blackfg != 0 && cc[y][c] == 0 )
			|| ( blackfg != 0 && cc[y][c] == 16 ) ) {
				// text or graphics character has been found.
				limit = c; break;
			}
			if  ( cc[y][c] == 24 ) {
				// Another conceal character has taken over. It's
				// set-after.
				limit = c; break;
			}
		}
		for ( var c = x; c < limit; c++ ) {
			sc[y][c] = newsc;
		}
		if ( andrender != 0 ) {
			autorender(x, y, limit-x, 1);
		}
	}

	// Flash and steady. Flash is set-after and steady is set-at.
	if ( code == 8 || code == 9 ) {
		var newsf = 0;
		if ( code == 8 ) { // Set-after
			newsf = sf[y][x];
		}
		if ( code == 9 && x > 0 ) { // Set-at
			newsf = sf[y][x-1];
		}
		var limit = 40;
		for ( var c = x + 1; c < 40; c++ ) {
			if ( cc[y][c] == 8 ) { limit = c+1; break; } // Set-after
			if ( cc[y][c] == 9 ) { limit = c; break; } // Set-at
		}
		if ( code == 8 ) { // Set-after
			for ( var c = x+1; c < limit; c++ ) {
				sf[y][c] = newsf;
			}
		}
		if ( code == 9 ) { // Set-at
			for ( var c = x; c < limit; c++ ) {
				sf[y][c] = newsf;
			}
		}
		if ( andrender != 0 ) {
			autorender(x, y, limit-x, 1);
		}
	}
}


//////////////////
///// RENDER /////
//////////////////

// This section contains functions which deal with the actual drawing
// of the frame on the canvas. In general we don't update the frame
// each time it's changed - instead we just update that parts of the
// frame that are affected by the change. It was implemented this way
// because it was thought that the redraw options would be expensive.

// It's not always easy to tell this. For example, consider the case
// where there's a double height character later in the row. Now the
// change needs to be carried on to these cells - if they are in the
// second row, of course. We have two functions - render() which does
// the rendering itself, and autorender() which detects these cases
// and adapts the call to render(). Callers can therefore just call
// autorender() and the code will take care of rendering the cell and
// its dependent ones. This doesn't apply to held graphics dependencies
// which are handled by gfx_change.

// Renders the rectangle of cells with top-left corner at (x,y) with
// height h and width w, and its dependent cells.
var autorender = function(x,y,w,h) {

	// We keep track of whether we're also affecting the next line.
	// Value is 1 if we are, or 0 if not.
	var affectnext = 0;

	// The span of characters on the next line that we're changing.
	var nextfrom = -1;
	var nextto = 40;

	// Going row-by-row,
	for ( var r = y; r < y+h; r++ ) {

		// If affectnext is non-zero, that is, if the last line
		// affected this one, then render the span that it affected.
		// Otherwise send the row off for rendering as normal.
		if ( affectnext > 0 ) {
			var from = Math.min(x, nextfrom);
			var to = Math.max(x+w, nextto);
			render(from, r, to-from, 1);
		} else {
			render(x, r, w, 1);
		}

		// Reset the span.
		var affectnext = 0;
		var nextfrom = -1;
		var nextto = 40;

		// Maybe we're starting in a double-height cell. If we are
		// we know immediately that we should update the next row.
		if ( nd[r][x] > 0 ) {
			affectnext = 1;
			nextfrom = x;
		}

		// If not, check each position on the row to see whether
		// it affects the next row.
		for ( var c = x; c < x+w; c++ ) {
			if ( cc[r][c] == 12 && fs[r] == 1 && affectnext == 1 ) {
				nextto = c;
			}
			if ( cc[r][c] == 13 && fs[r] == 1 ) {
				affectnext = 1;
				if ( nextfrom == -1 ) { nextfrom = c; }

				// If we've encountered a double height
				// character after having limited nextto
				// by a normal height character, we need
				// to reset the limit of the next line
				// back to 40.
				nextto = 40;
			}
		}
	}

	// Putting this next line in renders the whole of the rest of the
	// row. Before, I wasn't sure whether to re-render the part of the
	// row where nd = 0 (ie, before any double-height code
	// came into play), but the teletext standard seems to
	// say you have to. I guess I left this in so I could put in
	// some compatibility with the BBC micro via a config item.
	nextfrom = x;

	// If we've got to the end of the box, and still need to render the
	// next row, it won't be handled unless we do it now.
	if ( affectnext > 0 && y+h < 25 ) {
		render(nextfrom, y+h, nextto-nextfrom, 1);
	}

}

///

// Renders a rectangle of character cells starting at (x,y) with width
// w and height h onto the canvas.

// Control codes in teletext can be "set-at" or "set-after", which affects
// rendering a bit. Check out the place and remove functions for more.
var render = function(x, y, w, h) {

	// Sometimes things go wrong, so we trim the box to the size of the
	// frame.
	if ( x < 0 ) { x = 0; }
	if ( x > 39 ) { x = 39; }
	if ( y < 0 ) { y = 0; }
	if ( y > 24 ) { y = 24; }
	if ( x + w > 40 ) { w = 40 - x; }
	if ( y + h > 40 ) { h = 25 - y; }

	// It's time to save the frame to the hash. This is inefficient -
	// we should do this only when there's been a change.
	save_to_hash();

	var c = document.getElementById(canvasid);
	var ctx = c.getContext("2d");

	// Clear the rectangle.
	cls(ctx,x,y,w,h);

	// Then, taking each cell,
	for ( var r = y; r < y+h; r++ ) {
		for ( var c = x; c < x+w; c++ ) {

			// Sometimes the effective character code or attributes change
			// as the result of control characters, etc. We deal with the
			// normal array names prefixed with 'e' for effective, as in
			// 'the effective foreground here'.
			var ecc = cc[r][c]; var efg = fg[r][c]; var ebg = bg[r][c];
			var etg = tg[r][c]; var ecs = cs[r][c]; var end = nd[r][c];
			var ehg = hg[r][c]; var esc = sc[r][c]; var esf = sf[r][c];
			var cop = 0;

			// If we're on the second row of double height, we copy
			// the value of all attributes from the row above.
			if ( r > 0 && nd[r-1][c] == 1 && fs[r] == 2 ) {
				ecc = cc[r-1][c]; efg = fg[r-1][c]; ebg = bg[r-1][c];
				etg = tg[r-1][c]; ecs = cs[r-1][c]; end = nd[r-1][c];
				ehg = hg[r-1][c]; esc = sc[r-1][c]; esf = sf[r-1][c];
				cop = 1;
			}
			// If this is normal height, on the second line of a double
			// height row, we just display spaces in the current background
			// colour.
			if ( r > 0 && ( nd[r-1][c] == 0 || nd[r-1][c] == 2 )
				&& fs[r] == 2 ) {
				ecc = 32;
				efg = 7; // Doesn't matter
				ebg = bg[r-1][c];
				etg = 0; // Doesn't matter
				ecs = 0; // Doesn't matter
				end = 0; // Doesn't matter
				ehg = 0; // Doesn't matter
				esc = 0; // Doesn't matter
				esf = 0; // Doesn't matter
				cop = 1;
			}

			// Is this the cell with a cursor in?
			var cursor_cell = 0;

			if ( statushidden == 0 ) { // No cursor when the status bar is hidden
				if ( curx_opposite == -1 || cury_opposite == -1 ) {
					// This is just a normal cursor.
					if ( r == cury && c == curx ) { cursor_cell = 1; }
					} else {
					// We are in cut and paste mode and the 'cursor' is
					// a rectangle. The 'opposite' could be lower or
					// higher, left or right.
					if (
						( ( r >= cury_opposite && r <= cury ) ||
						( r <= cury_opposite && r >= cury ) )
					&&	( ( c >= curx_opposite && c <= curx ) ||
						( c <= curx_opposite && c >= curx ) ) ) {
						cursor_cell = 1;
						}
					}
				if ( r == cury && c == curx) { cursor_cell = 2; }
				}

			// This affects the way that it's rendered. We pass the
			// cursor_cell value to the colour() function to implement
			// the highlight. Same goes for the colour of the grid.
			var cell_fg = colour(efg, cursor_cell);
			var cell_bg = colour(ebg, cursor_cell);
			var cell_grid = colour(9, cursor_cell);

			// Character codes are displayed as space, or code 32.
			var spacecc = 32;

			// If this is a control code...
			if ( ecc < 32 ) {
				if ( showcc == 0 ) {
					// We're not showing control characters, so this
					// appears as the space.

					// Concealed text with reveal off appears as text
					// spaces.
					if ( esc == 1 && reveal == 0 ) {
						ecc = spacecc; etg = 0;
					}

					// These unsupported character codes appear as spaces
					// too, but only if in text mode. In graphics mode, these
					// might be substituted by the held graphics character.
					if ( etg == 0 && ( ecc == 10 || ecc == 11 || ecc == 14
						|| ecc == 15 || ecc == 27 ) ) { ecc = spacecc; }

					// If held graphics is off, the code appears as a space.
					else if ( ehg == 0 ) { ecc = spacecc; }

					else {
						// If we got here, held graphics applies, this
						// isn't a control character that is ignored,
						// and this isn't concealed. We need to substitute
						// held graphics here. At the moment this involves
						// searching back for the most recent (in
						// left-to-right order). We search for a
						// cell (copyfromx, copyfromy) which satisfies this.
						var copyfromx = -1;
						var copyfromy = -1;

						// Keeps track of the position we're searching at.
						// We start one character back.
						var px = c; px--;
						var py = r;

						// If this is the second line of double height, we need
						// to start searching from the first line instead.
						// Note that a change in height stops the search, so
						// we don't need to revert to the original line later.
						if ( r > 0 && nd[r-1][c] == 1 && fs[r] == 2 ) { py--; }

						while ( px >= 0 ) {

							// Transitions reset the held graphics character
							// to a space:

							// A graphics control code switches from text to
							// graphics mode:
							if ( cc[py][px] > 16 && cc[py][px] <= 23
								&& tg[py][px] == 0 ) { break; }
							if ( blackfg != 0 && cc[py][px] == 16
								&& tg[py][px] == 0 ) { break; }

							// A text control character switches from graphics
							// to text mode:
							if ( cc[py][px] > 0 && cc[py][px] <= 7
								&& tg[py][px] == 1 ) { break; }
							if ( blackfg != 0 && cc[py][px] == 0
								&& tg[py][px] == 1 ) { break; }

							// A normal-height control character switches
							// from double height. Normal height is set-at.
							if ( px > 0 && cc[py][px] == 12
								&& nd[py][px-1] == 1 ) { break; }

							// A double-height control character switches
							// from normal height. Double height is set-after.
							if ( cc[py][px] == 13
								&& nd[py][px] == 0 ) { break; }

							// If this is a graphic character, it's the one
							// we substitute for held graphics.
							if ( ( tg[py][px] == 1 ) &&
								( ( cc[py][px] >= 32 && cc[py][px] < 64 )
							 || ( cc[py][px] >= 96 && cc[py][px] < 128 ) )
								) {
								copyfromx = px; copyfromy = py; break;
							}

							// If we haven't found it so far, step back a
							// character and try again.
							px--;
						}

						// If nothing was found, just use a space, otherwise
						// copy the character code, graphic mode and the
						// contiguous/separated attribute.
						if ( copyfromx == -1 || copyfromy == -1 ) {
							ecc = spacecc; }
						else {
							ecc = cc[copyfromy][copyfromx];
							ecs = cs[copyfromy][copyfromx];
							etg = tg[copyfromy][copyfromx];
						}

					}
				}
				else {
					// This is a character code. It'll be rendered in colours
					// 8, or 9 if it's been copied from the row above.
					cell_fg = colour(8+cop, cursor_cell);
					cell_bg = colour(0, cursor_cell);
				}

			} else {
				// This is not a control code. It's a regular character.

				// If this concealed text, and we're not in reveal mode,
				// we handle it depending on whether we're showing control
				// codes.
				if ( esc == 1 && reveal == 0 ) {

					if ( showcc == 0 ) {
						// If we're not just substitute a space.
						ecc = spacecc; etg = 0;
					} else {
						// If we're showing control codes, indicate the
						// concealed chars using control code colours.
						cell_fg = colour(8+cop, cursor_cell);
						cell_bg = colour(0, cursor_cell);
						ecc = spacecc; etg = 0; end = 0;
					}
				}
			}

			// In case we work with graphic characters, compute the bit
			// value corresponding to each subpixel.
			var b1 = ( ecc - 32 ) & 1;
			var b2 = ( ecc - 32 ) & 2;
			var b3 = ( ecc - 32 ) & 4;
			var b4 = ( ecc - 32 ) & 8;
			var b5 = ( ecc - 32 ) & 16;
			var b6 = ( ecc - 32 ) & 64;

			// Scanning down each line of the cell...
			for ( var sy = 0; sy < 20; sy++ ) {

				// For double height we might actually read from a different
				// line of the smoothed character, shifting to another part of
				// the letter.
				var esy = sy;

				// If we're in double height mode and this isn't a control
				// character, find the original line in the character that
				// we're reading from.
				if ( end == 1 && ecc > 32 ) {
					if ( fs[r] == 1 ) { // top half
						esy = Math.floor(sy/2);
					}
					if ( fs[r] == 2 ) { // bottom half
						esy = 10 + ( Math.floor(sy/2) );
					}
				}

				// Scanning across the character...
				for ( var sx = 0; sx < 12; sx++ ) {

					// If this is a graphics character...
					if ( etg == 1 &&
						( ( ecc >= 32 && ecc < 64 )
						|| ( ecc >= 96 && ecc < 128 ) ) ) {

						// Do we use background (0) or foreground (1)
						// colour for this pixel?
						var col = 0;

						// For each region we could be in, test the
						// bit value.
						if ( ( sx < 6 && esy < 6 && b1 > 0 )
						||   ( sx > 5 && esy < 6 && b2 > 0 )
						||   ( sx < 6 && esy > 5 && esy < 14 && b3 > 0 )
						||   ( sx > 5 && esy > 5 && esy < 14 && b4 > 0 )
						||   ( sx < 6 && esy > 13 && b5 > 0 )
						||   ( sx > 5 && esy > 13 && b6 > 0 )
						) {	col = 1; }

						// If we're drawing separated characters, some
						// rows and columns just appear as the background
						// colour. If we're on a pixel on one of these
						// rows or columns, set it to the background
						// colour.
						if ( ecs == 1 &&
							( sx == 0 || sx == 1 || sx == 6 || sx == 7
							|| esy == 4 || esy == 5 || esy == 12
							|| esy == 13 || esy == 18 || esy == 19 )) {
							col = 0;
						}

						// We don't flash in the editor but instead mark
						// flashing colours with fine diagonal lines.
						// If the character is flashing, and we're on
						// one of the pixels through which this line would
						// be drawn, we set it.
						if ( esf > 0 && ( ( sx + sy ) % 4 == 3 ) ) {
							col = 1;
						}

						// Similarly, concealed characters appear with
						// horizontal lines in the 'show control codes'
						// mode.
						if ( esc > 0 && showcc == 1 && ( sy % 4 == 2 ) ) {
							col = 1;
						}

						// Next, set the pixel to the right colour.
						if ( col == 1 ) { ctx.fillStyle = cell_fg; }
							else { ctx.fillStyle = cell_bg; }

						// Unless the grid is being shown, and then we
						// set the pixel if it's on this grid...
						// We also mark the first eight characters
						// differently in order to show they are usually
						// not reproduced in a teletext frame (they are
						// used for page metadata)
						if ( statushidden == 0 && grid == 1 && // guides only
							(	( ( sx + sy ) % 2 == 0 && sx == 0 && r == 1 && c == 0 )
							||	( ( sx + sy ) % 2 == 0 && sy == 0 && r == 1 && c < 2 )
							||	( ( sx + sy ) % 2 == 1 && sx == 11 && r == 1 && c == 39 )
							||	( ( sx + sy ) % 2 == 1 && sy == 0 && r == 1 && c > 37 )
							||	( ( sx + sy ) % 2 == 1 && sx == 0 && r == 23 && c == 0 )
							||	( ( sx + sy ) % 2 == 1 && sy == 19 && r == 23 && c < 2 )
							||	( ( sx + sy ) % 2 == 0 && sx == 11 && r == 23 && c == 39 )
							||	( ( sx + sy ) % 2 == 0 && sy == 19 && r == 23 && c > 37 )
							||	( ( sx + sy ) % 2 == 0 && sx == 11 && sy < 10 && r == 0 && c == 7 )
							) ) {
							ctx.fillStyle = cell_grid; }
						if ( statushidden == 0 && grid == 2 &&
							(	( sx == 11 && !( r == 0 && c < 7 ) && !( r == 24 ) )
							||	( sy == 0  && !( r == 0 && c < 8 ) ) ) ) {
							ctx.fillStyle = cell_grid; }

						// Finally, we draw the pixel!
						ctx.fillRect(((c*12)+(sx))*pix_scale, ((r*20)+(sy))*pix_scale, 1*pix_scale, 1*pix_scale);

						continue; // Skip the code below which renders
								  // this pixel as text.
					}
					// We know that if we get here that we're writing simple
					// text here.

					// Construct a mask to look up the right pixel in the
					// font. 'bit' is non-zero if this is the foreground.
					var mask = 1 << ( 11 - sx );
					var bit = font[ecc][esy] & mask;

					// We also want flashing and conceal lines in text mode.
					if ( esf > 0 && ( ( sx + sy ) % 4 == 3 ) ) {
						bit = 1;
					}
					if ( esc > 0 && showcc == 1 && ( sy % 4 == 2 ) ) {
						bit = 1;
					}

					// Set the pixel colour.
					if ( bit > 0 ) {
						ctx.fillStyle = cell_fg;
					} else {
						ctx.fillStyle = cell_bg;
					}

					// If the grid is being shown, set the pixel as above.
					if ( statushidden == 0 && grid == 1 && // guides only
						(	( ( sx + sy ) % 2 == 0 && sx == 0 && r == 1 && c == 0 )
						||	( ( sx + sy ) % 2 == 0 && sy == 0 && r == 1 && c < 2 )
						||	( ( sx + sy ) % 2 == 1 && sx == 11 && r == 1 && c == 39 )
						||	( ( sx + sy ) % 2 == 1 && sy == 0 && r == 1 && c > 37 )
						||	( ( sx + sy ) % 2 == 1 && sx == 0 && r == 23 && c == 0 )
						||	( ( sx + sy ) % 2 == 1 && sy == 19 && r == 23 && c < 2 )
						||	( ( sx + sy ) % 2 == 0 && sx == 11 && r == 23 && c == 39 )
						||	( ( sx + sy ) % 2 == 0 && sy == 19 && r == 23 && c > 37 )
						||	( ( sx + sy ) % 2 == 0 && sx == 11 && r == 0 && sy < 10 && c == 7 )
						) ) {
						ctx.fillStyle = cell_grid; }
					if ( statushidden == 0 && grid == 2 &&
						(	( sx == 11 && !( r == 0 && c < 7 ) && !( r == 24 ) )
						||	( sy == 0  && !( r == 0 && c < 8 ) ) ) ) {
						ctx.fillStyle = cell_grid; }

					// And finally draw the pixel!
					ctx.fillRect(((c*12)+(sx))*pix_scale, ((r*20)+(sy))*pix_scale, 1*pix_scale, 1*pix_scale);
				}
			}
		}
	}

	// We update the status bar to show changes, and things like the
	// cursor position and cell contents.
	draw_status_bar();
}

// Held characters are a pain. This editor aims to only update the
// cells that have changed, but when a graphic character has changed,
// or is removed, or added, then it may end up causing a later control
// code in held graphics mode to be changed. This side-effect is
// handled by the following function, gfx_change(). It hints that
// graphics characters have updated (including having been removed),
// and triggers a render on any affected cells. It is called after
// calling place or remove, because it reads the attributes directly.

// The arguments are a span of characters - all of those from (x1,y1)
// to (x2,y2), read from top to bottom and left to right.

// We don't need to re-render this span, since this has handled
// in other places. However, we need to keep track of things that
// would affect held graphics in following codes, and re-render
// where needed (we don't need to specify the character itself in
// the call).
var gfx_change = function(x1, y1, x2, y2) {

	// First we need to understand the state of attributes at the
	// end of this span so we know how to handle the search past
	// the end of it.

	// We begin scanning forward, using (px,py) as the current
	// position. We start at the beginning of the span. It doesn't matter
	// whether held graphics is enabled here.
	var px = x1;
	var py = y1;

	// We have three possible states:
	// 0 means no graphic character has been found yet.
	// 1 means a graphic character has been found.
	// 2 means the character being substituted in held graphics
	//   would not propagate beyond this point.
	var state = 0;

	while ( py < y2 || ( py == y2 && px < x2) ) {

		// Is this a graphic character? If so, we've found a
		// substitution.
		if ( tg[py][px] == 1 &&
			( ( cc[py][px] >= 32 && cc[py][px] < 64 )
			|| ( cc[py][px] >= 96 && cc[py][px] < 128 ) )
			) { state = 1; }

		// If anything has happened that would cancel the held
		// graphics effect, ie reset it to a space, we don't need
		// to keep doing this expensive scan unless we see another
		// graphics character. Let's check for these
		// conditions.

		// A graphics control character has switched from text
		if ( cc[py][px] > 16 && cc[py][px] <= 23 && tg[py][px] == 0 ) {
			state = 2; }
		if ( blackfg != 0 && cc[py][px] == 16 && tg[py][px] == 0 ) {
			state = 2; }

		// A text control character has switched from graphics
		if ( cc[py][px] > 0 && cc[py][px] <= 7 && tg[py][px] == 1 ) {
			state = 2; }
		if ( blackfg != 0 && cc[py][px] == 0 && tg[py][px] == 1 ) {
			state = 2; }

		// A normal height control character has switched from double height.
		// Note that normal height is "set-at" so we need to check the
		// position before.
		if ( px > 0 && cc[py][px] == 12 && nd[py][px-1] == 1 ) {
			state = 2; }

		// A double height control character has switched from normal height.
		// Note that double height is "set-after" so we check this position.
		if ( cc[py][px] == 13 && nd[py][px] == 0 ) { state = 2; }

		// Advance.
		px++;
		if ( px > 40 ) { px = 0; py++; }
	}

	// Now we can decide what to do according to the state we determined
	// this change to be in at the end of the span.

	// If held graphics was reset since the end and there are no graphics
	// characters since, our work here is done.
	if ( state == 2 ) { return; }

	// If the state is 1, there's a graphic character here, and we need
	// to propogate it to all control characters in held graphics. If
	// the state is 0, we're not off the hook - we might have removed
	// a graphics character!

	// Let's resume the scan, one position after.
	var py = y2;
	var px = x2 + 1;

	while ( px < 40 ) {

		// We need to keep checking whether the graphic character has
		// changed. It's the same process as above, except the action
		// is different - this time we just render the cell and return.
		if ( cc[py][px] > 16 && cc[py][px] <= 23 && tg[py][px] == 0 ) {
			render(px, py, 1, 1); break; }
		if ( blackfg != 0 && cc[py][px] == 16 && tg[py][px] == 0 ) {
			render(px, py, 1, 1); break; }
		if ( cc[py][px] > 0 && cc[py][px] <= 7 && tg[py][px] == 1 ) {
			render(px, py, 1, 1); break; }
		if ( blackfg != 0 && cc[py][px] == 0 && tg[py][px] == 1 ) {
			render(px, py, 1, 1); break; }
		if ( px > 0 && cc[py][px] == 12 && nd[py][px-1] == 1 ) {
			render(px, py, 1, 1); break; }
		if ( cc[py][px] == 13 && nd[py][px] == 0 ) {
			render(px, py, 1, 1); break; }

		// If none of these applied, the change would have affected
		// this cell, providing held graphics is on and control codes
		// are not being shown, so we re-render.
		if ( cc[py][px] < 32 && showcc == 0 && hg[py][px] > 0 ) {
			render(px, py, 1, 1);
		}

		// And continue until we're finished.
		px++;
	}
}

// Sets a new state for revealing concealed characters, 0 for off and
// 1 for on.
this.set_reveal = function(newreveal) {
	set_reveal_state(newreveal);
}

var set_reveal_state = function(newreveal) {
	reveal = newreveal;

	// Now re-render the characters marked as concealed.
	for ( var r = 0; r < 25; r++ ) {
		for ( var c = 0; c < 40; c++ ) {
			if ( sc[r][c] > 0 ) {
				autorender(c,r,1,1);
			}
		}
	}
}
var toggle_reveal_state = function() {
	set_reveal_state(1 - reveal);
}

// Sets the scale for the editor, and re-renders it.
this.set_size = function(newsize) {
	pix_size = newsize;
}

var shift_sixels = function(x1, y1, x2, y2, xd, yd) {
	if ( xd != 0 && yd != 0 ) {
		shift_sixels(x1, y1, x2, y2, xd, 0);
		shift_sixels(x1, y1, x2, y2, 0, yd);
		return;
	}
	var newblock = [];
	var newblocklock = []; // if 1, cell is 'locked' against writing.
	var weights = [1,2,4,8,16,64];
	for ( var r = y1; r <= y2; r++ ) {
		newblock[r-y1] = [];
		newblocklock[r-y1] = [];
		for ( var c = x1; c <= x2; c++ ) {
			newblock[r-y1][c-x1] = 32;
			newblocklock[r-y1][c-x1] = 0;
		}
	}
	var size_x = x2 - x1 + 1; // includes both ends
	var size_y = y2 - y1 + 1;
	for ( var c = x1; c <= x2; c++ ) {
		for ( var r = y1; r <= y2; r++ ) {
			if ( tg[r][c] == 0 ) {
				newblock[r-y1][c-x1] = cc[r][c];
				newblocklock[r-y1][c-x1] = 1;
				continue;
				}
			if ( tg[r][c] == 1
				&& ( ! ( ( cc[r][c] >= 32 && cc[r][c] < 64 )
				|| ( cc[r][c] >= 96 && cc[r][c] < 128 ) ) ) ) {
				newblock[r-y1][c-x1] = cc[r][c];
				newblocklock[r-y1][c-x1] = 1;
				continue;
			}
			for ( var sy = 0; sy < 3; sy++ ) {
				for ( var sx = 0; sx < 2; sx++ ) {

					var new_xpos = (2*c) + sx + xd;
					var new_ypos = (3*r) + sy + yd;

					var new_c = parseInt( new_xpos / 2 );
					var new_sx = new_xpos % 2;
					var new_r = parseInt( new_ypos / 3 );
					var new_sy = new_ypos % 3;
					
					// We shouldn't write outside of the rectangle.
					if ( ( new_r - y1 < 0 )
					|| ( new_r - y1 >= size_y )
					|| ( new_c - x1 < 0 )
					|| ( new_c - x1 >= size_x ) ) { continue; }
					
					// We shouldn't write any data here unless it's going to be
					// into a graphics character.
					if ( newblocklock[new_r-y1][new_c-x1] != 0 ) {
						continue;
					}

					var weight = weights[(sy*2)+sx];
					var value = cc[r][c] & weight;
					if ( value > 0 ) { value = 1; }

					var new_weight = weights[(new_sy*2)+new_sx];

					newblock[new_r-y1][new_c-x1] |= value * new_weight;
				}
			}
		}
	}

	// Finally, replace the characters.
	for ( var r = y1; r <= y2; r++ ) {
		for ( var c = x1; c <= x2; c++ ) {
			put_char(c, r, newblock[r-y1][c-x1]);
		}
	}
}

////////////////
///// FONT /////
////////////////

// What follows next is the font definitions (later) and smoothing
// functions (earlier). The smoothing follows the smoothing algorithm
// used in the SAA5050, where if the 2x2 squares, obtained by scaling
// by double the original pixels up by, meet only on their diagonal,
// an additional pixel is put either side of the diagonal to smooth it.

// The add_font_char function acts as an abstration to the array where
// we keep the font data itself. Each character, unsmoothed, is a 5x9
// matrix. add_font_char is called with the character code and the
// bit pattern of each of five lines (each therefore an integer in the
// range 0 to 31). add_font_char smooths this matrix into what actually
// ends up in the font array, a nice smoothed version ready to render.
var add_font_char = function(code, l1, l2, l3, l4, l5, l6, l7, l8, l9) {

	// The args are put into an array for easy access.
	var d = [l1, l2, l3, l4, l5, l6, l7, l8, l9];

	// The top line (top two pixels) of a letter are always
	// blank.
	var smoothed = [0, 0];

	// Of the remaining eighteen, copy the input character
	// such that each pixel in the input character is a 2x2
	// region in the output.
	for ( var y = 0; y < 18; y++ ) {
		// The bitmap of 12 horizontal pixels.
		var bm = 0;
		var yo = Math.floor(y/2);
		for ( var x = 0; x < 12; x++ ) {
			var xo = Math.floor(x/2);

			// Move a bit across to the right position to act
			// as a mask and OR it.
			var mask = 1 << ( 5 - xo );
			var bit = d[yo] & mask;
			if ( bit > 0 ) { bm |= 1; }
			bm <<= 1;
		}
		// Just copy the same result for the next line.
		smoothed[y+2] = bm;
	}

	// We now have a 20x12 character ready to be smoothed.
	// We just go through each possible meeting of grid lines
	// (the point where pixels meet) and test if there's a
	// diagonal to smooth.
	for ( var y = 0; y < 19; y++ ) {
		for ( var x = 0; x < 11; x++ ) {
			// Masks of pixels surrounding this meeting of
			// grid lines.
			var mask1 = 1 << ( 11 - x );
			var mask2 = 1 << ( 10 - x );

			// AND the masks to get zero or non-zero values
			// for the surrounding pixels.
			var tl = smoothed[y] & mask1;
			var tr = smoothed[y] & mask2;
			var bl = smoothed[y+1] & mask1;
			var br = smoothed[y+1] & mask2;

			// If either diagonal satisfies the smoothing
			// condition, set the pixel in the smoothed version.
			if ( tl > 0 && br > 0 && tr == 0 && bl == 0 ) {
				smoothed[y] |= mask2;
				smoothed[y+1] |= mask1;
			}
			if ( tr > 0 && bl > 0 && tl == 0 && br == 0 ) {
				smoothed[y] |= mask1;
				smoothed[y+1] |= mask2;
			}
		}
	}

	// Finally, assign the smoothed version to the font array.
	font[code] = smoothed;
}

// Simply sets the character set, loads the font and renders the frame.
var set_charset = function(charset) {
	cset = charset;
	init_font(cset);
	render(0,0,40,25,0);
}

var cycle_charset = function() {
	cset = ( cset + 1 ) % 8;
	init_font(cset);
	render(0,0,40,25,0);
}

// Given the number of a character set, init_font loads the
// font into the font array via add_font_char, which implicitly
// smooths it. Labels for control codes are also loaded, in
// case they're shown by the user.

// The character sets supported are those appearing in the
// SAA5050 and variants, namely:
// 0: English   1: German     2: Swedish   3: Italian
// 4: Belgian   5: US-ASCII   6: Hebrew    7: Cyrillic
var init_font = function(charset) {
	add_font_char(0,8,20,28,20,0,5,6,5,5);
		// AK (K stands for black here)
	add_font_char(1,8,20,28,20,0,6,5,6,5);
		// AR
	add_font_char(2,8,20,28,20,0,3,4,5,3);
		// AG
	add_font_char(3,8,20,28,20,0,5,5,2,2);
		// AY
	add_font_char(4,8,20,28,20,0,6,6,5,6);
		// AB
	add_font_char(5,8,20,28,20,0,30,21,21,21);
		// AM
	add_font_char(6,8,20,28,20,0,3,4,4,3);
		// AC
	add_font_char(7,8,20,28,20,0,21,21,21,15);
		// AW
	add_font_char(8,28,16,28,16,16,4,4,4,7);
		// FL
	add_font_char(9,12,16,8,4,24,0,7,2,2);
		// ST

	for ( var cc = 10; cc < 12; cc++ ) {
		// These are undefined, so we just use a diamond
		// character.
		add_font_char(cc,0,4,10,17,10,4,0,0,0);
	}

	add_font_char(12,24,20,20,20,0,5,7,5,5);
		// NH
	add_font_char(13,24,20,20,24,0,5,7,5,5);
		// DH

	for ( var cc = 14; cc < 16; cc++ ) {
		// More diamonds
		add_font_char(cc,0,4,10,17,10,4,0,0,0);
	}

	add_font_char(16,12,16,20,12,0,5,6,5,5);
		// GK
	add_font_char(17,12,16,20,12,0,6,5,6,5);
		// GR
	add_font_char(18,12,16,20,12,0,3,4,5,3);
		// GG
	add_font_char(19,12,16,20,12,0,5,5,2,2);
		// GY
	add_font_char(20,12,16,20,12,0,6,6,5,6);
		// GB
	add_font_char(21,12,16,20,12,0,30,21,21,21);
		// GM
	add_font_char(22,12,16,20,12,0,3,4,4,3);
		// GC
	add_font_char(23,12,16,20,12,0,21,21,21,15);
		// GW
	add_font_char(24,12,16,16,12,0,2,5,5,2);
		// CO
	add_font_char(25,12,16,16,12,0,3,4,5,3);
		// CG
	add_font_char(26,12,16,8,4,24,3,4,5,3);
		// SG
	add_font_char(27,0,4,10,17,10,4,0,0,0);
		// ESC is not used, so a diamond symbol.
	add_font_char(28,20,24,20,20,0,6,6,5,6);
		// KB
	add_font_char(29,24,20,20,20,0,6,6,5,6);
		// NB
	add_font_char(30,20,28,20,20,0,3,4,5,3);
		// HG
	add_font_char(31,24,20,24,20,0,3,4,5,3);
		// RG

	add_font_char(32,0,0,0,0,0,0,0,0,0);
		// space

	add_font_char(33,4,4,4,4,4,0,4,0,0);
		// exclamation mark

	add_font_char(34,10,10,10,0,0,0,0,0,0);
		// double quotes

	if ( charset == 0 ) { add_font_char(35,6,9,8,28,8,8,31,0,0); }
	if ( charset == 3 ) { add_font_char(35,6,9,8,28,8,8,31,0,0); }
	if ( charset == 6 ) { add_font_char(35,6,9,8,28,8,8,31,0,0); }
		// pound sterling
	if ( charset == 1 ) { add_font_char(35,10,10,31,10,31,10,10,0,0); }
	if ( charset == 2 ) { add_font_char(35,10,10,31,10,31,10,10,0,0); }
	if ( charset == 5 ) { add_font_char(35,10,10,31,10,31,10,10,0,0); }
	if ( charset == 7 ) { add_font_char(35,10,10,31,10,31,10,10,0,0); }
		// hash
	if ( charset == 4 ) { add_font_char(35,2,4,14,17,31,16,14,0,0); }
		// lowercase e with acute accent

	if ( charset == 0 ) { add_font_char(36,14,21,20,14,5,21,14,0,0); }
	if ( charset == 1 ) { add_font_char(36,14,21,20,14,5,21,14,0,0); }
	if ( charset == 3 ) { add_font_char(36,14,21,20,14,5,21,14,0,0); }
	if ( charset == 5 ) { add_font_char(36,14,21,20,14,5,21,14,0,0); }
	if ( charset == 6 ) { add_font_char(36,14,21,20,14,5,21,14,0,0); }
	if ( charset == 7 ) { add_font_char(36,14,21,20,14,5,21,14,0,0); }
		// dollar sign
	if ( charset == 2 ) { add_font_char(36,0,0,17,14,10,14,17,0,0); }
		// currency sign
	if ( charset == 4 ) { add_font_char(36,10,0,12,4,4,4,14,0,0); }
		// lowercase i with diaresis

	add_font_char(37,24,25,2,4,8,19,3,0,0);
		// percentage

	if ( charset == 7 ) {
		add_font_char(38,0,0,17,17,29,21,29,0,0);
		// Cyrillic yery
	} else {
		add_font_char(38,8,20,20,8,21,18,13,0,0);
		// ampersand
	}

	if ( charset == 0 ) { add_font_char(39,4,4,4,0,0,0,0,0,0); }
	if ( charset == 3 ) { add_font_char(39,4,4,4,0,0,0,0,0,0); }
	if ( charset == 6 ) { add_font_char(39,4,4,4,0,0,0,0,0,0); }
	if ( charset == 4 ) { add_font_char(39,4,4,4,0,0,0,0,0,0); }
	if ( charset == 7 ) { add_font_char(39,4,4,4,0,0,0,0,0,0); }
		// apostrophe
	if ( charset == 1 ) { add_font_char(39,4,4,8,0,0,0,0,0,0); }
	if ( charset == 2 ) { add_font_char(39,4,4,8,0,0,0,0,0,0); }
	if ( charset == 5 ) { add_font_char(39,4,4,8,0,0,0,0,0,0); }
		// another style of apostrophe

	add_font_char(40,2,4,8,8,8,4,2,0,0);
		// open paren

	add_font_char(41,8,4,2,2,2,4,8,0,0);
		// close paren

	add_font_char(42,4,21,14,4,14,21,4,0,0);
		// star

	add_font_char(43,0,4,4,31,4,4,0,0,0);
		// plus

	if ( charset == 0 ) { add_font_char(44,0,0,0,0,0,4,4,8,0); }
	if ( charset == 3 ) { add_font_char(44,0,0,0,0,0,4,4,8,0); }
	if ( charset == 4 ) { add_font_char(44,0,0,0,0,0,4,4,8,0); }
	if ( charset == 5 ) { add_font_char(44,0,0,0,0,0,4,4,8,0); }
	if ( charset == 6 ) { add_font_char(44,0,0,0,0,0,4,4,8,0); }
		// comma
	if ( charset == 1 ) { add_font_char(44,0,0,0,0,0,8,8,16,0); }
	if ( charset == 2 ) { add_font_char(44,0,0,0,0,0,8,8,16,0); }
	if ( charset == 7 ) { add_font_char(44,0,0,0,0,0,8,8,16,0); }
		// another style of comma

	add_font_char(45,0,0,0,14,0,0,0,0,0);
		// hyphen

	if ( charset == 0 ) { add_font_char(46,0,0,0,0,0,0,4,0,0); }
	if ( charset == 3 ) { add_font_char(46,0,0,0,0,0,0,4,0,0); }
	if ( charset == 4 ) { add_font_char(46,0,0,0,0,0,0,4,0,0); }
	if ( charset == 5 ) { add_font_char(46,0,0,0,0,0,0,4,0,0); }
	if ( charset == 6 ) { add_font_char(46,0,0,0,0,0,0,4,0,0); }
	if ( charset == 7 ) { add_font_char(46,0,0,0,0,0,0,4,0,0); }
		// full stop
	if ( charset == 1 ) { add_font_char(46,0,0,0,0,0,12,12,0,0); }
	if ( charset == 2 ) { add_font_char(46,0,0,0,0,0,12,12,0,0); }
		// heavier full stop

	add_font_char(47,0,1,2,4,8,16,0,0,0);
	add_font_char(48,4,10,17,17,17,10,4,0,0);
	add_font_char(49,4,12,4,4,4,4,14,0,0);
	add_font_char(50,14,17,1,6,8,16,31,0,0);
	add_font_char(51,31,1,2,6,1,17,14,0,0);
	add_font_char(52,2,6,10,18,31,2,2,0,0);
	add_font_char(53,31,16,30,1,1,17,14,0,0);
	add_font_char(54,6,8,16,30,17,17,14,0,0);
	add_font_char(55,31,1,2,4,8,8,8,0,0);
	add_font_char(56,14,17,17,14,17,17,14,0,0);
	add_font_char(57,14,17,17,15,1,2,12,0,0);

	if ( charset == 0 ) { add_font_char(58,0,0,4,0,0,0,4,0,0); }
	if ( charset == 3 ) { add_font_char(58,0,0,4,0,0,0,4,0,0); }
	if ( charset == 4 ) { add_font_char(58,0,0,4,0,0,0,4,0,0); }
	if ( charset == 5 ) { add_font_char(58,0,0,4,0,0,0,4,0,0); }
	if ( charset == 6 ) { add_font_char(58,0,0,4,0,0,0,4,0,0); }
	if ( charset == 7 ) { add_font_char(58,0,0,4,0,0,0,4,0,0); }
		// colon
	if ( charset == 1 ) { add_font_char(58,0,0,0,8,0,0,8,0,0); }
	if ( charset == 2 ) { add_font_char(58,0,0,0,8,0,0,8,0,0); }
		// left-shifted colon

	if ( charset == 0 ) { add_font_char(59,0,0,4,0,0,4,4,8,0); }
	if ( charset == 3 ) { add_font_char(59,0,0,4,0,0,4,4,8,0); }
	if ( charset == 4 ) { add_font_char(59,0,0,4,0,0,4,4,8,0); }
	if ( charset == 5 ) { add_font_char(59,0,0,4,0,0,4,4,8,0); }
	if ( charset == 6 ) { add_font_char(59,0,0,4,0,0,4,4,8,0); }
	if ( charset == 7 ) { add_font_char(59,0,0,4,0,0,4,4,8,0); }
		// semi-colon
	if ( charset == 1 ) { add_font_char(59,0,0,8,0,0,8,8,16,0); }
	if ( charset == 2 ) { add_font_char(59,0,0,8,0,0,8,8,16,0); }
		// left-shifted semi-colon

	add_font_char(60,2,4,8,16,8,4,2,0,0);
	add_font_char(61,0,0,31,0,31,0,0,0,0);
	add_font_char(62,8,4,2,1,2,4,8,0,0);

	if ( charset == 0 ) { add_font_char(63,14,17,2,4,4,0,4,0,0); }
	if ( charset == 3 ) { add_font_char(63,14,17,2,4,4,0,4,0,0); }
	if ( charset == 4 ) { add_font_char(63,14,17,2,4,4,0,4,0,0); }
	if ( charset == 5 ) { add_font_char(63,14,17,2,4,4,0,4,0,0); }
	if ( charset == 6 ) { add_font_char(63,14,17,2,4,4,0,4,0,0); }
	if ( charset == 7 ) { add_font_char(63,14,17,2,4,4,0,4,0,0); }
		// question mark
	if ( charset == 1 ) { add_font_char(63,14,17,1,2,4,0,4,0,0); }
	if ( charset == 2 ) { add_font_char(63,14,17,1,2,4,0,4,0,0); }
		// another style of question mark

	if ( charset == 0 ) { add_font_char(64,14,17,23,21,23,16,14,0,0); }
	if ( charset == 5 ) { add_font_char(64,14,17,23,21,23,16,14,0,0); }
	if ( charset == 6 ) { add_font_char(64,14,17,23,21,23,16,14,0,0); }
		// at-sign
	if ( charset == 1 ) { add_font_char(64,14,17,16,14,17,14,1,17,14); }
		// section sign
	if ( charset == 2 ) { add_font_char(64,2,4,31,16,30,16,31,0,0); }
		// capital e with acute accent
	if ( charset == 3 ) { add_font_char(64,2,4,14,17,31,16,14,0,0); }
		// lowercase e with acute accent
	if ( charset == 4 ) { add_font_char(64,8,4,14,1,15,17,15,0,0); }
		// lowercase a with grave accent
	if ( charset == 7 ) { add_font_char(64,18,21,21,29,21,21,18,0,0); }
		// Cyrillic Yu

	if ( charset == 7 ) {
		add_font_char(65,14,17,17,17,31,17,17,0,0);
		// Cyrillic A
	} else {
		add_font_char(65,4,10,17,17,31,17,17,0,0);
		// A
	}

	if ( charset == 7 ) {
		add_font_char(66,31,16,16,31,17,17,31,0,0);
		// Cyrillic Be
	} else {
		add_font_char(66,30,17,17,30,17,17,30,0,0);
		// B
	}

	if ( charset == 7 ) {
		add_font_char(67,18,18,18,18,18,18,31,1,0);
		// Cyrillic Tse
	} else {
		add_font_char(67,14,17,16,16,16,17,14,0,0);
		// C
	}

	if ( charset == 0 ) { add_font_char(68,30,17,17,17,17,17,30,0,0); }
	if ( charset == 3 ) { add_font_char(68,30,17,17,17,17,17,30,0,0); }
	if ( charset == 4 ) { add_font_char(68,30,17,17,17,17,17,30,0,0); }
	if ( charset == 5 ) { add_font_char(68,30,17,17,17,17,17,30,0,0); }
	if ( charset == 6 ) { add_font_char(68,30,17,17,17,17,17,30,0,0); }
	if ( charset == 1 ) { add_font_char(68,30,9,9,9,9,9,30,0,0); }
	if ( charset == 2 ) { add_font_char(68,14,9,9,9,9,9,14,0,0); }
		// D
	if ( charset == 7 ) { add_font_char(68,6,10,10,10,10,10,31,17,0); }
		// Cyrillic De

	if ( charset == 7 ) {
		add_font_char(69,31,16,16,30,16,16,31,0,0);
		// Cyrillic Ye
	} else {
		add_font_char(69,31,16,16,30,16,16,31,0,0);
		// E
	}

	if ( charset == 7 ) {
		add_font_char(70,4,31,21,21,21,31,4,0,0);
		// Cyrillic Ef
	} else {
		add_font_char(70,31,16,16,30,16,16,16,0,0);
		// F
	}

	if ( charset == 7 ) {
		add_font_char(71,31,16,16,16,16,16,16,0,0);
		// Cyrillic Ge
	} else {
		add_font_char(71,14,17,16,16,19,17,15,0,0);
		// G
	}

	if ( charset == 7 ) {
		add_font_char(72,17,17,10,4,10,17,17,0,0);
		// Cyrillic Kha
	} else {
		add_font_char(72,17,17,17,31,17,17,17,0,0);
		// H
	}

	if ( charset == 7 ) {
		add_font_char(73,17,17,19,21,25,17,17,0,0);
		// Cyrillic I
	} else {
		add_font_char(73,14,4,4,4,4,4,14,0,0);
		// I
	}

	if ( charset == 0 ) { add_font_char(74,1,1,1,1,1,17,14,0,0); }
	if ( charset == 3 ) { add_font_char(74,1,1,1,1,1,17,14,0,0); }
	if ( charset == 4 ) { add_font_char(74,1,1,1,1,1,17,14,0,0); }
	if ( charset == 5 ) { add_font_char(74,1,1,1,1,1,17,14,0,0); }
	if ( charset == 6 ) { add_font_char(74,1,1,1,1,1,17,14,0,0); }
	if ( charset == 1 ) { add_font_char(74,2,2,2,2,2,18,12,0,0); }
	if ( charset == 2 ) { add_font_char(74,2,2,2,2,2,18,12,0,0); }
		// J
	if ( charset == 7 ) { add_font_char(74,21,17,19,21,25,17,17,0,0); }
		// Cyrillic Short I

	if ( charset == 7 ) {
		add_font_char(75,17,18,20,24,20,18,17,0,0);
		// Cyrillic Ka
	} else {
		add_font_char(75,17,18,20,24,20,18,17,0,0);
		// K
	}

	if ( charset == 0 ) { add_font_char(76,16,16,16,16,16,16,31,0,0); }
	if ( charset == 3 ) { add_font_char(76,16,16,16,16,16,16,31,0,0); }
	if ( charset == 4 ) { add_font_char(76,16,16,16,16,16,16,31,0,0); }
	if ( charset == 5 ) { add_font_char(76,16,16,16,16,16,16,31,0,0); }
	if ( charset == 6 ) { add_font_char(76,16,16,16,16,16,16,31,0,0); }
	if ( charset == 1 ) { add_font_char(76,8,8,8,8,8,8,15,0,0); }
	if ( charset == 2 ) { add_font_char(76,8,8,8,8,8,8,15,0,0); }
		// L
	if ( charset == 7 ) { add_font_char(76,7,9,9,9,9,9,25,0,0); }
		// Cyrillic El

	if ( charset == 7 ) {
		add_font_char(77,17,27,21,21,17,17,17,0,0);
		// Cyrillic Em
	} else {
		add_font_char(77,17,27,21,21,17,17,17,0,0);
		// M
	}

	if ( charset == 7 ) {
		add_font_char(78,17,17,17,31,17,17,17,0,0);
		// Cyrillic En
	} else {
		add_font_char(78,17,17,25,21,19,17,17,0,0);
		// N
	}

	if ( charset == 7 ) {
		add_font_char(79,14,17,17,17,17,17,14,0,0);
		// Cyrillic O
	} else {
		add_font_char(79,14,17,17,17,17,17,14,0,0);
		// O
	}

	if ( charset == 7 ) {
		add_font_char(80,31,17,17,17,17,17,17,0,0);
		// Cyrillic Er
	} else {
		add_font_char(80,30,17,17,30,16,16,16,0,0);
		// P
	}

	if ( charset == 7 ) {
		add_font_char(81,15,17,17,15,5,9,17,0,0);
		// Cyrillic Ya
	} else {
		add_font_char(81,14,17,17,17,21,18,13,0,0);
		// Q
	}

	if ( charset == 7 ) {
		add_font_char(82,30,17,17,30,16,16,16,0,0);
		// Cyrillic Er
	} else {
		add_font_char(82,30,17,17,30,20,18,17,0,0);
		// R
	}

	if ( charset == 7 ) {
		add_font_char(83,14,17,16,16,16,17,14,0,0);
		// Cyrillic Es
	} else {
		add_font_char(83,14,17,16,14,1,17,14,0,0);
		// S
	}

	if ( charset == 7 ) {
		add_font_char(84,31,4,4,4,4,4,4,0,0);
		// Cyrillic Te
	} else {
		add_font_char(84,31,4,4,4,4,4,4,0,0);
		// T
	}

	if ( charset == 7 ) {
		add_font_char(85,17,17,17,31,1,1,31,0,0);
		// Cyrillic U
	} else {
		add_font_char(85,17,17,17,17,17,17,14,0,0);
		// U
	}

	if ( charset == 7 ) {
		add_font_char(86,21,21,21,14,21,21,21,0,0);
		// Cyrillic Zhe
	} else {
		add_font_char(86,17,17,17,10,10,4,4,0,0);
		// V
	}

	if ( charset == 7 ) {
		add_font_char(87,30,17,17,30,17,17,30,0,0);
		// Cyrillic Ve
	} else {
		add_font_char(87,17,17,17,21,21,21,10,0,0);
		// W
	}

	if ( charset == 7 ) {
		add_font_char(88,16,16,16,31,17,17,31,0,0);
		// Cyrillic Soft Sign (Yeri)
	} else {
		add_font_char(88,17,17,10,4,10,17,17,0,0);
		// X
	}

	if ( charset == 7 ) {
		add_font_char(89,24,8,8,15,9,9,15,0,0)
		// Cyrillic Hard Sign (Yer)
	} else {
		add_font_char(89,17,17,10,4,4,4,4,0,0);
		// Y
	}

	if ( charset == 7 ) {
		add_font_char(90,14,17,1,6,1,17,14,0,0);
		// Cyrillic Ze
	} else {
		add_font_char(90,31,1,2,4,8,16,31,0,0);
		// Z
	}

	if ( charset == 0 ) { add_font_char(91,0,4,8,31,8,4,0,0,0); }
	if ( charset == 6 ) { add_font_char(91,0,4,8,31,8,4,0,0,0); }
		// left-arrow
	if ( charset == 1 ) { add_font_char(91,10,0,14,17,31,17,17,0,0); }
	if ( charset == 2 ) { add_font_char(91,10,0,14,17,31,17,17,0,0); }
		// capital a with umlaut
	if ( charset == 3 ) { add_font_char(91,6,9,6,0,0,0,0,0,0); }
		// degree symbol
	if ( charset == 4 ) { add_font_char(91,10,0,14,17,31,16,14,0,0); }
		// lowercase e with diaresis
	if ( charset == 5 ) { add_font_char(91,15,8,8,8,8,8,15,0,0); }
		// left square bracket
	if ( charset == 7 ) { add_font_char(91,21,21,21,21,21,21,31,0,0); }
		// Cyrillic Sha

	if ( charset == 0 ) { add_font_char(92,16,16,16,16,22,1,2,4,7); }
	if ( charset == 6 ) { add_font_char(92,16,16,16,16,22,1,2,4,7); }
		// half
	if ( charset == 1 ) { add_font_char(92,10,0,14,17,17,17,14,0,0); }
	if ( charset == 2 ) { add_font_char(92,10,0,14,17,17,17,14,0,0); }
		// capital o with umlaut
	if ( charset == 3 ) { add_font_char(92,0,0,15,16,16,16,15,2,4); }
		// c with cedilla
	if ( charset == 4 ) { add_font_char(92,4,10,14,17,31,16,14,0,0); }
		// lowercase e with circumflex
	if ( charset == 5 ) { add_font_char(92,0,16,8,4,2,1,0,0,0); }
		// backslash
	if ( charset == 7 ) { add_font_char(92,12,18,1,7,1,18,12,0,0); }
		// Cyrillic E

	if ( charset == 0 ) { add_font_char(93,0,4,2,31,2,4,0,0,0); }
	if ( charset == 3 ) { add_font_char(93,0,4,2,31,2,4,0,0,0); }
	if ( charset == 6 ) { add_font_char(93,0,4,2,31,2,4,0,0,0); }
		// right-arrow
	if ( charset == 1 ) { add_font_char(93,10,0,17,17,17,17,14,0,0); }
		// capital u with umlaut
	if ( charset == 2 ) { add_font_char(93,4,0,14,17,31,17,17,0,0); }
		// capital a with ring
	if ( charset == 4 ) { add_font_char(93,4,2,17,17,17,17,15,0,0); }
		// lowercase u with grave accent
	if ( charset == 5 ) { add_font_char(93,30,2,2,2,2,2,30,0,0); }
		// right square bracket
	if ( charset == 7 ) { add_font_char(93,21,21,21,21,21,21,31,1,0); }
		// Cyrillic Shcha

	if ( charset == 0 ) { add_font_char(94,0,4,14,21,4,4,0,0,0); }
	if ( charset == 3 ) { add_font_char(94,0,4,14,21,4,4,0,0,0); }
	if ( charset == 6 ) { add_font_char(94,0,4,14,21,4,4,0,0,0); }
		// up-arrow
	if ( charset == 1 ) { add_font_char(94,4,10,17,0,0,0,0,0,0); }
		// caret
	if ( charset == 2 ) { add_font_char(94,10,0,17,17,17,17,14,0,0); }
		// capital u with umlaut
	if ( charset == 4 ) { add_font_char(94,4,10,0,12,4,4,14,0,0); }
		// lowercase i with circumflex
	if ( charset == 5 ) { add_font_char(94,4,10,17,0,0,0,0,0,0); }
		// caret
	if ( charset == 7 ) { add_font_char(94,17,17,17,31,1,1,1,0,0); }
		// Cyrillic Che

	if ( charset == 0 ) { add_font_char(95,10,10,31,10,31,10,10,0,0); }
	if ( charset == 3 ) { add_font_char(95,10,10,31,10,31,10,10,0,0); }
	if ( charset == 6 ) { add_font_char(95,10,10,31,10,31,10,10,0,0); }
		// hash
	if ( charset == 1 ) { add_font_char(95,0,0,0,0,0,0,31,0,0); }
	if ( charset == 2 ) { add_font_char(95,0,0,0,0,0,0,31,0,0); }
	if ( charset == 5 ) { add_font_char(95,0,0,0,0,0,0,31,0,0); }
		// underscore
	if ( charset == 4 ) { add_font_char(95,10,10,31,10,31,10,10,0,0); }
		// hash
	if ( charset == 7 ) { add_font_char(95,17,17,17,29,21,21,29,0,0); }
		// Cyrillic Yery

	if ( charset == 0 ) { add_font_char(96,0,0,0,31,0,0,0,0,0); }
		// long dash
	if ( charset == 1 ) { add_font_char(96,6,9,6,0,0,0,0,0,0); }
		// degree symbol
	if ( charset == 2 ) { add_font_char(96,2,4,14,17,31,16,14,0,0); }
		// lowercase e with acute accent
	if ( charset == 3 ) { add_font_char(96,8,4,17,17,17,17,15,0,0); }
		// lowercase u with grave accent
	if ( charset == 4 ) { add_font_char(96,8,4,14,17,31,16,14,0,0); }
		// lowercase e with grave accent
	if ( charset == 5 ) { add_font_char(96,4,4,2,0,0,0,0,0,0); }
		// opening quote
	if ( charset == 6 ) { add_font_char(96,0,17,9,21,18,17,17,0,0); }
		// Hebrew alef
	if ( charset == 7 ) { add_font_char(96,0,0,18,21,25,21,18,0,0); }
		// Cyrillic yu

	if ( charset == 6 ) {
		add_font_char(97,0,14,2,2,2,2,31,0,0);
		// Hebrew beit/veit
	} else if ( charset == 7 ) {
		add_font_char(97,0,0,14,1,15,17,15,0,0);
		// Cyrillic a
	} else {
		add_font_char(97,0,0,14,1,15,17,15,0,0);
		// b
	}

	if ( charset == 6 ) {
		add_font_char(98,0,3,1,1,3,5,9,0,0);
		// Hebrew gimel
	} else if ( charset == 7 ) {
		add_font_char(98,14,16,30,17,17,17,30,0,0);
		// Cyrillic be
	} else {
		add_font_char(98,16,16,30,17,17,17,30,0,0);
		// c
	}

	if ( charset == 6 ) {
		add_font_char(99,0,31,2,2,2,2,2,0,0);
		// Hebrew dalet
	} else if ( charset == 7 ) {
		add_font_char(99,0,0,18,18,18,18,31,1,0);
		// Cyrillic tse
	} else {
		add_font_char(99,0,0,15,16,16,16,15,0,0);
		// d
	}

	if ( charset == 6 ) {
		add_font_char(100,0,31,1,1,17,17,17,0,0);
		// Hebrew he
	} else if ( charset == 7 ) {
		add_font_char(100,0,0,6,10,10,10,31,17,0);
		// Cyrillic de
	} else {
		add_font_char(100,1,1,15,17,17,17,15,0,0);
		// e
	}

	if ( charset == 6 ) {
		add_font_char(101,0,12,4,4,4,4,4,0,0);
		// Hebrew vav
	} else if ( charset == 7 ) {
		add_font_char(101,0,0,14,17,31,16,14,0,0);
		// Cyrillic ye
	} else {
		add_font_char(101,0,0,14,17,31,16,14,0,0);
		// f
	}

	if ( charset == 6 ) {
		add_font_char(102,0,14,4,8,4,4,4,0,0);
		// Hebrew zayin
	} else if ( charset == 7 ) {
		add_font_char(102,0,4,14,21,21,21,14,4,0);
		// Cyrillic ef
	} else {
		add_font_char(102,2,4,4,14,4,4,4,0,0);
		// g
	}

	if ( charset == 6 ) {
		add_font_char(103,0,31,17,17,17,17,17,0,0);
		// Hebrew het
	} else if ( charset == 7 ) {
		add_font_char(103,0,0,31,16,16,16,16,0,0);
		// Cyrillic ge
	} else {
		add_font_char(103,0,0,15,17,17,17,15,1,14);
		// h
	}

	if ( charset == 6 ) {
		add_font_char(104,0,17,19,21,17,17,31,0,0);
		// Hebrew tet
	} else if ( charset == 7 ) {
		add_font_char(104,0,0,17,10,4,10,17,0,0);
		// Cyrillic kha
	} else {
		add_font_char(104,16,16,30,17,17,17,17,0,0);
		// i
	}

	if ( charset == 6 ) {
		add_font_char(105,0,12,4,0,0,0,0,0,0);
		// Hebrew yod
	} else if ( charset == 7 ) {
		add_font_char(105,0,0,17,19,21,25,17,0,0);
		// Cyrillic i
	} else {
		add_font_char(105,4,0,12,4,4,4,14,0,0);
		// i
	}

	if ( charset == 0 ) { add_font_char(106,4,0,4,4,4,4,4,4,8); }
	if ( charset == 3 ) { add_font_char(106,4,0,4,4,4,4,4,4,8); }
	if ( charset == 4 ) { add_font_char(106,4,0,4,4,4,4,4,4,8); }
	if ( charset == 5 ) { add_font_char(106,4,0,4,4,4,4,4,4,8); }
	if ( charset == 1 ) { add_font_char(106,4,0,12,4,4,4,4,4,8); }
	if ( charset == 2 ) { add_font_char(106,4,0,12,4,4,4,4,4,8); }
		// j
	if ( charset == 6 ) { add_font_char(106,0,31,1,1,1,1,1,1,0); }
		// Hebrew final khaf
	if ( charset == 7 ) { add_font_char(106,0,4,17,19,21,25,17,0,0); }
		// Cyrillic short i

	if ( charset == 6 ) {
		add_font_char(107,0,31,1,1,1,1,31,0,0);
		// Hebrew khaf
	} else if ( charset == 7 ) {
		add_font_char(107,0,0,17,18,28,18,17,0,0);
		// Cyrillic ka
	} else {
		add_font_char(107,8,8,9,10,12,10,9,0,0);
		// k
	}

	if ( charset == 6 ) {
		add_font_char(108,16,31,1,1,1,2,12,0,0);
		// Hebrew lamed
	} else if ( charset == 7 ) {
		add_font_char(108,0,0,7,9,9,9,25,0,0);
		// Cyrillic el
	} else {
		add_font_char(108,12,4,4,4,4,4,14,0,0);
		// l
	}

	if ( charset == 6 ) {
		add_font_char(109,0,31,17,17,17,17,31,0,0);
		// Hebrew final mem
	} else if ( charset == 7 ) {
		add_font_char(109,0,0,17,27,21,17,17,0,0);
		// Cyrillic em
	} else {
		add_font_char(109,0,0,26,21,21,21,21,0,0);
		// m
	}

	if ( charset == 6 ) {
		add_font_char(110,0,22,9,17,17,17,23,0,0);
		// Hebrew mem
	} else if ( charset == 7 ) {
		add_font_char(110,0,0,17,17,31,17,17,0,0);
		// Cyrillic en
	} else {
		add_font_char(110,0,0,30,17,17,17,17,0,0);
		// n
	}

	if ( charset == 6 ) {
		add_font_char(111,0,12,4,4,4,4,4,4,4);
		// Hebrew final noun
	} else if ( charset == 7 ) {
		add_font_char(111,0,0,14,17,17,17,14,0,0);
		// Cyrillic o
	} else {
		add_font_char(111,0,0,14,17,17,17,14,0,0);
		// o
	}

	if ( charset == 6 ) {
		add_font_char(112,0,6,2,2,2,2,14,0,0);
		// Hebrew noun
	} else if ( charset == 7 ) {
		add_font_char(112,0,0,31,17,17,17,17,0,0);
		// Cyrillic pe
	} else {
		add_font_char(112,0,0,30,17,17,17,30,16,16);
		// p
	}

	if ( charset == 6 ) {
		add_font_char(113,0,31,9,17,17,17,14,0,0);
		// Hebrew samekh
	} else if ( charset == 7 ) {
		add_font_char(113,0,0,15,17,15,5,25,0,0);
		// Cyrillic ya
	} else {
		add_font_char(113,0,0,15,17,17,17,15,1,1);
		// q
	}

	if ( charset == 6 ) {
		add_font_char(114,0,9,9,9,9,10,28,0,0);
		// Hebrew ayin
	} else if ( charset == 7 ) {
		add_font_char(114,0,0,30,17,17,17,30,16,16);
		// Cyrillic er
	} else {
		add_font_char(114,0,0,11,12,8,8,8,0,0);
		// r
	}

	if ( charset == 6 ) {
		add_font_char(115,0,31,9,13,1,1,1,1,0);
		// Hebrew final fe/pe
	} else if ( charset == 7 ) {
		add_font_char(115,0,0,14,17,16,17,14,0,0);
		// Cyrillic es
	} else {
		add_font_char(115,0,0,15,16,14,1,30,0,0);
		// s
	}

	if ( charset == 0 ) { add_font_char(116,4,4,14,4,4,4,2,0,0); }
	if ( charset == 3 ) { add_font_char(116,4,4,14,4,4,4,2,0,0); }
	if ( charset == 4 ) { add_font_char(116,4,4,14,4,4,4,2,0,0); }
	if ( charset == 5 ) { add_font_char(116,4,4,14,4,4,4,2,0,0); }
	if ( charset == 1 ) { add_font_char(116,0,4,14,4,4,4,2,0,0); }
	if ( charset == 2 ) { add_font_char(116,0,4,14,4,4,4,2,0,0); }
		// t
	if ( charset == 6 ) { add_font_char(116,0,31,9,13,1,1,31,0,0); }
		// Hebrew fe/pe
	if ( charset == 7 ) { add_font_char(116,0,0,31,4,4,4,4,0,0); }
		// Cyrillic te

	if ( charset == 6 ) {
		add_font_char(117,0,25,10,12,8,8,8,8,0);
		// Hebrew final tzade
	} else if ( charset == 7 ) {
		add_font_char(117,0,0,17,17,17,17,15,1,14);
		// Cyrillic u
	} else {
		add_font_char(117,0,0,17,17,17,17,15,0,0);
		// u
	}

	if ( charset == 6 ) {
		add_font_char(118,0,17,17,10,4,2,31,0,0);
		// Hebrew tzade
	} else if ( charset == 7 ) {
		add_font_char(118,0,0,21,21,14,21,21,0,0);
		// Cyrillic zhe
	} else {
		add_font_char(118,0,0,17,17,10,10,4,0,0);
		// v
	}

	if ( charset == 6 ) {
		add_font_char(119,0,31,1,9,9,10,8,8,0);
		// Hebrew qof
	} else if ( charset == 7 ) {
		add_font_char(119,0,0,30,17,30,17,30,0,0);
		// Cyrillic ve
	} else {
		add_font_char(119,0,0,17,17,21,21,10,0,0);
		// w
	}

	if ( charset == 6 ) {
		add_font_char(120,0,31,1,1,1,1,1,0,0);
		// Hebrew resh
	} else if ( charset == 7 ) {
		add_font_char(120,0,0,16,16,30,17,30,0,0);
		// Cyrillic soft sign (yeri)
	} else {
		add_font_char(120,0,0,17,10,4,10,17,0,0);
		// x
	}

	if ( charset == 6 ) {
		add_font_char(121,0,21,21,21,25,17,30,0,0);
		// Hebrew shin
	} else if ( charset == 7 ) {
		add_font_char(121,0,0,24,8,14,9,14,0,0);
		// Cyrillic hard sign (yer)
	} else {
		add_font_char(121,0,0,17,17,17,17,15,1,14);
		// y
	}

	if ( charset == 6 ) {
		add_font_char(122,0,15,9,9,9,9,25,0,0);
		// Hebrew tav
	} else if ( charset == 7 ) {
		add_font_char(122,0,0,14,17,6,17,14,0,0);
		// Cyrillic ze
	} else {
		add_font_char(122,0,0,31,2,4,8,31,0,0);
		// z
	}

	if ( charset == 0 ) { add_font_char(123,8,8,8,8,9,3,5,7,1); }
		// one quarter
	if ( charset == 1 ) { add_font_char(123,10,0,14,1,15,17,15,0,0); }
	if ( charset == 2 ) { add_font_char(123,10,0,14,1,15,17,15,0,0); }
		// lowercase a with umlaut
	if ( charset == 3 ) { add_font_char(123,8,4,14,1,15,17,15,0,0); }
		// lowercase a with grave accent
	if ( charset == 4 ) { add_font_char(123,4,10,14,1,15,17,15,0,0); }
		// lowercase a with circumflex
	if ( charset == 5 ) { add_font_char(123,3,4,4,8,4,4,3,0,0); }
		// open curly bracket
	if ( charset == 6 ) { add_font_char(123,0,0,21,21,14,0,0,0,0); }
		// old Israeli shekel symbol (in circulation between 1980-5!)
	if ( charset == 7 ) { add_font_char(123,0,0,21,21,21,21,31,0,0); }
		// Cyrillic sha

	if ( charset == 0 ) { add_font_char(124,10,10,10,10,10,10,10,0,0); }
	if ( charset == 6 ) { add_font_char(124,10,10,10,10,10,10,10,0,0); }
		// double bar
	if ( charset == 1 ) { add_font_char(124,0,10,0,14,17,17,14,0,0); }
	if ( charset == 2 ) { add_font_char(124,0,10,0,14,17,17,14,0,0); }
		// lowercase o with umlaut
	if ( charset == 3 ) { add_font_char(124,8,4,0,14,17,17,14,0,0); }
		// lowercase o with grave accent
	if ( charset == 4 ) { add_font_char(124,4,10,14,17,17,17,14,0,0); }
		// lowercase o with circumflex
	if ( charset == 5 ) { add_font_char(124,4,4,4,0,4,4,4,0,0); }
		// broken bar
	if ( charset == 7 ) { add_font_char(124,0,0,12,18,6,18,12,0,0); }
		// Cyrillic e

	if ( charset == 0 ) { add_font_char(125,24,4,24,4,25,3,5,7,1); }
	if ( charset == 6 ) { add_font_char(125,24,4,24,4,25,3,5,7,1); }
		// three quarters
	if ( charset == 1 ) { add_font_char(125,0,10,0,17,17,17,15,0,0); }
		// lowercase u with umlaut
	if ( charset == 2 ) { add_font_char(125,4,0,14,1,15,17,15,0,0); }
		// lowercase a with ring
	if ( charset == 3 ) { add_font_char(125,8,4,14,17,31,16,14,0,0); }
		// lowercase e with grave accent
	if ( charset == 4 ) { add_font_char(125,4,10,0,17,17,17,15,0,0); }
		// lowercase u with circumflex
	if ( charset == 5 ) { add_font_char(125,24,4,4,2,4,4,24,0,0); }
		// close curly bracket
	if ( charset == 7 ) { add_font_char(125,0,0,21,21,21,21,31,1,0); }
		// Cyrillic shcha

	if ( charset == 0 ) { add_font_char(126,0,4,0,31,0,4,0,0,0); }
	if ( charset == 6 ) { add_font_char(126,0,4,0,31,0,4,0,0,0); }
		// division
	if ( charset == 1 ) { add_font_char(126,12,18,18,22,17,17,22,16,16); }
		// eszet
	if ( charset == 2 ) { add_font_char(126,0,10,0,17,17,17,15,0,0); }
		// lowercase u with umlaut
	if ( charset == 3 ) { add_font_char(126,8,4,0,12,4,4,14,0,0); }
		// lowercase i with grave accent
	if ( charset == 4 ) { add_font_char(126,0,0,15,16,16,16,15,2,6); }
		// lowercase c with cedilla
	if ( charset == 5 ) { add_font_char(126,8,21,2,0,0,0,0,0,0); }
		// tilde
	if ( charset == 7 ) { add_font_char(126,0,0,17,17,17,15,1,0,0); }
		// Cyrillic che

	add_font_char(127,31,31,31,31,31,31,31,31,0);
		// block
}


//////////////////
///// KEYMAP /////
//////////////////

// This is just a simple way of handling keypresses from other locales.
// If the incoming keypress code belongs to one of the variant characters
// associated with the character set we're using, we convert it to its
// correct teletext character set code.

var keymap = function(keypress, dead_key) {

	// The Hebrew character set (6) is identical to the English (0)
	// one outside of the range 0x60..0x7b.

	// English: pound sign
	if ( cset == 0 && keypress == 163 ) { return 0x23; }
	if ( cset == 6 && keypress == 163 ) { return 0x23; }

	// English: hash
	if ( cset == 0 && keypress == 35 ) { return 0x5f; }
	if ( cset == 6 && keypress == 35 ) { return 0x5f; }

	// English: long dash (underscore)
	if ( cset == 0 && keypress == 95 ) { return 0x60; }
	if ( cset == 6 && keypress == 95 ) { return 0x60; }

  // The Swedish character set (2) is identical to the German (1)
	// for A and O with umlauts.

	// German: capital A with umlaut
	if ( cset == 1 && keypress == 196 ) { return 0x5b; }
	if ( cset == 2 && keypress == 196 ) { return 0x5b; }

	// German: lowercase a with umlaut
	if ( cset == 1 && keypress == 228 ) { return 0x7b; }
  if ( cset == 2 && keypress == 228 ) { return 0x7b; }

	// German: capital O with umlaut
	if ( cset == 1 && keypress == 214 ) { return 0x5c; }
	if ( cset == 2 && keypress == 214 ) { return 0x5c; }

	// German: lowercase o with umlaut
	if ( cset == 1 && keypress == 246 ) { return 0x7c; }
  if ( cset == 2 && keypress == 246 ) { return 0x7c; }

	// German: capital U with umlaut
	if ( cset == 1 && keypress == 220 ) { return 0x5d; }

	// German: lowercase u with umlaut
	if ( cset == 1 && keypress == 252 ) { return 0x7d; }

	// German: Eszett
	if ( cset == 1 && keypress == 223 ) { return 0x7e; }

	// German: section sign
	if ( cset == 1 && keypress == 167 ) { return 0x40; }

	// German: degree symbol
	if ( cset == 1 && keypress == 176 ) { return 0x60; }

  // Swedish: capital A with ring
	if ( cset == 2 && keypress == 197 ) { return 0x5d; }

	// Swedish: lowercase a with ring
	if ( cset == 2 && keypress == 229 ) { return 0x7d; }

  // Swedish: capital U with umlaut (if entered on German keyboard)
  if ( cset == 2 && keypress == 220 ) { return 0x5e; }

  // Swedish: lowercase u with umlaut (if entered on German keyboard)
  if ( cset == 2 && keypress == 220 ) { return 0x7e; }

  // Swedish keyboards has no assigned keys for ü and é
  // Swedish: capital U with umlaut
	if ( cset == 2 && keypress == 85 && dead_key == 221 ) { return 0x5e; }

	// Swedish: lowercase u with umlaut
	if ( cset == 2 && keypress == 117 && dead_key == 221 ) { return 0x7e; }

  // Swedish: capital E with accent
  if ( cset == 2 && keypress == 69 && dead_key == 187 ) { return 0x40; }

  // Swedish: lowercase e with accent
  if ( cset == 2 && keypress == 101 && dead_key == 187 ) { return 0x60; }

	// The Hebrew alphabet.
	if ( cset == 6 && keypress >= 1488 && keypress <= 1514) {
		return 0x60 + ( keypress - 1488 );
		}

	// There is no modern keyboard equivalent for the Israeli old
	// shekel symbol, which fell out of general use in when the
	// Israeli new shekel was introduced on 1 January 1986. The
	// Israeli new shekel symbol is not in the teletext character
	// set. When the new shekel symbol is entered, the old one
	// will come out in the editor.
	if ( cset == 6 && keypress == 8362 ) {
		return 0x7b;
		}


	return keypress;
}

///////////////////////
///// HELP SCREEN /////
///////////////////////

// Displays a help screen instead of the current frame, in case the
// editor isn't being shown with a table of hints. Translations are very
// welcome. If you are a native speaker of another language and can help
// please raise a bug.

var draw_help_screen = function() {

	var columns = [
		[["r", "red text"],            ["R", "red graphics"]],
		[["g", "green text"],          ["G", "green graphics"]],
		[["y", "yellow text"],         ["Y", "yellow graphics"]],
		[["b", "blue text"],           ["B", "blue graphics"]],
		[["m", "magenta text"],        ["M", "magenta graphics"]],
		[["c", "cyan text"],           ["C", "cyan graphics"]],
		[["w", "white text"],          ["W", "white graphics"]],
		[["a", "ignore black fg"],     ["A", "allow black fg"]],
		[["k", "black text"],          ["K", "black graphics"]],
		[["d", "normal height"],       ["D", "double height"]],
		[["f", "steady"],              ["F", "flash"]],
		[["h", "release graphics"],    ["H", "hold graphics"]],
		[["i", "insert row"],          ["I", "delete row"]],
		[["n", "black background"],    ["N", "new background"]],
		[["Q", "toggle codes"],        ["9", "toggle metadata"]],
		[["s", "contiguous graphics"], ["S", "separated graphics"]],
		[["z", "redraw screen"],       ["Z", "clear screen"]],
		[["<", "narrower screen"],     [">", "wider screen"]],
		[["O", "conceal"],             ["-", "toggle reveal"]],
		[["U", "duplicate row"],       ["X", "toggle grid"]],
		[["E", "export frame"],        ["J", "insert block character"]],
		[["&", "cycle char sets"],     ["0", "hide status bar"]],
		[["=", "trace image"],         ["(block) WASD", "shift sixels"]],
		[["(block) X", "copy block"],  ["(block) V", "paste block"]]
	];
	var footnotes = [
		"To select a block, use the cursor keys in escape mode.",
		"TAB inserts a space. Backspace deletes a character. (No escape required).",
		"In graphics mode, QWASZXRCF and the keypad twiddle subpixels.",
		"Licenced under GPL v3.0, https://github.com/rawles/edit.tf"
	];

	var c = document.getElementById(canvasid);
	var ctx = c.getContext("2d");

	ctx.font = (13*pix_scale)+"px Arial";
	ctx.fillStyle = "#ccc";

	ctx.textAlign = "center";
	ctx.fillText("First press escape then the following:",
		240*pix_scale, 16*1*pix_scale);

	for ( var i = 0; i < columns.length; i++ ) {
		ctx.fillStyle = "#fff";
		ctx.textAlign = "right";
		ctx.fillText(columns[i][0][0], 90*pix_scale,
			(16*(3+i))*pix_scale);
		ctx.fillText(columns[i][1][0], 290*pix_scale,
			(16*(3+i))*pix_scale);
		ctx.fillStyle = "#ccc";
		ctx.textAlign = "left";
		ctx.fillText(columns[i][0][1], 100*pix_scale,
			(16*(3+i))*pix_scale);
		ctx.fillText(columns[i][1][1], 300*pix_scale,
			(16*(3+i))*pix_scale);
	}

	ctx.fillStyle = "#ccc";
	ctx.textAlign = "center";
	for ( var i = 0; i < 4; i++ ) {
		ctx.fillText(footnotes[i], 240*pix_scale,
			(16*(28+i))*pix_scale);
	}
}

// Like the status bar, the help screen only appears until something else
// happens.
var show_help_screen = function() {
	if ( helpscreenshown != 1 ) {
		helpscreenshown = 1;

		init_canvas();
		draw_help_screen();
		draw_status_bar();
	}
}

var hide_help_screen = function() {
	if ( helpscreenshown == 1 ) {
		helpscreenshown = 0;

		init_canvas();
		render(0,0,40,25,0);
		draw_status_bar();
	}
}


////////////////////////////
///// HELPER FUNCTIONS /////
////////////////////////////

// Sometimes it's necessary to pad a string by prepending characters
// to it, most commonly because we want to add leading zeroes to a
// displayed number. That's what this function does.
var padstring = function(char, width, string) {
	var output = string;
	while ( output.length < width ) { output = char + output; }
	return output;
}

// Test whether the editor screen is all spaces.
this.is_all_spaces = function() {
	for (var r = 0; r <= 24; r++) {
		for (var c = 0; c < 40; c++) {
			if ( cc[r][c] !== 32 ) {
				return false;
			}
		}
	}
	return true;
}

var is_rectangle_select = function() { 
	var rectangle_select = 0;
	if ( curx_opposite != -1 && cury_opposite != -1
		&& ( curx_opposite != curx
			|| cury_opposite != cury ) ) {
		rectangle_select = 1;
	}
	return rectangle_select;
}

//////////////////////////
///// INITIALISATION /////
//////////////////////////

this.init_frame = function(id) {
	canvasid = id;

	// Set up the screen and render it.
	init_state();
	render(0, 0, 40, 25, 0);

	// Set up listeners for events
	init_mouse();
	document.onkeypress = page_keypress;
	document.onkeydown = page_keydown;
}

} // end of Editor

// This function is called by clicking on some cells of the key sequences
// table. It just sends an escape keypress and then the character in the
// argument.
var fakepress = function(character) {
	if ( active_editor == null ) { return; }

	active_editor.set_escape(1);
	event = new Object;
	event["charCode"] = character.charCodeAt(0);
	page_keypress(event);
}

var page_keypress = function(event) {
	if ( active_editor == null ) { return; }
	active_editor.keypress(event);
}

var page_keydown = function(event) {
	if ( active_editor == null ) { return; }
	active_editor.keydown(event);
}
