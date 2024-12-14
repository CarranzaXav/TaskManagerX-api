const allowedOrigins = require("./allowedOrigin");

const corsOptions = {
  credentials: true,
  optionsSuccessStatus: 200,
};

module.exports = corsOptions;
