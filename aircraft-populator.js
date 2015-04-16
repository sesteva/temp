//var heapdump = require('heapdump');
var Firebase = require('firebase');
var GeoFire = require('geofire');
var _ = require('lodash');
var RSVP = require('rsvp');
var Client = require('./ws-sandbox').Client;
var parser = require('libxml-to-js');

var sandbox = new Client();
//var recieved= 0;
//var parsed = 0;
//var modeled = 0;
//var total = 0;

// Dev Env
//var firebaseRef = new Firebase('https://nextaircraft-dev.firebaseio.com/');



//var lastTime = _.now() - 3600000;
//var updateInterval = 15000;

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
                    //recieved = _.now() / 1000;
                    parser(data.GetAirportFlightInfoInXMLResult, function (err, result) {
                        if (err) {
                            console.log(err);
                            return reject(err);
                        }
                        //parsed = _.now() / 1000;
                        //var elapsed = parsed - recieved;
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

    if (aircraft && aircraft.tag) {
        var origin = aircraft.origin.trim();
        var destination = aircraft.destination.trim();;
        aircraft['origin'] = origin;
        aircraft['destination'] = destination;
        aircraft['id'] =  aircraft.tag + origin + destination;
        aircraft['lat'] = parseFloat(aircraft.lat);
        aircraft['lon'] = parseFloat(aircraft.lon);
        aircraft['geoKey'] = location + ':' + aircraft.id;
        //aircraft.timestamp = new Date(aircraft.lastUpdate).getTime();
        aircraft['timestamp'] = Date.now() / 1000;
        aircraft['inbound'] = (origin && origin.indexOf(location) > -1) ? false : true;

        var firebaseRef = new Firebase("https://geoaircraft.firebaseio.com/");
        var geoFire = new GeoFire(firebaseRef.child("_geofire"));
        //save model to firebase
        firebaseRef.child(location).child(aircraft.id).set(aircraft);
        //save geohash to firebase
        geoFire.set(aircraft.geoKey, [aircraft.lat, aircraft.lon]);
        //modeled = Date.now() / 1000;
        firebaseRef = null;
        geoFire = null;
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
    var promise = new RSVP.Promise(function(resolve, reject) {
        console.log('new cycle:' + new Date());
        getData().then(function (result) {
            if (result && result.aircraft) {
                _.forEach(result.aircraft, createAircraft);
                //total = modeled - recieved;
                //console.log('Total: ' + total);
                //console.log('Parsing: ' + (parsed - recieved))
                //console.log('Modeling: ' + (modeled - parsed));
                console.log('------------');
                result = null;
                return resolve();
            }
        }, function (err) {
            console.log(err);
            return reject(err);
        })
    });
    return promise;

}

function start(){
    return updateFirebase().then(function(){
        sandbox.fastTrackClient.lastResponse = null;
        //heapdump.writeSnapshot();
        return start();
    },function(err){
        console.log(err);
    })
}

start();

//setInterval((function () {
//    updateFirebase();
//}), updateInterval);
