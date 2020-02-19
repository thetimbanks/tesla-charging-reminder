'use strict';
const teslaApi = require('teslajs');
const sgMail = require('@sendgrid/mail');
const geolib = require('geolib');
const _ = require('lodash');

module.exports.reminder = (event, context, callback) => {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  const options = {
    authToken: process.env.TESLA_API_AUTH_TOKEN,
  };

  teslaApi.vehiclesAsync(options).then((vehicles) => {
    if (vehicles.length) {
      _.map(vehicles, async (vehicle) => {
        if (vehicle.state !== "asleep") {
          await teslaApi.vehicleDataAsync(_.merge(options, {vehicleID: vehicle.id_s})).then(function(vehicleData) {
            const chargeState = vehicleData.charge_state;
            const driveState = vehicleData.drive_state;
            const carLocation = [driveState.latitude, driveState.longitude];
            const homeLocation = [process.env.HOME_LATITUDE, process.env.HOME_LONGITUDE];
            const distance = geolib.getDistance(carLocation, homeLocation);
            const shouldSendTextMessage = distance < 100 && (chargeState.charging_state !== "Charging" && chargeState.charging_state !== "Complete");

            if (shouldSendTextMessage) {
              const msg = {
                to: process.env.EMAIL_TO,
                from: process.env.EMAIL_FROM,
                subject: 'Charging Reminder',
                text: 'Plug in your car!',
                html: '<strong>Plug in your car</strong>',
              };
              sgMail.send(msg);
            }

            console.log("Current charge state: " + chargeState.charging_state);
            console.log("Distance from Car to Home: " + distance);
            console.log("Did it send a text message? " + shouldSendTextMessage);
          });
        } else {
          console.log(`Vehicle ${vehicle.display_name} is alseep`);
        }
      });
    } else {
      console.log("No vehicles were found");
    }
  }).catch((error) => {
    console.log("Error: ", error);
  });

  callback(null);
};
