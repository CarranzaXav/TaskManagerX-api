const rateLimit = require('express-rate-limit')
const {logEvents} = require('./logger')

const loginLimiter = rateLimit ({
    windowMs: 60 * 1000, // = 1 min
    max: 7, //Limit IP to 7 login request per 'window' per min
    message: 
        {
            message:'Too many login attempts from this IP, please try again after 60 second pause'
        },
        handler:(req,res,next,options) => {
            logEvents(`Too Many Request: ${options.message.message}\t${req.method}\t${req.url}\t${req.headers.origin}`, 'errLog.log')
            res.status(options.stateCode).send(options.message)
        },
        standardHeaders: true, //Retrun rate limit info in the `RateLimit-*` headers
        leqacyHeaders: false, //Disable the `X-RateLimit-*` headers
})

module.exports = loginLimiter