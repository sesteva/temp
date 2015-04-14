var Firebase = require('firebase');
var GeoFire = require('geofire');
var fs = require('fs');
var _ = require('lodash');
var RSVP = require('rsvp');
var Client = require('./ws-sandbox').Client;
var sandbox = new Client();
var recieved= 0;
var parsed = 0;
var modeled = 0;
var total = 0;

// Dev Env
//var firebaseRef = new Firebase('https://nextaircraft-dev.firebaseio.com/');
var firebaseRef = new Firebase("https://geoaircraft.firebaseio.com/")

var geoFire = new GeoFire(firebaseRef.child("_geofire"));

var lastTime = Date.now() - 3600000;
var updateInterval = 10000;

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
                    recieved = Date.now() / 1000;
                    parseString(data.GetAirportFlightInfoInXMLResult, function (err, result) {
                        if (err) {
                            console.log(err);
                            reject(err);
                        }
                        console.log('xml parsed');
                        parsed = Date.now() / 1000;
                        resolve(result);
                    });
                })
            })
        })
        //sandbox.tryUntilSuccess(sandbox).then(function(data){
        //    parseString(data.GetAirportFlightInfoInXMLResult, function (err, result) {
        //        if (err) {
        //            console.log(err);
        //            reject(err);
        //        }
        //        console.log('resolved: ' + Date.now());
        //        resolve(result);
        //    });
        //});
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
        //aircraft.timestamp = new Date(aircraft.lastUpdate).getTime();
        aircraft.timestamp = Date.now() / 1000;
        aircraft.inbound = (aircraft.origin && aircraft.origin.indexOf(location) > -1) ? false : true;

        // animation testing purposes
        //aircraft.lat = aircraft.lat + (Math.floor(Math.random()*10)/1000);
        //save model to firebase
        firebaseRef.child(location).child(aircraft.id).set(aircraft);
        //save geohash to firebase
        geoFire.set(aircraft.geoKey, [aircraft.lat, aircraft.lon]);
        modeled = Date.now() / 1000;
    }
    else {
        console.log("bad aircraft ->");
        console.log(aircraft);
    }
}

function updateFirebase(){
    console.log('new cycle')
    getData().then(function(result){
        if (result && result.airport && result.airport.aircraft) {
            console.log('creating models');
            _.forEach(result.airport.aircraft, createAircraft);
            console.log('all posted to firebase');
            total = modeled - recieved;
            console.log('Total: ' + total);
            console.log('Parsing: ' + (parsed - recieved))
            console.log('Modeling: ' + (modeled - parsed));
            console.log('------------');
        }
    }, function(err){
        console.log(err);
    })

}

setInterval((function () {
    updateFirebase();
}), updateInterval);
