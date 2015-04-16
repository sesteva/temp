# Next Aircraft

Set of scripts to poll the FE API to populate a Firebase endpoint.

## aircraft-populator

The populator consumes a WS client (ws-sandbox) and populates the model and the geohash to Firebase.

## aircraft-reaper

The reaper queries Firebase and evaluates if model/geohash is stale (5mins) based on timestamp.
This is done every 200 ms.

## ws-sandbox

This the WS client. It will create a client, login and retrieve the airport aircrafts positions.
If we get an error, it will clean the sessionId, remove the client's instance and start again.

## Notes

For testing purposes, both the populator and repear have been using a 'dev' firebase repo.
https://nextaircraft-dev.firebaseio.com/

This is accessible from same user account:

user: santiago.esteva@sabre.com
pass: esteva81

For local testing purposes the populator has a method to retrieve data from a mock xml.

For 'prod' usage update both populator and repear to use https://geoaircraft.firebaseio.com/

## TODO

- Write logs to file

Populator:

- Pay the price of fast prototyping....write the tests!!!!!

Reaper:

- Pay the price of fast prototyping....write the tests!!!!!

Script:

- Create a shell script to run both on separate threads. or use PM2?

## Run Populator locally

    node aircraft-populator.js

## Run Reaper locally

    node aircraft-reaper.js

## Memory Profiling

Install headdump

    npm install heapdump

Then in aircraft-populator.js uncomment the following lines:

    //var heapdump = require('heapdump');

and

    //heapdump.writeSnapshot();

This generates a headsnapshot file which can be view amonf other ways using Chrome dev tools's profile tab.
