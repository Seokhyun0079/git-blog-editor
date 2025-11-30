import express from "express";
import cors from "cors";
import path from "path";
import dotenv from "dotenv";
import postsRouter from "./routes/posts";
import filesRouter from "./routes/files";
import { initializeFiles } from "./utils/initialize";

// Load .env from server directory
dotenv.config({ path: path.join(__dirname, ".env") });

// Log environment variables
console.log("=== Environment Variables ===");
console.log("PORT:", process.env.PORT || "5000 (default)");
console.log("GITHUB_OWNER:", process.env.GITHUB_OWNER);
console.log("GITHUB_REPO:", process.env.GITHUB_REPO);
console.log("GITHUB_TOKEN:", process.env.GITHUB_TOKEN ? "Set" : "Not set");
console.log("==========================");

const app = express();

app.use(cors());
app.use(express.json());

// Serve static files
app.use(express.static(path.join(__dirname, "..")));

// Routes
app.use("/api/posts", postsRouter);
app.use("/api/files", filesRouter);

// Initialize files on server start
initializeFiles();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
