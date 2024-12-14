const User = require("../models/User")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")

// Token need to authenticate with JWT
const user = {
    username: "Xavier",
    email: "carranzax7@gmail.com",
    roles: ["admin"]
    };
const token = jwt.sign(
    {
        UserInfo:{
            username: user.username,
            email: user.email,
            roles: user.roles,
        },
    },
    process.env.ACCESS_TOKEN_SECRET,
    {expiresIn: '10m' }
);

// @desc login
// @route POST /auth
// @access Public
const login = async (req,res) => {
    const {username, password} = req.body

    if(!username || !password) {
        return res.status(400).json({message:'All fields are required'})
    } 

    const foundUser = await User.findOne({username}).exec()

    if(!foundUser || !foundUser.active){
        return res.status(401).json({message:'Unauthorized'})
    }

    const match = await bcrypt.compare(password, foundUser.password)

    if(!match) return res.status(401).json({message:'Unauthorized'})

    const accessToken = jwt.sign(
        {
            "UserInfo" : {
                "username": foundUser.username,
                "roles" : foundUser.roles
            }
        },
        process.env.ACCESS_TOKEN_SECRET,
            {expiresIn: '15m'}
    )

    const refreshToken = jwt.sign(
        {"username" : foundUser.username},
        process.env.REFRESH_TOKEN_SECRET,
        {expiresIn: '7d'}
    )

    // Create secure cookie with refresh token
    res.cookie('jwt', refreshToken, {
        httpOnly: true, //accessible only by web server
        secure:  true, //https
        sameSite: 'None', //cross-site cookie
        maxAge: 7*24*60*60*1000 //cookie expires: set to match refreshToken
    })

    //Send accessToken containing username and roles
    res.json({accessToken})
}

//@desc Refresh
//@route GET /auth/refresh
//@access Public
const refresh = (req, res) => {
    const cookies = req.cookies

    if(!cookies?.jwt){
        return res.status(401).json({message: 'Unauthorized'})
         }

    const refreshToken = cookies.jwt

    try {
        // Verify the refresh token
        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

        const username = decoded.username;

        // Optionally: Verify the user and refresh token in your database

        // Generate a new access token
        const newAccessToken = jwt.sign(
            { username: username },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: '15m' } // Adjust expiry as needed
        );

        // Generate a new refresh token
        const newRefreshToken = jwt.sign(
            { username: username },
            process.env.REFRESH_TOKEN_SECRET,
            { expiresIn: '7d' } // Adjust expiry as needed
        );

        // Send the new refresh token in a cookie
        res.cookie('jwt', newRefreshToken, {
            httpOnly: true,
            secure: false, // Enable for HTTPS
            sameSite: 'Lax', // Use 'None' with HTTPS
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        // Respond with the new access token
        res.json({ accessToken: newAccessToken, message: 'Token refreshed' });
    } catch (error) {
        console.error('Refresh token error:', error);
        res.status(403).json({ message: 'Forbidden' });
    }
}

// @desc logout
// @route POST /auth/logout
// access Public
const logout = (req, res) => {
    const cookies = req.cookies
    if(!cookies?.jwt) return res.sendStatus(204) //no content
    res.clearCookie('jwt', {httpOnly:true, sameSite:'None', secure: true})
    res.json({message:'Cookie Cleared'})
}

module.exports = {
    login,
    refresh,
    logout
}