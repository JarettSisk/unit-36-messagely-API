const User = require('../models/user');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const {SECRET_KEY} = require('../config');
const express = require('express');
const router = express.Router();

/** POST /register - register user: registers, logs in, and returns token.
 *
 * {username, password, first_name, last_name, phone} => {token}.
 *
 *  Make sure to update their last-login!
 */
router.post('/register', async (req, res, next) => {
    try {
        const {username, password, first_name, last_name, phone} = req.body;
        // Note that we are passing an object as a parameter to User.register
        const user = await User.register({username, password, first_name, last_name, phone});
        if (user) {
            // update last login
            await User.updateLoginTimestamp(user.username);

            let token = jwt.sign({user}, SECRET_KEY);
            return res.json({token : token});
        }

    } catch (error) {
        return next(error.message);
    }
})

/** POST /login - login: {username, password} => {token}
 *
 * Make sure to update their last-login!
 *
 **/

 router.post('/login', async (req, res, next) => {
    try {
        const {username, password} = req.body;
        // Authenticate
        if (await User.authenticate(username, password)) {
            // get the user
            const user = await User.get(username);
            if (user) {
                // update last login
                await User.updateLoginTimestamp(user.username);
                // return a signed token
                let token = await jwt.sign({user}, SECRET_KEY);
                return res.json({token : token});
            }
        }

    } catch (error) {
        return next(error);
    }
})


module.exports = router;