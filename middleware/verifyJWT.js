const jwt = require('jsonwebtoken')

// async is new
const verifyJWT = async (req, res, next) => {
// try is new
    try{

    const authHeader = req.headers.authorization || req.headers.Authorization
    // console.log("Authorization Header:", authHeader)

    if(!authHeader?.startsWith('Bearer ')){
        // console.log("Unauthorized: No Bearer token found.")
        return res.status(401).json({message:'Unauthorized'})
    }

    const token = authHeader.split(' ')[1]
    // // console.log("token received: ", token)

    const decoded = await jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

    req.user = decoded.UserInfo.username;
    req.email = decoded.UserInfo.email;
    req.roles = decoded.UserInfo.roles;

    console.log("Decoded Token: ", decoded)
    console.log("Request Body: ", req.body)
    console.log("Authenticated User: ", req.user, req.email, req.roles)
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
// Original:
    // jwt.verify(
    //     req.params.token, 
    //     // 'your_actual_secret_here',
    //     process.env.ACCESS_TOKEN_SECRET,
    //     (err,decoded) => {
    //         if(err) {
    //             console.log("Token verification failed:", err.message)
    //             return res.status(403).json({message: 'Forbidden'})}
    //         // console.log("Token verified, Decoded user:", decoded.UserInfo)
    //         req.user = decoded.UserInfo.username
    //         req.roles = decoded.UserInfo.roles
    //         next()
    //     }
    // )