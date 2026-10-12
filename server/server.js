"use strict";

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

// ==========================================
// LOAD ENVIRONMENT VARIABLES
// ==========================================

dotenv.config();

// ==========================================
// DATABASE
// ==========================================

const connectDB = require("./config/db");

// ==========================================
// ROUTES
// ==========================================

const authRoutes = require("./routes/authRoutes");
const contactRoutes = require("./routes/contactRoutes");
const campaignRoutes = require("./routes/campaignRoutes");
const templateRoutes = require("./routes/templateRoutes");

// ==========================================
// EMAIL
// ==========================================

const {
    verifyEmailConnection
} = require("./config/email");

// ==========================================
// EXPRESS APP
// ==========================================

const app = express();

// ==========================================
// MIDDLEWARE
// ==========================================

app.use(
    cors({
        origin: true,
        credentials: true
    })
);

app.use(
    express.json({
        limit: "2mb"
    })
);

app.use(
    express.urlencoded({
        extended: true,
        limit: "2mb"
    })
);

// ==========================================
// DATABASE CONNECTION
// ==========================================

connectDB();

// ==========================================
// SERVE CLIENT FILES
// ==========================================

app.use(
    express.static(
        path.join(__dirname, "../client")
    )
);

// ==========================================
// API ROUTES
// ==========================================

app.use(
    "/api/auth",
    authRoutes
);

app.use(
    "/api/contacts",
    contactRoutes
);

app.use(
    "/api/campaigns",
    campaignRoutes
);

app.use(
    "/api/templates",
    templateRoutes
);

// ==========================================
// HEALTH CHECK
// ==========================================

app.get(
    "/api/health",
    (req, res) => {
        res.json({
            success: true,
            message:
                "Email Marketing API is running",
            timestamp:
                new Date().toISOString()
        });
    }
);

// ==========================================
// FRONTEND FALLBACK
// ==========================================

app.get(
    "/",
    (req, res) => {
        res.sendFile(
            path.join(
                __dirname,
                "../client/index.html"
            )
        );
    }
);

// ==========================================
// 404 API HANDLER
// ==========================================

app.use(
    "/api",
    (req, res) => {
        res.status(404).json({
            success: false,
            message:
                "API endpoint not found"
        });
    }
);

// ==========================================
// GLOBAL ERROR HANDLER
// ==========================================

app.use(
    (error, req, res, next) => {
        console.error(
            "Unhandled server error:",
            error
        );

        res.status(
            error.status || 500
        ).json({
            success: false,
            message:
                error.message ||
                "Internal server error"
        });
    }
);

// ==========================================
// SERVER
// ==========================================

const PORT =
    Number(process.env.PORT) || 5000;

const server =
    app.listen(
        PORT,
        async () => {
            console.log(
                `Server running at http://localhost:${PORT}`
            );

            // Verify SMTP connection
            await verifyEmailConnection();
        }
    );

// ==========================================
// SERVER ERROR
// ==========================================

server.on(
    "error",
    (error) => {
        if (error.code === "EADDRINUSE") {
            console.error(
                `Port ${PORT} is already in use.`
            );
        } else {
            console.error(
                "Server error:",
                error
            );
        }
    }
);

// ==========================================
// GRACEFUL SHUTDOWN
// ==========================================

process.on(
    "SIGINT",
    () => {
        console.log(
            "\nShutting down server..."
        );

        server.close(
            () => {
                process.exit(0);
            }
        );
    }
);

process.on(
    "SIGTERM",
    () => {
        console.log(
            "\nShutting down server..."
        );

        server.close(
            () => {
                process.exit(0);
            }
        );
    }
);