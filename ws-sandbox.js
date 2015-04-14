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
    var that = this;
    var promise = new RSVP.Promise(function(resolve, reject) {
        soap.createClient(that.url, function(err, client) {
            if (err) {
                console.log(err);
                reject(err);
            }
            if(that.fastTrackClient === undefined) {
                console.log('creating client');
                that.fastTrackClient = client;
            }
            resolve();
        });
    });
    return promise;
}

Client.prototype.login = function(){
    var that = this;
    var promise = new RSVP.Promise(function(resolve, reject) {
        if(that.sessionId !== undefined) {
            return resolve();
        }
        that.fastTrackClient.Login(that.loginArgs, function (err, result) {
            //result.ReturnCode == 0: successfully logged in
            if (result.LoginResult.ReturnCode != 0) {
                console.log('failed to login');
                reject(err);
            } else {
                console.log('logged in');
                //assign SessionID to webservice header. When successfully logged in, result.Message contains the SessionID.
                that.sessionId = result.LoginResult.Message;
                var header = {'tns:FEHeader': {'tns:SID': that.sessionId}};
                console.log(header);
                that.fastTrackClient.addSoapHeader(header);
                resolve(result.LoginResult.Message);
            }
        });
    });
    return promise;
}

Client.prototype.getFlightsByAirport = function(airport){
    var that = this;
    var args = {
        'airportID': 'DFW',
        'aiportBound': 'InAndOutBound',
        'flightStatus':'InFlightAndArrived'
    }
    var promise = new RSVP.Promise(function(resolve, reject) {
        that.fastTrackClient.GetAirportFlightInfoInXML(args, function (err, result) {
            if(err){
                console.log(err);
                reject(err);
            }
            //console.log(result);
            resolve(result);

        });
    });
    return promise;
}

//var sandbox = new Client();
//sandbox.createClient().then(function(){
//    sandbox.login().then(function(){
//        sandbox.getFlightsByAirport().then(function(result){
//            console.log(result);
//        })
//    })
//})

exports.Client = Client;





