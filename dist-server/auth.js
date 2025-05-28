"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupAuth = setupAuth;
const passport_1 = __importDefault(require("passport"));
const passport_local_1 = require("passport-local");
const express_session_1 = __importDefault(require("express-session"));
const storage_1 = require("./storage");
function setupAuth(app) {
    const sessionSettings = {
        secret: process.env.SESSION_SECRET || "sales-management-app-secret",
        resave: false,
        saveUninitialized: false,
        store: storage_1.storage.sessionStore,
        cookie: {
            maxAge: 1000 * 60 * 60 * 24, // 1 day
            secure: process.env.NODE_ENV === "production",
        }
    };
    app.set("trust proxy", 1);
    app.use((0, express_session_1.default)(sessionSettings));
    app.use(passport_1.default.initialize());
    app.use(passport_1.default.session());
    passport_1.default.use(new passport_local_1.Strategy(async (username, password, done) => {
        const user = await storage_1.storage.getUserByUsername(username);
        if (!user || user.password !== password) {
            return done(null, false);
        }
        else {
            return done(null, user);
        }
    }));
    passport_1.default.serializeUser((user, done) => done(null, user.id));
    passport_1.default.deserializeUser(async (id, done) => {
        const user = await storage_1.storage.getUser(id);
        done(null, user);
    });
    app.post("/api/register", async (req, res, next) => {
        try {
            const existingUser = await storage_1.storage.getUserByUsername(req.body.username);
            if (existingUser) {
                return res.status(400).json({ message: "Tên đăng nhập đã tồn tại" });
            }
            const user = await storage_1.storage.createUser({
                ...req.body,
                password: req.body.password,
            });
            req.login(user, (err) => {
                if (err)
                    return next(err);
                res.status(201).json(user);
            });
        }
        catch (error) {
            next(error);
        }
    });
    app.post("/api/login", (req, res, next) => {
        passport_1.default.authenticate("local", (err, user, info) => {
            if (err)
                return next(err);
            if (!user)
                return res.status(400).json({ message: "Tên đăng nhập hoặc mật khẩu không đúng" });
            req.login(user, (err) => {
                if (err)
                    return next(err);
                // Log the login action
                storage_1.storage.createSessionLog({
                    userId: user.id,
                    action: "login",
                    details: `User ${user.username} logged in`,
                    timestamp: new Date()
                }).catch(() => {
                    // Silently handle error
                });
                return res.status(200).json(user);
            });
        })(req, res, next);
    });
    app.post("/api/logout", (req, res, next) => {
        if (req.user) {
            const userId = req.user.id;
            // Log the logout action
            storage_1.storage.createSessionLog({
                userId,
                action: "logout",
                details: `User ${req.user.username} logged out`,
                timestamp: new Date()
            }).catch(() => {
                // Silently handle error
            });
        }
        req.logout((err) => {
            if (err)
                return next(err);
            res.sendStatus(200);
        });
    });
    app.get("/api/user", (req, res) => {
        if (!req.isAuthenticated())
            return res.sendStatus(401);
        res.json(req.user);
    });
}
