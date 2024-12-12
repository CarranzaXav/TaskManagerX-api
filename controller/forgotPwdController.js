const User = require('../models/User')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const nodemailer = require('nodemailer')

const forgotPwd = async (req, res) => {
    try {
        // Find the user by email
        const user = await User.findOne({email:req.body.email})
        // If no user, err message
        if(!user) {
            return res.status(404).send({message: "User not found"})
        }
        // Generate a unique JWT token for the user that cotains the user's id
        const token = jwt.sign({userId: user._id}, process.env.ACCESS_TOKEN_SECRET, {expiresIn: "10m",})

        // Send the token to the user's email
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL,
                pass: process.env.PASSWORD_APP_EMAIL,
            },
        })
        // Email configuration
        const mailOptions = {
            from: process.env.EMAIL,
            to: req.body.email,
            subject: "Reset Password",
            html: `<h1>Reset Your Password</h1>
            <p> Click on the following link to reset your password:</p>
            <a href="http://localhost:3000/resetPwd/${token}">http://localhost:3000</a>
            <p>The link will expire in 10 minutes.</p>
            <p>If you didn't request a password reset, please ignore this email.</p>,`
        }

        const info = await transporter.sendMail(mailOptions)

        console.log("Email sent successfully: ", info.response)
        res.status(200).send({message:"Email Sent"})

    } catch (err){
        console.error("Error in forgotPwd: ", err.message)
        res.status(500).send({message: err.message})
    }
}
const resetPwd = async (req, res) => {
    try{
        // Verify the token sent by the user
        const decodedToken = jwt.verify(
            req.params.token,
            process.env.ACCESS_TOKEN_SECRET
        )

        // If the token is invalid, return an error
        if(!decodedToken) {
            return res.status(401).send({ message: "Invalid token" })
        }

        // find the user with the id from the token
        const user = await User.findOne({ _id: decodedToken.userId})
        if(!user) {
            return res.status(401).send({ message: "no user found"})
        }

        // Hash the new password
        const salt = await bcrypt.genSalt(10)
        hashedPassword = await bcrypt.hash(req.body.newPassword, salt)

        // Update user's password, clear reset token and expiration time
        user.password = hashedPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save()

        // Send success response
        res.status(200).send({message: "Password Updated"})

    } catch(err) {
        // Send error response if any errors occurs
        console.error("Error in resetPwd: ", err.message);
        res.status(500).send({ message: err.message})
    }
}

module.exports = {
    forgotPwd,
    resetPwd
}