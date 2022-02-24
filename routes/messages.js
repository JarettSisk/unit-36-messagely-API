const User = require('../models/user');
const Message = require('../models/message');
const express = require('express');
const router = express.Router();
const {ensureLoggedIn, ensureCorrectUser } = require("../middleware/auth");
const ExpressError = require("../expressError")


/** GET /:id - get detail of message.
 *
 * => {message: {id,
 *               body,
 *               sent_at,
 *               read_at,
 *               from_user: {username, first_name, last_name, phone},
 *               to_user: {username, first_name, last_name, phone}}
 *
 * Make sure that the currently-logged-in users is either the to or from user.
 *
 **/
router.get("/:id", ensureLoggedIn, async (req, res, next) => {
    const messageID = req.params.id;
    const user = await User.get(req.user.username);
    const message = await Message.get(messageID);
    if (user && user.username === message.from_user.username || user && user.username === message.to_user.username ) {
        await Message.markRead(messageID);
        return res.json({message : message});
    }
})

/** POST / - post message.
 *
 * {to_username, body} =>
 *   {message: {id, from_username, to_username, body, sent_at}}
 *
 **/

router.post("/", ensureLoggedIn, async (req, res, next) => {
    const user = await User.get(req.user.username);
    console.log(user);
    const { message_body, to_user } = req.body;

    if (user) {
        const message = await Message.create({from_username: user.username, to_username: to_user, body : message_body});
        return res.json({message : message})
    }

})


/** POST/:id/read - mark message as read:
 *
 *  => {message: {id, read_at}}
 *
 * Make sure that the only the intended recipient can mark as read.
 *
 **/

 router.post("/:id/read", ensureLoggedIn, async (req, res, next) => {
    try {
        const messageID = req.params.id;
    const user = await User.get(req.user.username);
    const message = await Message.get(messageID);
    if (user && user.username === message.to_user.username) {
        const readAt = await Message.markRead(messageID);
        return res.json({message : {messageID, readAt}});
    } else {
        throw new ExpressError("Unauthorized", 401)
    }
    } catch (error) {
        next(error);
    }
    
})

module.exports = router;
