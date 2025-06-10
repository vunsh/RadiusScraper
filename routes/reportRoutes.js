const express = require('express');
const router = express.Router();
const runReport = require('../automation/runReport');

router.post('/run', async (req, res) => {
  try {
    await runReport();
    res.status(200).json({ message: 'Report automation completed!' });
  } catch (err) {
    res.status(500).json({ error: 'Automation failed', details: err.message });
  }
});

module.exports = router;
