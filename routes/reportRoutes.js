const express = require('express');
const router = express.Router();
const runReport = require('../automation/runReport');
const config = require('../constants/config.json');
const { EventEmitter } = require('events');
const { v4: uuidv4 } = require('uuid');

// API key middleware
function requireApiKey(req, res, next) {
  const apiKey = process.env.API_KEY;
  const providedKey = req.headers['x-api-key'] || req.query.apiKey || req.body?.apiKey;
  if (!apiKey || providedKey !== apiKey) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or missing API key' });
  }
  next();
}

const jobEmitters = {};

router.post('/run', requireApiKey, async (req, res) => {
  try {
    const { report, region, filter, jobId } = req.body;
    if (!report) {
      console.log('[reportRoutes] Error: Missing required parameter: report');
      return res.status(400).json({ error: 'Missing required parameter: report' });
    }
    const reportUrl = config.reports && config.reports[report];
    if (!reportUrl) {
      console.log(`[reportRoutes] Error: Unknown report: ${report}`);
      return res.status(400).json({ error: `Unknown report: ${report}` });
    }
    const id = jobId || uuidv4();
    if (!jobEmitters[id]) jobEmitters[id] = new EventEmitter();

    // Pass emitter to runReport for streaming updates
    runReport({ report: reportUrl, region, filter, emitter: jobEmitters[id], jobId: id })
      .then(() => {
        console.log(`[reportRoutes] Job ${id} completed`);
        jobEmitters[id].emit('update', JSON.stringify({ done: true, message: 'Report automation completed!' }));
        setTimeout(() => delete jobEmitters[id], 60000);
      })
      .catch(err => {
        console.log(`[reportRoutes] Job ${id} error:`, err.message);
        jobEmitters[id].emit('update', JSON.stringify({ error: 'Automation failed', details: err.message }));
        setTimeout(() => delete jobEmitters[id], 60000);
      });

    console.log(`[reportRoutes] Job ${id} started`);
    res.status(200).json({ message: 'Job started', jobId: id });
  } catch (err) {
    console.log('[reportRoutes] Automation failed:', err.message);
    res.status(500).json({ error: 'Automation failed', details: err.message });
  }
});

// SSE endpoint for streaming updates
router.get('/run/stream', requireApiKey, (req, res) => {
  const jobId = req.query.jobId;
  if (!jobId || !jobEmitters[jobId]) {
    console.log(`[reportRoutes] Stream error: jobId not found (${jobId})`);
    res.status(404).end();
    return;
  }
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive'
  });
  res.flushHeaders();

  let ended = false;
  const cleanup = () => {
    if (ended) return;
    ended = true;
    clearTimeout(timeout);
    clearInterval(keepAliveInterval);
    jobEmitters[jobId]?.removeListener('update', onUpdate);
    res.end();
  };

  // Fallback: forcibly end after 8 minutes to prevent leaks
  const timeout = setTimeout(() => {
    cleanup();
  }, 8 * 60 * 1000);

  // Send keep-alive comment every 20 seconds
  const keepAliveInterval = setInterval(() => {
    try {
      res.write(': keep-alive\n\n');
    } catch (e) {
      cleanup();
    }
  }, 20000);

  const onUpdate = (msg) => {
    console.log(`[reportRoutes] Stream update for job ${jobId}:`, msg);
    res.write(`data: ${msg}\n\n`);
    const parsed = JSON.parse(msg);
    if (parsed.done || parsed.error) {
      cleanup();
    }
  };
  jobEmitters[jobId].on('update', onUpdate);

  req.on('close', () => {
    console.log(`[reportRoutes] Stream closed for job ${jobId}`);
    cleanup();
  });
});

module.exports = router;
