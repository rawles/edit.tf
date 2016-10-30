#!/usr/bin/perl

#   url2raw.pl, a script to convert teletext editor URLs to raw frames
#   Copyright (C) 2015, Simon Rawles

#   This program is free software: you can redistribute it and/or modify
#   it under the terms of the GNU General Public License as published by
#   the Free Software Foundation, either version 3 of the License, or
#   (at your option) any later version.

#   This program is distributed in the hope that it will be useful,
#   but WITHOUT ANY WARRANTY; without even the implied warranty of
#   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#   GNU General Public License for more details.

#   You should have received a copy of the GNU General Public License
#   along with this program.  If not, see <http://www.gnu.org/licenses/>.

# Input (on standard input):
#   The portion of the editor URL after the initial hash (#) symbol. If
#   a hash is found in the input, everything up to and including the
#   first hash is trimmed. Note that if you are sending the URL in using
#   a shell command, you may need to escape the hash symbol (\#) or 
#   enclose the URL in quotes, &c.

# Output (on standard output):
#   The characters of the teletext frame, with lines delimited by UNIX
#   newline characters (\n). The characters' codes will range between 0 and
#   127 inclusive. If $sethighbit is non-zero, those codes less than 32 will
#   have their high bits set (equivalently, incremented by 128) before
#   output.

# The alphabet of symbols in the encoding.
my $alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

# If non-zero, sets the high bit on characters with a code of less than 32.
my $sethighbit = 1;

# Read the URL from standard input, chomping the end-of-line if needed.
my $url = <STDIN>;
chomp($url);

# If the URL contains a hash, remove everything up to and including it.
if ( $url =~ /#/ ) { $url =~ s/^[^#]*#(.*)$/$1/; } 
# We don't actually need the nybble describing regional differences,
# since the output is agnostic to it.
$url =~ s/^[0-9a-fA-F]:(.*)$/$1/;

if ( length($url) != 1120 && length($url) != 1167 ) {
	die "The encoded frame should be exactly 1120 or 1167 characters in length";
} 

# Compute the characters in the output frame, bit-by-bit.
my @cc = ();
for ( my $i = 0; $i < length($url); $i++ ) { 
	my $val = index($alphabet, substr($url, $i, 1));
	if ( $val == -1 ) { 
		die "The encoded character at position $i should be one from the alphabet";
	}
	for ( my $b = 0; $b < 6; $b++ ) { 
		my $bit = $val & ( 1 << ( 5 - $b ));
		if ( $bit > 0 ) { 
			my $cbit = ($i*6) + $b;
			my $cpos = $cbit % 7;
			my $cloc = ($cbit-$cpos)/7;
			$cc[$cloc] |= 1 << ( 6 - $cpos);
		}
	}
}

my $numlines = 25;
if ( length($url) == 1120 ) { $numlines = 24; } 

# Output the frame.
for ( my $y = 0; $y < $numlines; $y++ ) { 
	for ( my $x = 0; $x < 40; $x++ ) { 
		# Set the high bit if needed.
		if ( $sethighbit != 0 && $cc[$y*40+$x] < 32 ) {
			$cc[$y*40+$x] |= 128;
		} 
		print chr($cc[$y*40+$x]);
	}
	print "\n";
}
