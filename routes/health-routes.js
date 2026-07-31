const express = require("express");
const router = express.Router();

// Database connections
const {
  plantcare,
  collectionofficer,
  marketPlace,
  admin,
  investments,
} = require("../startup/database");

const BASE_PATH = "/govilink";

// Database connection test helper
const testConnection = (pool, name) => {
  return new Promise((resolve, reject) => {
    pool.getConnection((err, connection) => {
      if (err) {
        reject(err);
      } else {
        connection.ping((pingErr) => {
          if (pingErr) {
            connection.release();
            reject(pingErr);
          } else {
            connection.release();
            resolve();
          }
        });
      }
    });
  });
};

// Basic health check endpoint
router.get(["/health", "/healthz"], (req, res) => {
  const data = {
    uptime: process.uptime(),
    message: "OK",
    timestamp: new Date(),
    environment: process.env.NODE_ENV || "development",
    service: "GoLink API",
    status: "healthy"
  };
  res.status(200).json(data);
});

// Detailed health check with database connections
router.get("/health/details", async (req, res) => {
  try {
    // Check all database connections
    const dbChecks = await Promise.allSettled([
      testConnection(plantcare, "PlantCare"),
      testConnection(collectionofficer, "CollectionOfficer"),
      testConnection(marketPlace, "MarketPlace"),
      testConnection(admin, "Admin"),
      testConnection(investments, "Investments")
    ]);

    const databases = {
      plantcare: dbChecks[0].status === 'fulfilled' ? 'connected' : 'disconnected',
      collectionofficer: dbChecks[1].status === 'fulfilled' ? 'connected' : 'disconnected',
      marketplace: dbChecks[2].status === 'fulfilled' ? 'connected' : 'disconnected',
      admin: dbChecks[3].status === 'fulfilled' ? 'connected' : 'disconnected',
      investments: dbChecks[4].status === 'fulfilled' ? 'connected' : 'disconnected'
    };

    const allConnected = Object.values(databases).every(status => status === 'connected');

    const data = {
      uptime: process.uptime(),
      message: allConnected ? "OK" : "Degraded",
      timestamp: new Date(),
      environment: process.env.NODE_ENV || "development",
      service: "GoLink API",
      status: allConnected ? "healthy" : "degraded",
      databases: databases,
      memory: process.memoryUsage(),
      cpu: process.cpuUsage()
    };

    const statusCode = allConnected ? 200 : 207;
    res.status(statusCode).json(data);
  } catch (error) {
    res.status(500).json({
      uptime: process.uptime(),
      message: "Error checking health",
      timestamp: new Date(),
      environment: process.env.NODE_ENV || "development",
      service: "GoLink API",
      status: "unhealthy",
      error: error.message
    });
  }
});

// Readiness probe endpoint (for Kubernetes)
router.get("/health/ready", (req, res) => {
  res.status(200).json({
    status: "ready",
    timestamp: new Date()
  });
});

// Liveness probe endpoint (for Kubernetes)
router.get("/health/live", (req, res) => {
  res.status(200).json({
    status: "alive",
    timestamp: new Date()
  });
});

// Home page endpoint
router.get("/home", (req, res) => {
  res.send(`
    <html>
      <head>
        <title>GoLink API</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
          h1 { color: #333; }
          .endpoints { background: #f4f4f4; padding: 20px; border-radius: 5px; }
          code { background: #e0e0e0; padding: 2px 5px; border-radius: 3px; }
          .status { margin-top: 20px; }
          .healthy { color: green; }
          .degraded { color: orange; }
          .unhealthy { color: red; }
        </style>
      </head>
      <body>
        <h1>Welcome to GoLink API</h1>
        <div class="endpoints">
          <h3>Available Health Endpoints:</h3>
          <ul>
            <li><code>${BASE_PATH}/health</code> - Basic health check</li>
            <li><code>${BASE_PATH}/healthz</code> - Alias for basic health check</li>
            <li><code>${BASE_PATH}/health/details</code> - Detailed health check with database status</li>
            <li><code>${BASE_PATH}/health/ready</code> - Readiness probe (Kubernetes)</li>
            <li><code>${BASE_PATH}/health/live</code> - Liveness probe (Kubernetes)</li>
            <li><code>${BASE_PATH}/version</code> - API version information</li>
            <li><code>${BASE_PATH}/home</code> - This page</li>
          </ul>
        </div>
        <div class="status">
          <h3>Current Status:</h3>
          <p>Server uptime: ${Math.floor(process.uptime() / 60)} minutes ${Math.floor(process.uptime() % 60)} seconds</p>
          <p>Current time: ${new Date().toLocaleString()}</p>
          <p>Environment: ${process.env.NODE_ENV || "development"}</p>
          <p>Node version: ${process.version}</p>
          <p>Platform: ${process.platform}</p>
        </div>
      </body>
    </html>
  `);
});

// Version endpoint
router.get("/version", (req, res) => {
  res.status(200).json({
    version: "1.0.0",
    name: "GoLink API",
    description: "API for GoLink collection management system",
    nodeVersion: process.version,
    platform: process.platform,
    environment: process.env.NODE_ENV || "development"
  });
});

// Manual database connection check endpoint
router.get("/health/db/:database", async (req, res) => {
  const { database } = req.params;
  
  const dbMap = {
    plantcare: plantcare,
    collectionofficer: collectionofficer,
    marketplace: marketPlace,
    admin: admin,
    investments: investments
  };

  const dbNameMap = {
    plantcare: "PlantCare",
    collectionofficer: "CollectionOfficer",
    marketplace: "MarketPlace",
    admin: "Admin",
    investments: "Investments"
  };

  if (!dbMap[database]) {
    return res.status(404).json({
      error: "Database not found",
      message: `Database '${database}' is not recognized`
    });
  }

  try {
    await testConnection(dbMap[database], dbNameMap[database]);
    res.status(200).json({
      database: database,
      name: dbNameMap[database],
      status: "connected",
      timestamp: new Date()
    });
  } catch (error) {
    res.status(503).json({
      database: database,
      name: dbNameMap[database],
      status: "disconnected",
      error: error.message,
      timestamp: new Date()
    });
  }
});

// Metrics endpoint (for monitoring systems like Prometheus)
router.get("/metrics", (req, res) => {
  const memoryUsage = process.memoryUsage();
  const cpuUsage = process.cpuUsage();
  
  res.status(200).json({
    metrics: {
      memory: {
        rss: Math.round(memoryUsage.rss / 1024 / 1024) + 'MB',
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + 'MB',
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + 'MB',
        external: Math.round(memoryUsage.external / 1024 / 1024) + 'MB'
      },
      cpu: {
        user: cpuUsage.user + 'μs',
        system: cpuUsage.system + 'μs'
      },
      uptime: process.uptime() + 's',
      uptimeFormatted: Math.floor(process.uptime() / 60) + 'm ' + Math.floor(process.uptime() % 60) + 's',
      pid: process.pid,
      title: process.title,
      versions: process.versions
    },
    timestamp: new Date()
  });
});

module.exports = router;