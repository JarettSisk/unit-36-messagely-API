/** User class for message.ly */
const bcrypt = require('bcrypt');
const db = require("../db");
const ExpressError = require("../expressError");


/** User of the site. */

class User {

    /** register new user -- returns
     *    {username, password, first_name, last_name, phone}
     */

    static async register({username, password, first_name, last_name, phone}) {
        const hashedPW = await bcrypt.hash(password, 10);
        const result = await db.query(`
        INSERT INTO users (
            username,
            password,
            first_name,
            last_name,
            phone,
            join_at
        ) VALUES ($1, $2, $3, $4, $5, current_timestamp )
        RETURNING username, password, first_name, last_name, phone`,
        [username, hashedPW, first_name, last_name, phone]);
        

        return result.rows[0];

    }

    /** Authenticate: is this username/password valid? Returns boolean. */

    static async authenticate(username, password) {
        const result = await db.query(
            "SELECT password FROM users WHERE username = $1",
            [username]);
        let user = result.rows[0];
    
        return user && await bcrypt.compare(password, user.password);
        
    }

    /** Update last_login_at for user */

    static async updateLoginTimestamp(username) {
        const result = await db.query(`
        UPDATE users
        SET last_login_at = current_timestamp
        WHERE username=$1
        RETURNING last_login_at`, [username]);

        // If nothing is returned, throw an error
        if(result.rows.length !== 0) {
            return {msg : `Sucess, last logged in at ${result.rows[0].last_login_at}`}
        } else {
            throw new ExpressError("Could not update that user", 400)
        }
            
    }

    /** All: basic info on all users:
     * [{username, first_name, last_name, phone}, ...] */

    static async all() {
        const result = await db.query(`
        SELECT username, first_name, last_name, phone
        FROM users`);

        return result.rows;
    }

    /** Get: get user by username
     *
     * returns {username,
     *          first_name,
     *          last_name,
     *          phone,
     *          join_at,
     *          last_login_at } */

    static async get(username) { 
        const result = await db.query(`
        SELECT username, first_name, last_name, phone, join_at, last_login_at
        FROM users
        WHERE username = $1`, [username]);
        return result.rows[0];
    }

    /** Return messages from this user.
     *
     * [{id, to_user, body, sent_at, read_at}]
     *
     * where to_user is
     *   {username, first_name, last_name, phone}
     */

    static async messagesFrom(username) {
        const result = await db.query(`
        SELECT m.id, m.body, m.sent_at, m.read_at, u.username, u.first_name, u.last_name, u.phone
        FROM messages AS m
        LEFT JOIN users AS u
        ON u.username=m.to_username
        WHERE m.from_username=$1
        `, [username]);

        // Format the data
        const messagesFrom = result.rows.map((row) => {
            const {id, body, sent_at, read_at, username, first_name, last_name, phone} = row;
            return {
                id: id,
                body : body, 
                sent_at : sent_at, 
                read_at : read_at, 
                to_user : {
                    first_name : first_name, 
                    last_name : last_name, 
                    phone : phone,
                    username : username
                }
            } 
        });
        return messagesFrom;
     }

    /** Return messages to this user.
     *
     * [{id, from_user, body, sent_at, read_at}]
     *
     * where from_user is
     *   {username, first_name, last_name, phone}
     */

    static async messagesTo(username) {
        const result = await db.query(`
        SELECT m.id, m.body, m.sent_at, m.read_at, u.username, u.first_name, u.last_name, u.phone
        FROM messages AS m
        LEFT JOIN users AS u
        ON u.username = m.from_username
        WHERE m.to_username = $1
        `, [username]);

        // Format the data
        const messagesTo = result.rows.map((row) => {
            const {id, body, sent_at, read_at, username, first_name, last_name, phone} = row;
            return {
                id: id,
                body : body, 
                sent_at : sent_at, 
                read_at : read_at, 
                from_user : {
                    first_name : first_name, 
                    last_name : last_name, 
                    phone : phone,
                    username : username
                }
            } 
        });
        return messagesTo;
     }
}


module.exports = User;