const jwt = require('jsonwebtoken')

const verifyJWT = async (req, res, next) => {
    try{

    const authHeader = req.headers.authorization || req.headers.Authorization

    if(!authHeader?.startsWith('Bearer ')){
        return res.status(401).json({message:'Unauthorized'})
    }

    const token = authHeader.split(' ')[1]

    const decoded = await jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

    req.user = decoded.UserInfo.username;
    req.email = decoded.UserInfo.email;
    req.roles = decoded.UserInfo.roles;

    next()
    } catch (err) {
        console.error("Token Verification failed:", err.message)

        if(err.name === "TokenExpiredError"){
            return res.status(403).json({message: "Token expired"})
        } else if (err.name === "JsonWebTokenError"){
            return res.status(403).json({message: "Invalid token"})
        }

        return res.status(403).json({message: "Forbidden"})
    }



}

module.exports = verifyJWT
