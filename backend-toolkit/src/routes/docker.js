import express from "express";
import { DockerService } from "../services/dockerService.js";

const router = express.Router();
const dockerService = new DockerService();

router.get("/check", async (req, res) => {
  try {
    const result = await dockerService.checkEnvironment();
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      checks: {
        dockerInstalled: false,
        dockerRunning: false,
        imageAvailable: false,
      },
      message: error.message,
    });
  }
});

/**
 * POST /api/docker/pull
 * SSE endpoint — streams docker pull progress to the client.
 * The client connects and receives event-stream lines until done/error.
 */
router.get("/pull", async (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no"); // disable nginx/proxy buffering
  res.flushHeaders();

  const send = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
    // flush() is added by the compression middleware to bypass gzip buffering
    if (typeof res.flush === "function") res.flush();
  };

  try {
    // First make sure Docker is running before we try to pull
    const installed = await dockerService.checkDockerAvailable();
    if (!installed) {
      send({ type: "error", message: "Docker is not installed" });
      res.end();
      return;
    }
    const running = await dockerService.checkDockerRunning();
    if (!running) {
      send({ type: "error", message: "Docker daemon is not running" });
      res.end();
      return;
    }

    // Already have the image?
    const exists = await dockerService.checkImageExists();
    if (exists) {
      send({ type: "done", message: "Image already exists" });
      res.end();
      return;
    }

    send({ type: "start", message: "Starting image download..." });

    const success = await dockerService.pullImageWithProgress((event) => {
      send(event);
    });

    if (!success) {
      send({ type: "error", message: "Image pull failed" });
    }
  } catch (error) {
    send({ type: "error", message: error.message });
  } finally {
    res.end();
  }
});

router.get("/installed", async (req, res) => {
  try {
    const installed = await dockerService.checkDockerAvailable();
    res.json({ installed });
  } catch (error) {
    res.status(500).json({ installed: false, error: error.message });
  }
});

router.get("/running", async (req, res) => {
  try {
    const running = await dockerService.checkDockerRunning();
    res.json({ running });
  } catch (error) {
    res.status(500).json({ running: false, error: error.message });
  }
});

export default router;
