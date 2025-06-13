const express = require('express');
const router = express.Router();
const runReport = require('../automation/runReport');
const config = require('../constants/config.json');
const { EventEmitter } = require('events');
const { v4: uuidv4 } = require('uuid');

const jobEmitters = {};

router.post('/run', async (req, res) => {
  try {
    const { report, region, filter, jobId } = req.body;
    if (!report) {
      return res.status(400).json({ error: 'Missing required parameter: report' });
    }
    const reportUrl = config.reports && config.reports[report];
    if (!reportUrl) {
      return res.status(400).json({ error: `Unknown report: ${report}` });
    }
    const id = jobId || uuidv4();
    if (!jobEmitters[id]) jobEmitters[id] = new EventEmitter();

    // Pass emitter to runReport for streaming updates
    runReport({ report: reportUrl, region, filter, emitter: jobEmitters[id], jobId: id })
      .then(() => {
        jobEmitters[id].emit('update', JSON.stringify({ done: true, message: 'Report automation completed!' }));
        setTimeout(() => delete jobEmitters[id], 60000);
      })
      .catch(err => {
        jobEmitters[id].emit('update', JSON.stringify({ error: 'Automation failed', details: err.message }));
        setTimeout(() => delete jobEmitters[id], 60000);
      });

    res.status(200).json({ message: 'Job started', jobId: id });
  } catch (err) {
    res.status(500).json({ error: 'Automation failed', details: err.message });
  }
});

// SSE endpoint for streaming updates
router.get('/run/stream', (req, res) => {
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

  const onUpdate = (msg) => {
    res.write(`data: ${msg}\n\n`);
    if (JSON.parse(msg).done || JSON.parse(msg).error) {
      res.end();
      jobEmitters[jobId].removeListener('update', onUpdate);
    }
  };
  jobEmitters[jobId].on('update', onUpdate);

  req.on('close', () => {
    jobEmitters[jobId].removeListener('update', onUpdate);
  });
});

module.exports = router;
