const express = require('express')
const router = express.Router()
const authController = require('../controller/authController.js')
const forgotPwdController = require("../controller/forgotPwdController");
const loginLimiter = require('../middleware/loginLimiter')

router.route('/')
    .post(loginLimiter, authController.login)
router.route('/forgotPwd')
    .post(forgotPwdController.forgotPwd)
router.route('/resetPwd/:token')
    .post(forgotPwdController.resetPwd)
router.route('/refresh')
    .get(authController.refresh)
router.route('/logout')
    .post(authController.logout)

module.exports = router    
