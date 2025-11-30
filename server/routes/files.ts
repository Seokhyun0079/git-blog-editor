import { Router, Request, Response } from "express";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import dotenv from "dotenv";
import {
  createImageFile,
  createContentFile,
  getFile,
  deleteFile,
} from "../git-utils";
import { cleanupOrphanedFiles } from "../utils/cleanup";

dotenv.config({ path: path.join(__dirname, "..", ".env") });

const router = Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
// const upload = multer({
//   storage: storage,
//   limits: {
//     fileSize: 1024 * 1024 * 1024 * 2,
//     fieldSize: 1024 * 1024 * 1024 * 2,
//   },
// });

// Clean up orphaned files endpoint
router.delete("/clean-orphaned-files", async (req: Request, res: Response) => {
  try {
    console.log("Starting orphaned files cleanup request...");
    const result = await cleanupOrphanedFiles();

    res.json({
      success: true,
      message: `Cleanup completed. Deleted ${result.deleted.length} files.`,
      deleted: result.deleted,
      deletedCount: result.deleted.length,
      errors: result.errors,
      errorCount: result.errors.length,
    });
  } catch (error: any) {
    console.error("Error cleaning up orphaned files:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to cleanup orphaned files",
    });
  }
});

export default router;
