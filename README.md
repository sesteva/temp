# Next Aircraft

Set of scripts to poll the FE API to populate a Firebase endpoint.

## firebase-populator

The populator consumes a WS and populates the model and the geohash to Firebase.
This is done every 5000 ms.

## firebase-reaper

The reaper queries Firebase and evaluates if model/geohash is stale based on timestamp.
This is done every 200 ms.

## TODO

For testing purposes, both the populator and repeat have been using a 'dev' firebase repo.
https://nextaircraft-dev.firebaseio.com/

This is accessible from same user account:

user: santiago.esteva@sabre.com
pass: esteva81

Once the WS is connected then update both populator and repear to use https://geoaircraft.firebaseio.com/

Populator:

- Retrieve from WS instead of local file
- Pay the price of fast prototyping....write the tests!!!!!

Reaper:

- Pay the price of fast prototyping....write the tests!!!!!

Script:

- Create a shell script to run both on separate threads.

## Run Populator locally

    node aircraft-populator.js

## Run Reaper locally

    node aircraft-reaper.js
