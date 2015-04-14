var Firebase = require('firebase');
var GeoFire = require('geofire');
var xml2js = require('xml2js');
var rest = require('restler');
var fs = require('fs');
var _ = require('lodash');
var RSVP = require('rsvp');
var Client = require('./ws-sandbox').Client;
var sandbox = new Client();

// Dev Env
//var firebaseRef = new Firebase('https://nextaircraft-dev.firebaseio.com/');
var firebaseRef = new Firebase("https://geoaircraft.firebaseio.com/")

var geoFire = new GeoFire(firebaseRef.child("_geofire"));

var lastTime = Date.now() - 3600000;
var updateInterval = 5000;

var location = 'DFW'; //or KDFW

function getMockedData(){
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

function getData(){
    var promise = new RSVP.Promise(function(resolve, reject) {
        var parseString = require('xml2js').parseString;
        sandbox.createClient().then(function(){
            sandbox.login().then(function(){
                sandbox.getFlightsByAirport().then(function(data){
                    parseString(data.GetAirportFlightInfoInXMLResult, function (err, result) {
                        if (err) console.log(err);
                        resolve(result);
                    });
                })
            })
        })
    });
    return promise;
}

function createAircraft(data){
    var aircraft = data['$'];

    if (aircraft && aircraft.tag) {
        aircraft.origin = aircraft.origin.trim();
        aircraft.destination = aircraft.destination.trim();
        aircraft.id =  aircraft.tag + aircraft.origin + aircraft.destination;
        aircraft.lat = parseFloat(aircraft.lat);
        aircraft.lon = parseFloat(aircraft.lon);
        aircraft.geoKey = location + ':' + aircraft.id;
        aircraft.timestamp = new Date(aircraft.lastUpdate).getTime();
        aircraft.inbound = (aircraft.origin && aircraft.origin.indexOf(location) > -1) ? false : true;

        // animation testing purposes
        //aircraft.lat = aircraft.lat + (Math.floor(Math.random()*10)/1000);
        //save model to firebase
        firebaseRef.child(location).child(aircraft.id).set(aircraft);
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
        if (result && result.airport && result.airport.aircraft) {
            _.forEach(result.airport.aircraft, createAircraft);
        }
    }, function(err){
        console.log(err);
    })
}

setInterval((function () {
    updateFirebase();
}), updateInterval);
