/*global chrome*/

"use strict";

//Just an alias to use so we don't forget which document is which.
var contentDoc = document;

// Creates a fully-functional clipper on the current document
// (well, sort of. It's not really clearly-factored at the moment.)
function createClipper(){
  //An iframe to hold the clipper UI.
  var clipsnailFrame = contentDoc.createElement('iframe');
  
  //A little cosmetic junk
  clipsnailFrame.style.border = 'none';
  clipsnailFrame.style.backgroundColor = 'transparent';
  
  //Cover the screen
  clipsnailFrame.style.position = 'fixed';
  clipsnailFrame.style.top = 0;
  clipsnailFrame.style.left = 0;
  clipsnailFrame.style.width = '100%';
  clipsnailFrame.style.height = '100%';
  
  // This is really just paranoia, but we want to be above
  //          *** ABSOLUTELY EVERYTHING. ***
  // If the content document has fixed elements with high z-indexes, well,
  // we just have to use z-indexes that are higher!
  // http://stackoverflow.com/questions/491052/mininum-and-maximum-value-of-z-index
  clipsnailFrame.style.zIndex = 0x7FFFFFFF; // 2147483647
  
  contentDoc.body.appendChild(clipsnailFrame);
  
  var clipsnailDoc = clipsnailFrame.contentDocument;
  
  //Add our stylesheet
  var clipsnailStyle = clipsnailDoc.createElement('link');
  clipsnailStyle.link = 'stylesheet';
  clipsnailStyle.href = chrome.extension.getURL('clipper.css');
  clipsnailDoc.head.appendChild(clipsnailStyle);
  
  return clipsnailFrame;
}

var clipsnailFrame = createClipper();

var clipsnailDoc = clipsnailFrame.contentDocument;

var targetHighlight = clipsnailDoc.createElement('div');
targetHighlight.style.borderColor = 'rgba(0,0,0,0.1)';
targetHighlight.style.position = "absolute";
targetHighlight.style.top = 0;
targetHighlight.style.left = 0;
targetHighlight.style.height = 0;
targetHighlight.style.width = window.innerWidth;
targetHighlight.style.borderBottomWidth = window.innerHeight;


function createClipContext() {
  return clipsnailDoc.createElement('iframe');
}

var clipFrame = createClipContext();
var clipDoc = clipFrame.contentDocument;

// Since the cursor position isn't available when the mouse isn't moving, but
// the window can still be scrolled (changing the element that's underneath
// the cursor), we cache the cursor position.

var cursorX, cursorY;

//If our last recieved mouseevent

function getDocElementFromPoint(x,y) {
  
  // I doubt the clipsnailFrame's visibility would be anything other than 
  // 'visible' (or more specifically ''), but proper force-temporary-state
  // behavior dictates we save and restore the initial state.
  var origvisib = clipsnailFrame.style.visibility;
  
  // Momentarily hide the clipper frame so getting the element under the cursor
  // doesn't just return this iframe
  clipsnailFrame.style.visibility = 'hidden';
  
  // Get the document element at the position of the passed mouse event.
  var elem = contentDoc.elementFromPoint(x, y);
  
  // Restore original clipsnailFrame visibility before the render thread
  // notices it ever changed in the first place.
  clipsnailFrame.style.visibility = origvisib;
  
  // Return the element
  return elem;
}

// This should be implemented as a shared function between the site and the
// clipper (or better, a node_module / bower_component), but for now, whatevs,
// I'll just copy it back and forth.
// We sanitize the element on the client only so so there are no surprises to
// the user after the server runs the sanitization step as well.
function sanitizeElement(elem) {
  elem.getElementsByTagName('a').forEach(function(anchor){
    anchor.rel = 'nofollow';
    anchor.target ='_blank';
  });
}

function encapsulateElement(elem) {
  elem.getElementsByTagName('iframe').forEach(function(ifr){
    ifr.srcdoc = ifr.contentDocument.documentElement.outerHTML;
  });
  // if this element is statically positioned, all non-statically positioned
  // child elements need to be re-oriented to be relative to this ancestor
  // (or maybe, if they're out of bounds, just scrapped?)
  // Could it be handled by making a non-statically-positioned wrapper?
  // This is probably a problem that can be tackled later (clipping static
  // elements with non-static children is an edge case)
}

function addElementToClip(elem) {
  
}

function changeTarget(elem) {
  var scrollTop = elem.offsetTop - window.scrollY;
  var scrollLeft = elem.offsetLeft - window.scrollX;
  var scrollBottom = scrollTop + elem.offsetHeight;
  var scrollRight = scrollBottom + elem.offsetWidth;
  targetHighlight.style.height = elem.offsetHeight;
  targetHighlight.style.width = elem.offsetWidth;
  targetHighlight.style.borderTopWidth = scrollTop;
  targetHighlight.style.borderLeftWidth = scrollLeft;
  targetHighlight.style.borderBottomWidth = window.innerHeight - scrollBottom;
  targetHighlight.style.borderRightWidth = window.innerWidth - scrollRight;
}

function clipClick(evt) {


}

function compileClip(){
  //NOTE: Not handling multi-element compilation
  var stylelem = clipDoc.createElement('style');
  
}

function onMousemove(evt) {
  cursorX = evt.clientX;
  cursorY = evt.clientY;
  changeTarget(getDocElementFromPoint(cursorX, cursorY));
}

function onClick(evt) {
  // While multi-element would be awesome,
  // right now let's just aim for feature parity
  // and start clipping from a single element.
}

function onResize(evt) {
  // realistically, what are the odds that the cursor's still in the window
  // as it's resizing? let's just assume there's no target for now, and we can
  // revisit more complex repositioning when it comes to displaying multiple
  // elements
  targetHighlight.style.height = 0;
  targetHighlight.style.width = 0;
  targetHighlight.style.borderTopWidth = cursorY;
  targetHighlight.style.borderLeftWidth = cursorX;
  targetHighlight.style.borderBottomWidth = window.innerHeight - cursorY;
  targetHighlight.style.borderRightWidth = window.innerWidth - cursorX;
}

function onScroll(evt) {
  changeTarget(getDocElementFromPoint(cursorX, cursorY));
}

function onMouseout(evt) {
  // if the cursor actually left the frame and didn't just change children
  if(!evt.relatedTarget) {
    cursorX = evt.clientX;
    cursorY = evt.clientY;
    targetHighlight.style.height = 0;
    targetHighlight.style.width = 0;
    targetHighlight.style.borderTopWidth = cursorY;
    targetHighlight.style.borderLeftWidth = cursorX;
    targetHighlight.style.borderBottomWidth = window.innerHeight - cursorY;
    targetHighlight.style.borderRightWidth = window.innerWidth - cursorX;
  }
}

clipsnailDoc.body.addEventListener('mousemove',onMousemove);
clipsnailDoc.body.addEventListener('mouseout',onMouseout);
clipsnailDoc.body.addEventListener('click',onClick);
window.addEventListener('scroll',onScroll);
