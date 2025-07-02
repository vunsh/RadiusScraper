const express = require('express');
const router = express.Router();

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

module.exports = router;
