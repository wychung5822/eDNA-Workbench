// src/routes/files.js
import express from "express";
import fs from "fs";
import decompress from "decompress";
import path from "path";
import { fileURLToPath } from "url";
import { v4 as uuidv4 } from "uuid";
import {
  clearUploadsDir,
  uploadPairedFiles,
  uploadSingleFile,
} from "../middleware/upload.js";
import { logger } from "../utils/logger.js";
import { exec } from "child_process";
import util from "util";

const execAsync = util.promisify(exec);

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const handleExtractArchive = async (fileArray) => {
  if (!fileArray || fileArray.length === 0) return fileArray;
  const fileObj = fileArray[0];
  
  const originalName = fileObj.originalname.toLowerCase();
  const isArchive = originalName.endsWith('.zip') || 
                    originalName.endsWith('.tar') || 
                    originalName.endsWith('.gz') || 
                    originalName.endsWith('.tar.gz') || 
                    originalName.endsWith('.7z') || 
                    originalName.endsWith('.rar');

  if (isArchive) {
    try {
      const extractDir = path.dirname(fileObj.path);
      let extractedFileName = null;
      let extractedFilePath = null;

      if (originalName.endsWith('.7z') || originalName.endsWith('.rar')) {
        // Use 7z command line for 7z and rar if installed on the system (macOS/Linux)
        // Alternatively we can try 7z binaries. Assuming the system has 7z installed 
        // as MEVPLab environment usually has standard bioinformatics tools.
        await execAsync(`7z x "${fileObj.path}" -o"${extractDir}" -y`);
        
        // Find the extracted file (assuming 1 file inside)
        const files = fs.readdirSync(extractDir);
        const newFile = files.find(f => f !== path.basename(fileObj.path) && f !== '.DS_Store' && !fs.statSync(path.join(extractDir, f)).isDirectory());
        if (newFile) {
          extractedFileName = newFile;
          extractedFilePath = path.join(extractDir, newFile);
        }
      } else {
        // Use decompress for zip, tar, tar.gz
        const files = await decompress(fileObj.path, extractDir);
        if (files && files.length > 0) {
          // Get the first file that is not a directory
          const fileEntry = files.find(f => f.type === 'file');
          if (fileEntry) {
            extractedFileName = path.basename(fileEntry.path);
            extractedFilePath = path.join(extractDir, fileEntry.path);
          }
        }
      }

      if (extractedFileName && extractedFilePath && fs.existsSync(extractedFilePath)) {
        logger.info(`Extracted archive ${fileObj.originalname} to ${extractedFileName}`);
        fileObj.originalname = extractedFileName;
        fileObj.filename = extractedFileName;
        fileObj.path = extractedFilePath;
        fileObj.size = fs.statSync(extractedFilePath).size;
      } else {
        logger.warn(`Could not determine extracted file for ${fileObj.originalname}`);
      }
    } catch (e) {
      logger.error(`Failed to extract archive file: ${fileObj.path}`, e);
      // In case of error (e.g., 7z not installed), we'll gracefully fallback to keeping the original file, 
      // but log the error.
    }
  }
  return fileArray;
};

// Upload paired-end files (R1, R2, and optional barcode file)
router.post(
  "/upload/paired",
  clearUploadsDir,
  uploadPairedFiles,
  async (req, res, next) => {
    try {
      let { R1, R2, barcode } = req.files;

      // Validate required files
      if (!R1 || !R2 || !barcode) {
        return res.status(400).json({
          error: "R1, R2, and barcode files are required",
        });
      }

      // Extract only R1 and R2, leave barcode intact
      R1 = await handleExtractArchive(R1);
      R2 = await handleExtractArchive(R2);

      const uploadedFiles = {
        R1: {
          id: uuidv4(), // 生成新的唯一ID
          originalName: R1[0].originalname,
          filename: R1[0].filename,
          path: R1[0].path,
          size: R1[0].size,
          uploadTime: new Date().toISOString(),
        },
        R2: {
          id: uuidv4(), // 生成新的唯一ID
          originalName: R2[0].originalname,
          filename: R2[0].filename,
          path: R2[0].path,
          size: R2[0].size,
          uploadTime: new Date().toISOString(),
        },
        barcode: {
          id: uuidv4(), // 生成新的唯一ID
          originalName: barcode[0].originalname,
          filename: barcode[0].filename,
          path: barcode[0].path,
          size: barcode[0].size,
          uploadTime: new Date().toISOString(),
        },
      };

      logger.info("Paired files uploaded successfully", {
        R1: uploadedFiles.R1.originalName,
        R2: uploadedFiles.R2.originalName,
        barcode: uploadedFiles.barcode.originalName,
      });

      res.json({
        message: "Files uploaded successfully",
        files: uploadedFiles,
      });
    } catch (error) {
      next(error);
    }
  }
);

router.post("/upload/single", uploadSingleFile, async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Extract if it is an archive
    req.file = (await handleExtractArchive([req.file]))[0];

    const uploadedFile = {
      id: uuidv4(),
      originalName: req.file.originalname,
      filename: req.file.filename,
      path: req.file.path,
      size: req.file.size,
      uploadTime: new Date().toISOString(),
    };

    logger.info("Single file uploaded:", uploadedFile.originalName);

    res.json({
      success: true,
      message: "File uploaded successfully",
      filename: uploadedFile.filename, // -- file name required by front-end
      file: uploadedFile,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
