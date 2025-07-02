const express = require('express');
const router = express.Router();
const runAppointments = require('../automation/runAppointments');
const { EventEmitter } = require('events');
const { v4: uuidv4 } = require('uuid');

function requireApiKey(req, res, next) {
  const apiKey = process.env.API_KEY;
  const providedKey = req.headers['x-api-key'] || req.query.apiKey || req.body?.apiKey;
  if (!apiKey || providedKey !== apiKey) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or missing API key' });
  }
  next();
}

router.get('/', requireApiKey, (req, res) => {
  res.status(200).json({ message: 'Appointments API is working!' });
});

const jobEmitters = {};

router.post('/run', requireApiKey, async (req, res) => {
  try {
    const { jobId, ...options } = req.body || {};
    const id = jobId || uuidv4();
    if (!jobEmitters[id]) jobEmitters[id] = new EventEmitter();

    runAppointments({ emitter: jobEmitters[id], jobId: id, ...options })
      .then(() => {
        jobEmitters[id].emit('update', JSON.stringify({ done: true, message: 'Appointments automation completed!' }));
        setTimeout(() => delete jobEmitters[id], 60000);
      })
      .catch(err => {
        jobEmitters[id].emit('update', JSON.stringify({ error: 'Appointments automation failed', details: err.message }));
        setTimeout(() => delete jobEmitters[id], 60000);
      });

    res.status(200).json({ message: 'Job started', jobId: id });
  } catch (err) {
    res.status(500).json({ error: 'Appointments automation failed', details: err.message });
  }
});

router.get('/run/stream', requireApiKey, (req, res) => {
  const jobId = req.query.jobId;
  if (!jobId || !jobEmitters[jobId]) {
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

  const timeout = setTimeout(() => {
    cleanup();
  }, 8 * 60 * 1000);

  const keepAliveInterval = setInterval(() => {
    try {
      res.write(': keep-alive\n\n');
    } catch (e) {
      cleanup();
    }
  }, 20000);

  const onUpdate = (msg) => {
    res.write(`data: ${msg}\n\n`);
    const parsed = JSON.parse(msg);
    if (parsed.done || parsed.error) {
      cleanup();
    }
  };
  jobEmitters[jobId].on('update', onUpdate);

  req.on('close', () => {
    cleanup();
  });
});

module.exports = router;
