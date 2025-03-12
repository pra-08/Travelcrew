const express = require('express');
const path = require('path');
const app = express();
const { MongoClient } = require('mongodb');
require('dotenv').config();

const mongoURI = process.env.MONGO_URI;
const dbName = 'project';

// Connect to MongoDB
const client = new MongoClient(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });

async function connectToDB() {
    try {
        await client.connect();
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
    }
}

connectToDB();

const db = client.db(dbName);

// Define collection for user sign up
const usersCollection = db.collection('logsigns');
// Define collection for travel requests
const travelRequestsCollection = db.collection('travel_requests');

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Serve static files from the "Travel Crew" directory
app.use(express.static(path.join(__dirname, 'Travel Crew')));

// Route for user signup
app.post('/signup', async (req, res) => {
    const { username, email, password } = req.body;
    try {
        await usersCollection.insertOne({ username, email, password });
        res.redirect('/'); // Redirect to home page
    } catch (error) {
        console.error('Error creating user', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Route for user login
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await usersCollection.findOne({ email, password });
        if (!user) {
            res.status(401).json({ error: 'Invalid credentials' });
        } else {
            res.redirect('/'); // Redirect to home page
        }
    } catch (error) {
        console.error('Error fetching user', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Route for submitting travel requests
app.post('/custom', async (req, res) => {
    const { username, number, email, s_date, e_date, pickup, no_traveller, trip_details } = req.body;
    try {
        await travelRequestsCollection.insertOne({
            username,
            mobile_number: number,
            email,
            starting_date: new Date(s_date),
            ending_date: new Date(e_date),
            pickup_destination: pickup,
            number_of_travellers: parseInt(no_traveller),
            trip_details,
        });
        res.redirect('/'); // Redirect to home page
    } catch (error) {
        console.error('Error creating travel request', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

const port = 3000;
app.listen(port, () => console.log(`Server is running on http://localhost:${port}`));
