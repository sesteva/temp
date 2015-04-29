/* Remove quasi-stale data */

var Firebase = require('firebase');
var GeoFire = require('geofire');
var RSVP = require('rsvp');

// Dev Env
//var firebaseRef = new Firebase('https://nextaircraft-dev.firebaseio.com/');
var firebaseRef = new Firebase("https://geoaircraft.firebaseio.com/")
var geoFire = new GeoFire(firebaseRef.child("_geofire"));
var updateInterval = 200;
var reapAge = 400; // 6 mins. We want to avoid flashing elements
//var locations = ['DFW'];

// This method removes old node entries based on attribute timestamp
function reap() {
    var promise = new RSVP.Promise(function(resolve, reject) {
        var runTs = Date.now() / 1000;
        //console.log(runTs);
        firebaseRef.child('DFW').once('value', function (s) {
            s.forEach(function (aircraftSnapshot) {
                var age = runTs - aircraftSnapshot.val().timestamp;
                //console.log(age);
                if (age > reapAge) {
                    var geoKey = aircraftSnapshot.val().geoKey;
                    aircraftSnapshot.ref().remove();
                    geoFire.remove(geoKey).then(function() {
                        return console.log("Provided key has been removed from GeoFire");
                    }, function(error) {
                        return console.log("Error: " + error);
                    });
                }
            });
            //console.log(new Date());
            return resolve();
        });
    });
    return promise;
}

function start(){
    return reap().then(function(){
        return start();
    },function(err){
        console.log(err);
    })
}

start();
