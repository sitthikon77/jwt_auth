require('dotenv').config()
require('./config/database').connect();

const express = require('express');
const User = require('./models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const auth = require('./middleware/auth');
const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUI = require('swagger-ui-express');

const app = express();

app.use(express.json());

const options = {
    definition: {
        openapi : '3.0.0',
        info : {
            title: 'Node JS API Project for mongodb',
            version: '1.0.0'
        },
        servers:[
            {
                url: 'http://localhost:4001/'
            }
        ]
    },
    apis: ['./app.js']
}

const swaggerSpec = swaggerJSDoc(options)
app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerSpec))

/**
 * @swagger
 * /:
 *  get:
 *      summary: This api is used to check if get method is working or not
 *      description: This api is used to check if get method is working or not
 *      responses:
 *          200:
 *              description: To test Get method
 */

app.get('/', (req, res) => {
    res.send('Welcome to test api');
})

// Login goes here
// Register
app.post("/register", async (req, res) => {
    
    try {

        const { first_name, last_name, email, password } = req.body

        // Validate user input
        if (!(email && password && first_name && last_name)) {
            res.status(400).send("All input is required");
        }

        // Check if user already exist
        // Validate if user exist in our database
        const oldUser = await User.findOne({ email });

        if (oldUser) {
            return res.status(409).send("User already exist. Please login");
        }

        // Encrypt user password
        encryptedPassword = await bcrypt.hash(password, 10);

        // Create user in our database
        const user = await User.create({
            first_name,
            last_name,
            email: email.toLowerCase(),
            password: encryptedPassword
        })

        // Create token
        const token = jwt.sign(
            { user_id: user._id, email },
            process.env.TOKEN_KEY,
            {
                expiresIn: "2h"
            }
        )

        // Save user token
        user.token = token;

        // return new user
        res.status(201).json(user)

    } catch (err) {
        console.log(err);
    }
})

// Login
app.post("/login", async (req, res) => {
    try {

        // Get user input
        const { email, password } = req.body;

        // Validate user input
        if (!(email && password)) {
            res.status(400).send("All input is required");
        }

        // Validate if user exist in our database
        const user = await User.findOne({ email });

        if (user && (await bcrypt.compare(password, user.password))) {
            // Create token
            const token = jwt.sign(
                { user_id: user._id, email },
                process.env.TOKEN_KEY,
                {
                    expiresIn: "2h"
                }
            )
            // save user token
            user.token = token

            res.status(200).json(user);
        }

        res.status(400).send("Invalid Credentials");

    } catch(err) {
        console.log(err);
    }
})

app.post('/welcome', auth, (req, res) => {
    res.status(200).send('Welcome');
})

module.exports = app;