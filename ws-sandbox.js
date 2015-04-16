var soap = require('soap');
var RSVP = require('rsvp');

var Client = function(){
    //this.airport = airport;
    this.url = 'https://secure.flightexplorer.com/FastTrackWebService/FastTrackWS.asmx?WSDL';
    this.loginArgs = {'userID': 'sesteva', 'pwd': 'ftwspwd3267'};
    this.fastTrackClient = undefined;
    this.sessionId = undefined;
}


Client.prototype.createClient = function(){
    var self = this;
    var promise = new RSVP.Promise(function(resolve, reject) {
        if(typeof self.fastTrackClient !== 'undefined') {
            return resolve();
        }
        console.log('...')
        soap.createClient(self.url, function(err, client) {
            if (err) {
                console.log(err);
                return reject(err);
            }
            self.fastTrackClient = client;
            self = null;
            return resolve();
        });
    });

    return promise;
}

Client.prototype.login = function(){
    var self = this;
    var promise = new RSVP.Promise(function(resolve, reject) {
        if(typeof self.sessionId !== 'undefined') {
            self = null;
            return resolve();
        }
        self.fastTrackClient.Login(self.loginArgs, function (err, result) {
            //result.ReturnCode == 0: successfully logged in
            var login = result.LoginResult;
            if (login.ReturnCode != 0) {
                console.log('failed to login');
                return reject(err);
            } else {
                //assign SessionID to webservice header. When successfully logged in, result.Message contains the SessionID.
                self.sessionId = login.Message;
                var header = {'tns:FEHeader': {'tns:SID': self.sessionId}};
                self.fastTrackClient.addSoapHeader(header);
                result = null;
                login = null;
                self = null;
                return resolve();
            }
        });
    });

    return promise;
}

Client.prototype.getFlightsByAirport = function(){
    var self = this;
    var args = {
        'airportID': 'DFW',
        'aiportBound': 'InAndOutBound',
        'flightStatus':'InFlightAndArrived'
    }
    var promise = new RSVP.Promise(function(resolve, reject) {
        //requested = Date.now() / 1000;
        console.log('requesting data');
        self.fastTrackClient.GetAirportFlightInfoInXML(args, function (err, result) {
            if(err){
                console.log(err);
                return reject(err);
            }
            self = null;
            return resolve(result);

        });
    });

    return promise;
}

//Client.prototype.tryUntilSuccess = function(sandbox){
//    var promise = new RSVP.Promise(function(resolve, reject) {
//        sandbox.createClient().then(function () {
//            sandbox.login().then(function () {
//                sandbox.getFlightsByAirport().then(function (result) {
//                    console.log('SUCCESS: ' + Date.now());
//                    console.log(result);
                    //resolve(result);
                //}, function (err) {
                //    console.log(err);
                //    console.log('clean start and try again');
                //    sandbox.sessionId = undefined;
                //    sandbox.fastTrackClient = undefined;
                //    sandbox.tryUntilSuccess(sandbox);
                //})
            //})
        //})
    //});
    //return promise;
//}

// Testing Only
//var sandbox = new Client();
//setInterval((function () {
//    sandbox.tryUntilSuccess(sandbox);
//}), 5000);


exports.Client = Client;





