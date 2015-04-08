var Firebase = require('firebase');
var GeoFire = require('geofire');
var xml2js = require('xml2js');
var rest = require('restler');

var firebusRef = new Firebase('https://nextaircraft-dev.firebaseio.com/');
var geoFire = new GeoFire(firebusRef.child("_geofire"));

var lastTime = Date.now() - 3600000;
var updateInterval = 5000;

var agencyList = ['dfw'];

function isNumber(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}

function coerce(n) {
    return isNumber(n) ? Number(n) : n;
}

function traverseAndCoerce(o) {
    var result = {};
    for (var key in o) {
        result[key] = coerce(o[key]);
    }
    return result;
}

function vehicleLocation(agency) {
    var dev = "http://misc.firebase.com/~vikrum/nextbus.xml?dumb&a=";
    var prod = "http://webservices.nextbus.com/service/publicXMLFeed?command=vehicleLocations&a=";

    var result = prod + agency + "&t=" + lastTime;
    lastTime = Date.now();

    return result;
}


function updateFirebaseWithData() {
    agencyList.forEach(function (agency) {
        rest.get(vehicleLocation(agency)).on('complete', function (data) {
            var parser = new xml2js.Parser();
            console.log(data);
            parser.parseString(data, function (err, result) {
                if (result && result.body && result.body.aircraft) {
                    var i = 0;
                    result.body.aircraft.forEach(function (item) {
                        var vehicle = item['$'];
                        var geoPosition = {};
                        if (vehicle && vehicle.id) {
                            var firebaseId = 21;
                            vehicle = traverseAndCoerce(vehicle);
                            vehicle.timestamp = (Date.now() / 1000) - vehicle.secsSinceReport;
                            vehicle.vtype = 'FJLMNXKT'.indexOf(vehicle.routeTag) > -1 ? 'train' : 'bus';
                            firebusRef.child(agency).child(firebaseId).set(vehicle);
                            geoPosition[agency + firebaseId] = [32.899809, -97.040335]
                            geoFire.set(getPosition);

                        }
                        else {
                            console.log("bad vehicle ->");
                            console.log(vehicle);
                        }
                        i++;
                    });
                }
            });
        });
    });
}

setInterval((function () {
    updateFirebaseWithData();
}), updateInterval);
