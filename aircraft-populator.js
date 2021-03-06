//var heapdump = require('heapdump');
var Firebase = require('firebase');
var GeoFire = require('geofire');
var _ = require('lodash');
var RSVP = require('rsvp');
var Client = require('./ws-sandbox').Client;
var parser = require('libxml-to-js');

var sandbox = new Client();

// Dev Env
var firebaseRef = new Firebase("https://geoaircraft.firebaseio.com/");
var geoFire = new GeoFire(firebaseRef.child("_geofire"));
var location = 'DFW'; //or KDFW

//function getMockedData(){
//    var promise = new RSVP.Promise(function(resolve, reject) {
//        var parseString = require('xml2js').parseString;
//        fs.readFile('mock.xml', 'utf8', function (err,data) {
//            if (err) {
//                console.log(err);
//                return reject(err);
//            }
//            parseString(data, function (err, result) {
//                return resolve(result);
//            });
//        });
//    });
//    return promise;
//}

function getData(){
    var promise = new RSVP.Promise(function(resolve, reject) {
        sandbox.createClient().then(function(){
            sandbox.login().then(function(){
                sandbox.getFlightsByAirport().then(function(data){
                    console.log('parsing data');
                    parser(data.GetAirportFlightInfoInXMLResult, function (err, result) {
                        if (err) {
                            console.log(err);
                            return reject(err);
                        }
                        data = null;
                        return resolve(result);
                    });
                })
            })
        })
    });
    return promise;
}

function createAircraft(data){
    var aircraft = undefined;
    aircraft = data['@'];
    var invalid = aircraft.lat == 200 && aircraft.lon == 200;
    var parked  = aircraft.lat == 32.8968 && aircraft.lon == -97.038;
    if (aircraft && aircraft.tag && !invalid && aircraft.Status != 'Hold' && !parked) {
        var origin = aircraft.origin.trim();
        var destination = aircraft.destination.trim();
        aircraft['origin'] = origin;
        aircraft['destination'] = destination;
        aircraft['id'] =  aircraft.tag + origin + destination;
        aircraft['lat'] = parseFloat(aircraft.lat);
        aircraft['lon'] = parseFloat(aircraft.lon);
        aircraft['geoKey'] = location + ':' + aircraft.id;
        aircraft['timestamp'] = Date.now() / 1000;
        aircraft['inbound'] = (origin && origin.indexOf(location) > -1) ? false : true;

        //save model to firebase
        firebaseRef.child(location).child(aircraft.id).set(aircraft, function(err){
            if(err) console.log('Data could not be saved: ' + err);
        });
        //save geohash to firebase
        geoFire.set(aircraft.geoKey, [aircraft.lat, aircraft.lon]);
        origin = null;
        destination = null;
        aircraft = null;
        data = null;
    } else {
        console.log("bad aircraft ->");
        console.log(aircraft);
    }
}

function updateFirebase(){
    console.log('new cycle:' + new Date());
    getData().then(function (result) {
        if (result && result.aircraft) {
            console.log('inflating models');

            _.forEach(result.aircraft, function(aircraft){
                //console.log(aircraft);
                createAircraft(aircraft);
            });
            console.log('------------');
            result = null;
            return result;
        }
    }, function (err) {
        console.log(err);
        return reject(err);
    });

}

//function start(){
//    return updateFirebase().then(function(){
//        sandbox.fastTrackClient.lastResponse = null;
//        heapdump.writeSnapshot();
        //return start();
    //},function(err){
    //    console.log(err);
    //})
//}

//start();

setInterval((function () {
    updateFirebase();
}), 5000);
//updateFirebase();
