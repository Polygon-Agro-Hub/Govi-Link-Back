const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
require("dotenv").config();

const app = express();

const BASE_PATH = "/govilink";

// CORS configuration
const corsOptions = {
  origin: process.env.CLIENT_ORIGIN || "http://localhost:8081",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ limit: "10mb", extended: true }));

// Routes
const userroute = require("./routes/user-routes.js");
const officerroutes = require("./routes/officer-routes.js");
const clusterauditroutes = require("./routes/cluste-audit-routes.js");
const requestauditroutes = require("./routes/request-audit-routes.js");
const complaintroutes = require("./routes/complaint-routes.js");
const assignjobsroutes = require("./routes/assign-jobs-routes.js");
const capitalRequest = require("./routes/capital-request-routes.js");
const healthRoutes = require("./routes/health-routes.js");
const onboardsupplierRoutes = require("./routes/onboard-supplier-routes.js");

// Register routes with base path
app.use(BASE_PATH, healthRoutes);
app.use(`${BASE_PATH}/api/auth`, userroute);
app.use(`${BASE_PATH}/api/officer`, officerroutes);
app.use(`${BASE_PATH}/api/cluster-audit`, clusterauditroutes);
app.use(`${BASE_PATH}/api/request-audit`, requestauditroutes);
app.use(`${BASE_PATH}/api/complaint`, complaintroutes);
app.use(`${BASE_PATH}/api/assign-jobs`, assignjobsroutes);
app.use(`${BASE_PATH}/api/capital-request`, capitalRequest);
app.use(`${BASE_PATH}/api/onboard-supplier`, onboardsupplierRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: "Internal Server Error",
    message: err.message,
    timestamp: new Date(),
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`📍 Base Path: ${BASE_PATH}`);
  console.log(`💓 Health Check URL: ${BASE_PATH}/health`);
});

module.exports = app;
