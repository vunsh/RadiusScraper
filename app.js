require('dotenv').config();
const express = require('express');
const reportRoutes = require('./routes/reportRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use('/api/reports', reportRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
