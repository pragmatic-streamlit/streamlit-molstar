const winston = require("winston");

(function initialize() {

  const logger = winston.createLogger({
    "level": "info",
    "transports": [
      new winston.transports.Console(),
    ],
  });

  // Do not exit after the uncaught exception.
  logger.exitOnError = false;

  module.exports = logger;
}());
