'use strict';
const teslaApi = require('teslajs');
const sgMail = require('@sendgrid/mail');
const geolib = require('geolib');

module.exports.reminder = (event, context, callback) => {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  const options = {
    authToken: process.env.TESLA_API_AUTH_TOKEN,
    vehicleID: process.env.TESLA_VEHICLE_ID,
  };

  teslaApi.vehicleDataAsync(options).done(function(vehicleData) {
      const chargeState = vehicleData.charge_state;
      const driveState = vehicleData.drive_state;
      const carLocation = [driveState.latitude, driveState.longitude];
      const homeLocation = [process.env.HOME_LATITUDE, process.env.HOME_LONGITUDE];
      const distance = geolib.getDistance(carLocation, homeLocation);
      const shouldSendTextMessage = distance < 100 && (chargeState.charging_state !== "Charging" || chargeState.charging_state !== "Complete");

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

  callback(null);
};
