const moment = require("moment"); //to get and format current time

function formatMessage(username, text) {
  // ES6 format
  return {
    username,
    text,
    time: moment().format("H:mm"),
  };
}

module.exports = formatMessage;
