var Firebase = require('firebase');
var GeoFire = require('geofire');
var xml2js = require('xml2js');
var rest = require('restler');
var fs = require('fs');
var _ = require('lodash');
var RSVP = require('rsvp');

var firebusRef = new Firebase('https://nextaircraft-dev.firebaseio.com/');
var geoFire = new GeoFire(firebusRef.child("_geofire"));

var lastTime = Date.now() - 3600000;
var updateInterval = 5000;

var location = 'DFW';

function getData(){
    var promise = new RSVP.Promise(function(resolve, reject) {
        var parseString = require('xml2js').parseString;
        fs.readFile('mock.xml', 'utf8', function (err,data) {
            if (err) {
                console.log(err);
                reject(err);
            }
            parseString(data, function (err, result) {
                resolve(result);
            });
        });
    });
    return promise;
}

function createAircraft(data){
    var aircraft = data['$'];

    if (aircraft && aircraft.id) {
        aircraft.id = parseInt(aircraft.id);
        aircraft.lat = parseInt(aircraft.lat);
        aircraft.lon = parseInt(aircraft.lon);
        aircraft.geoKey = location + ':' + aircraft.id;
        aircraft.timestamp = (Date.now() / 1000) - aircraft.secsSinceReport;
        aircraft.inbound = (aircraft.origin && aircraft.origin.indexOf(location) > -1) ? true : false;

        //save model to firebase
        firebusRef.child(location).child(aircraft.id).set(aircraft);
        //save geohash to firebase
        geoFire.set(aircraft.geoKey, [aircraft.lat, aircraft.lon]);
    }
    else {
        console.log("bad aircraft ->");
        console.log(aircraft);
    }
}

function updateFirebase(){
    getData().then(function(result){
        if (result && result.body && result.body.aircraft) {
            _.forEach(result.body.aircraft, createAircraft);
        }
    }, function(err){
        console.log(err);
    })
}

setInterval((function () {
    updateFirebase();
}), updateInterval);
