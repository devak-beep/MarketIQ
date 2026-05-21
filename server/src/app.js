import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import routes from "./routes/index.js";
import { errorHandler, notFound } from "./middleware/error.middleware.js";

const app = express();

const corsOrigins =
  process.env.CORS_ORIGIN?.split(",")
    .map((s) => s.trim())
    .filter(Boolean) || [];
app.use(
  cors({
    origin: corsOrigins.length ? corsOrigins : true,
    credentials: true,
  }),
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "server" });
});

app.use("/api", routes);
app.use(notFound);
app.use(errorHandler);

export default app;
