import express, { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import logger from "../config/logger";
import cors from "cors";
import session from "express-session";
import cookieParser from "cookie-parser";
import { environment } from "./config";
import { createProxyMiddleware } from "http-proxy-middleware";
import { createServer } from "http";
import { allowedOrigins } from "./constants";
import { JWT_SECRET_KEY } from "../middlewares/auth";
import csvRoutes from "../routes/csv.routes";
import litRoutes from "../routes/lit.routes";

dotenv.config();
const app = express();

if (app.get("env") === "production") {
  app.set("trust proxy", 1);
}

app.use(
  session({
    secret: JWT_SECRET_KEY,
    resave: false,
    saveUninitialized: true,
    cookie: {
      httpOnly: true,
      secure: environment.NODE_ENV === "production",
    },
  })
);

app.use(cookieParser());

// Middleware
app.use(express.json({ limit: "50mb" }));

// cors
app.use(
  cors({
    credentials: true,
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Proxy for Pinata Cors
app.use(
  "/pinata",
  createProxyMiddleware({
    logger: logger,
    target: "https://emerald-odd-bee-965.mypinata.cloud",
    changeOrigin: true,
    pathRewrite: { "^/pinata": "/files" },
  })
);

// Api home
app.get("/", (req: Request, res: Response) => {
  res.send("Hello World!");
});

// Routes
app.use("/api/upload-csv", csvRoutes);
app.use("/api/lit-session", litRoutes);

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error(err.stack);
  res.status(500).send("Something went wrong!");
});

const server = createServer(app);

console.log(`Server running on port ${server}`);

export default server;
