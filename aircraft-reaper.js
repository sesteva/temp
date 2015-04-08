/* Remove quasi-stale data */

var Firebase = require('firebase');
var GeoFire = require('geofire');


var firebusRef = new Firebase('https://nextaircraft-dev.firebaseio.com/');
var updateInterval = 200;
var reapAge = 400;
var agencyList = [ 'dfw' ];

// This method removes old node entries based on attribute ts
function reap() {
  var runTs = Date.now() / 1000;
  agencyList.forEach(function(item) {
    firebusRef.child(item).once('value', function(s) {
       s.forEach(function(busSnap) {
         var age = runTs - busSnap.val().timestamp;
	 if(age > reapAge) {
           busSnap.ref().remove();
           //geofire remove
	 }
       });
    });
  });
}

reap();

setInterval((function() {
  reap();
}), updateInterval);
