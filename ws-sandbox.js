var soap = require('soap');
var RSVP = require('rsvp');

var requested = 0;
var retrieved = 0;

var Client = function(){
    //this.airport = airport;
    this.url = 'https://secure.flightexplorer.com/FastTrackWebService/FastTrackWS.asmx?WSDL';
    this.loginArgs = {'userID': 'sesteva', 'pwd': 'ftwspwd3267'};
    this.fastTrackClient = null;
    this.sessionId = null;
}


Client.prototype.createClient = function(){
    var self = this;
    var promise = new RSVP.Promise(function(resolve, reject) {
        console.log('creating client');
        if(self.fastTrackClient !== null) {
            console.log('client existed');
            return resolve();
        }
        soap.createClient(self.url, function(err, client) {
            if (err) {
                console.log(err);
                reject(err);
            }
            self.fastTrackClient = client;
            console.log('client created');
            return resolve();
        });
    });
    return promise;
}

Client.prototype.login = function(){
    var self = this;
    var promise = new RSVP.Promise(function(resolve, reject) {
        console.log('logging in')
        if(self.sessionId !== null) {
            console.log('session existed');
            return resolve();
        }
        self.fastTrackClient.Login(self.loginArgs, function (err, result) {
            //result.ReturnCode == 0: successfully logged in
            if (result.LoginResult.ReturnCode != 0) {
                console.log('failed to login');
                return reject(err);
            } else {
                console.log('logged in');
                //assign SessionID to webservice header. When successfully logged in, result.Message contains the SessionID.
                self.sessionId = result.LoginResult.Message;
                var header = {'tns:FEHeader': {'tns:SID': self.sessionId}};
                //console.log(header);
                self.fastTrackClient.addSoapHeader(header);
                return resolve(result.LoginResult.Message);
            }
        });
    });
    return promise;
}

Client.prototype.getFlightsByAirport = function(airport){
    var self = this;
    var args = {
        'airportID': 'DFW',
        'aiportBound': 'InAndOutBound',
        'flightStatus':'InFlightAndArrived'
    }
    var promise = new RSVP.Promise(function(resolve, reject) {
        requested = Date.now() / 1000;
        console.log('requesting data');
        self.fastTrackClient.GetAirportFlightInfoInXML(args, function (err, result) {
            if(err){
                console.log(err);
                reject(err);
            }
            retrieved = Date.now() / 1000;
            console.log('retrieved from WS: ' + (retrieved - requested));
            resolve(result);

        });
    });
    return promise;
}

Client.prototype.tryUntilSuccess = function(sandbox){
    var promise = new RSVP.Promise(function(resolve, reject) {
        sandbox.createClient().then(function () {
            sandbox.login().then(function () {
                sandbox.getFlightsByAirport().then(function (result) {
                    console.log('SUCCESS: ' + Date.now());
                    //console.log(result);
                    resolve(result);
                }, function (err) {
                    console.log(err);
                    console.log('clean start and try again');
                    sandbox.sessionId = undefined;
                    sandbox.fastTrackClient = undefined;
                    sandbox.tryUntilSuccess(sandbox);
                })
            })
        })
    });
    return promise;
}

// Testing Only
//var sandbox = new Client();
//setInterval((function () {
//    sandbox.tryUntilSuccess(sandbox);
//}), 5000);


exports.Client = Client;





