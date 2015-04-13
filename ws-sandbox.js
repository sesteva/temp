var soap = require('soap');
var RSVP = require('rsvp');
var url = 'https://secure.flightexplorer.com/FastTrackWebService/FastTrackWS.asmx?WSDL';
var loginArgs = {'userID': 'sesteva', 'pwd': 'ftwspwd3267'};
var fastTrackClient,
    sessionId = undefined;

function createClient (){
    var promise = new RSVP.Promise(function(resolve, reject) {
        soap.createClient(url, function(err, client) {
            if (err) {
                console.log(err);
                reject(err);
            }
            resolve(client);
        });
    });
    return promise;
}

function login(){
    var promise = new RSVP.Promise(function(resolve, reject) {
        fastTrackClient.Login(loginArgs, function (err, result) {
            console.log(result);
            //result.ReturnCode == 0: successfully logged in
            if (result.LoginResult.ReturnCode != 0) {
                console.log('failed to login');
                reject(err);
            } else {
                console.log('logged in');
                //assign SessionID to webservice header. When successfully logged in, result.Message contains the SessionID.
                resolve(result.LoginResult.Message);
            }
        });
    });
    return promise;
}

function getFlightsByAirport(airport){
    var args = {
        'airportID': 'DFW',
        'aiportBound': 'InAndOutBound',
        'flightStatus':'InFlightAndArrived'
    }
    var promise = new RSVP.Promise(function(resolve, reject) {
        fastTrackClient.GetAirportFlightInfoInXML(args, function (err, result) {
            if(err){
                console.log(err);
                reject(err);
            }
            console.log(result);
            resolve(result);

        });
    });
    return promise;
}

createClient().then(function(client){
    fastTrackClient = client;
    login().then(function(sessionId){
        var header = {'tns:FEHeader': {'tns:SID': sessionId}};
        fastTrackClient.addSoapHeader(header);
        getFlightsByAirport().then(function(result){
           console.log(result);
        });
    });
});






