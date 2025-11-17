const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();
const { plantcare, collectionofficer, marketPlace, admin } = require("./startup/database");

const app = express();

const BASE_PATH = '/govilink';

const corsOptions = {
    origin: process.env.CLIENT_ORIGIN || "http://localhost:8081",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));





app.get([`${BASE_PATH}/health`, `${BASE_PATH}/healthz`], (req, res) => {
    res.status(200).json({
        status: 'ok',
        timestamp: new Date(),
        uptime: process.uptime(),
        service: 'GoLink API',
        environment: process.env.NODE_ENV || 'development'
    });
});

const DatabaseConnection = (db, name) => {
    db.getConnection((err, connection) => {
        if (err) {
            console.error(`Error getting connection from ${name}:`, err);
        } else {
            connection.ping((err) => {
                if (err) {
                    console.error(`Error pinging ${name} database:`, err);
                } else {
                    console.log(`Ping to ${name} database successful.`);
                }
                connection.release();
            });
        }
    });
};
// Initial database connections
DatabaseConnection(plantcare, "PlantCare");
DatabaseConnection(collectionofficer, "CollectionOfficer");
DatabaseConnection(marketPlace, "MarketPlace");
DatabaseConnection(admin, "Admin");


const userroute = require('./routes/user.routes.js');
const officerroutes = require('./routes/officer.routes.js')
const clusterauditroutes = require('./routes/clusteaudit.routes.js')
const requestauditroutes = require('./routes/requestaudit.routes.js')
const complaintroutes = require('./routes/complaint.routes.js')
const assignjobsroutes = require('./routes/assignjobs.routes.js')

app.use(`${BASE_PATH}/api/auth`,userroute);
app.use(`${BASE_PATH}/api/officer`,officerroutes)
app.use(`${BASE_PATH}/api/cluster-audit`, clusterauditroutes)
app.use(`${BASE_PATH}/api/request-audit`, requestauditroutes)
app.use(`${BASE_PATH}/api/complaint`, complaintroutes)
app.use(`${BASE_PATH}/api/assign-jobs`, assignjobsroutes)

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});
// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📍 Base Path: ${BASE_PATH}`);
    console.log(`💓 Health Check URL: ${BASE_PATH}/health`);
});

module.exports = app;

