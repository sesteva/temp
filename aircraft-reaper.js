/* Remove quasi-stale data */

var Firebase = require('firebase');
var GeoFire = require('geofire');

var firebaseRef = new Firebase('https://nextaircraft-dev.firebaseio.com/');
var geoFire = new GeoFire(firebaseRef.child("_geofire"));
var updateInterval = 200;
var reapAge = 400; // 6 mins. We want to avoid flashing elements
var locations = ['DFW'];

// This method removes old node entries based on attribute timestamp
function reap() {
    var runTs = Date.now() / 1000;
    locations.forEach(function (item) {
        firebaseRef.child(item).once('value', function (s) {
            s.forEach(function (aircraftSnapshot) {
                var age = runTs - aircraftSnapshot.val().timestamp;
                if (age > reapAge) {
                    var geoKey = aircraftSnapshot.val().geoKey;
                    aircraftSnapshot.ref().remove();
                    geoFire.remove(geoKey).then(function() {
                        console.log("Provided key has been removed from GeoFire");
                    }, function(error) {
                        console.log("Error: " + error);
                    });
                }
            });
        });
    });
}

reap();

setInterval((function () {
    reap();
}), updateInterval);
