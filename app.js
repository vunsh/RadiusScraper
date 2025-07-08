require('dotenv').config();
const express = require('express');
const cors = require('cors');
const reportRoutes = require('./routes/reportRoutes');
const appointmentsRoutes = require('./routes/appointmentsRoutes');
const reviewRoutes = require('./routes/reviewRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

const allowedOrigins = [
  'https://lossing-automation.vercel.app',
  'http://localhost:3000'
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); 
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error('Not allowed by CORS'));
    }
  }
};

app.use(cors(corsOptions)); 

app.use(express.json());
app.use('/api/reports', reportRoutes);
// app.use('/api/appointments', appointmentsRoutes);
// app.use('/api/reviews', reviewRoutes); maybe one day :(

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
