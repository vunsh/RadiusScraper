const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const runReviews = require('../automation/runReviews');

function requireApiKey(req, res, next) {
  const apiKey = process.env.API_KEY;
  const providedKey = req.headers['x-api-key'] || req.query.apiKey || req.body?.apiKey;
  if (!apiKey || providedKey !== apiKey) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or missing API key' });
  }
  next();
}

router.get('/', requireApiKey, (req, res) => {
  res.status(200).json({ message: 'API Online!' });
});

router.post('/run', requireApiKey, async (req, res) => {
  try {
    const { centers, jobId } = req.body;
    if (!Array.isArray(centers) || centers.length === 0) {
      return res.status(400).json({ error: 'Missing required parameter: centers (must be a non-empty array)' });
    }
    await runReviews({ centers });
    res.status(200).json({ message: 'Review job started', jobId: jobId || uuidv4() });
  } catch (err) {
    res.status(500).json({ error: 'Review automation failed', details: err.message });
  }
});

module.exports = router;
