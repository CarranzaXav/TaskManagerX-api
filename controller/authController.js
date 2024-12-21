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

    const foundUser = await User.findOne({username: { $regex: new RegExp(`^${username}$`, 'i')}}).exec()

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

    if (!cookies?.jwt) return res.status(401).json({ message: 'Unauthorized' })

    const refreshToken = cookies.jwt

    jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET,
        async (err, decoded) => {
            if (err) return res.status(403).json({ message: 'Forbidden' })

            const foundUser = await User.findOne({ username: decoded.username }).exec()

            if (!foundUser) return res.status(401).json({ message: 'Unauthorized' })

            const accessToken = jwt.sign(
                {
                    "UserInfo": {
                        "username": foundUser.username,
                        "roles": foundUser.roles
                    }
                },
                process.env.ACCESS_TOKEN_SECRET,
                { expiresIn: '15m' }
            )

            res.json({ accessToken })
        }
    )
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