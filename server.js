const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');

const app = express();
const port = 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MongoDB setup (assuming MongoDB is being used)
mongoose.connect(process.env.DB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

// Mongoose schema and model
const quizResponseSchema = new mongoose.Schema({
  email: String,
  os: String,
  issue: String,
  manufacturer: String,
  customerService: String,
  phone: String,
});

const QuizResponse = mongoose.model('QuizResponse', quizResponseSchema);

// Nodemailer setup
const transporter = nodemailer.createTransport({
  service: 'gmail', // Use your email service provider
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Routes
app.post('/api/save', (req, res) => {
  const { email, os, issue, manufacturer, customerService, phone } = req.body;

  const newResponse = new QuizResponse({
    email,
    os,
    issue,
    manufacturer,
    customerService,
    phone,
  });

  newResponse.save()
    .then(() => {
      console.log('Data saved successfully');

      // Send email
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: process.env.RECEIVER_EMAIL, // The email where you want to receive the data
        subject: 'New Quiz Response',
        text: `
          Email: ${email}
          Operating System: ${os}
          Issue: ${issue.replace(/_/g, ' ')}
          Manufacturer: ${manufacturer}
          Customer Service: ${customerService}
          Phone: ${phone}
        `,
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error('Error sending email:', error);
          return res.status(500).send('Error sending email');
        }
        console.log('Email sent:', info.response);
        res.status(200).send('Data saved and email sent successfully');
      });
    })
    .catch(err => {
      console.error('Error saving data:', err);
      res.status(500).send('Error saving data');
    });
});

// Starting the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
