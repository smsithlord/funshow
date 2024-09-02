# FunShow
FunShow is an tool for creating and viewing interactive slideshows of text, images, & videos.  
It supports using it as an INDIVIDUAL in OFFLINE MODE, or using it as a DEVELOPER deploying it in SERVER MODE.  
For usage help, open index.html and click HELP.  

# Live Demo
https://smsithlord.github.io/funshow/

## Demo VIEWER Getting Started
![Demo Viewer Drag & Drop](https://i.gyazo.com/6c67c34650b7e117cfe52ac843355fff.gif)

## Demo BUILDER Getting Started
![Demo Builder Drag & Drop](https://i.gyazo.com/a120b63649714f034f681276a47e38da.gif)

# VIEWER Compatibility
Tested Working: Edge & Chrome & Firefox on Windows, Chrome on Android, Safari on iPhone

# BUILDER Compatibility
Tested Working: Edge & Chrome on Windows  
Tested NOT Working (drag & drop fails): Firefox on Windows, Brave on Linux

# ALPHA
This is an early version of FunShow & may contain unknown bugs or have missing features. It is functional for my own purposes, but it will evolve as it is adapted for the needs of others & as my own needs from it evolve.

# Developing Changes To The Code
There are `dev_` versions of the following files which will load the SRC scripts instead of the DIST scripts: dev_index.html, dev_builder.html, dev_viewer.html.

# Building New Distribution Files
There is a tool in `src/packer_tool.html` that can be ran from a LOCAL SERVER that lets you BUILD ALL which gives you the following files: funshow-builder.min.js, funshow-shared.min.js, funshow-viewer.min.js.  

**Building & deploying to your own site currently requires creating a custom viewer.html file. (See code comments in dev_viewer.html)** This is because JSON is the only export option in the BUILDER. There are plans to add support for exporting a pre-baked HTML file for developers to deploy unchanged directly to their server, but this is not yet implemented.

# Additional Help
If you actually use this & need help getting it working or fixing bugs, the best way to contact me is finding me on Twitch, Twitter, or Discord.

# License
Released under the MIT License. See LICENSE for details.