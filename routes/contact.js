const express = require('express');
const router = express.Router();
const Contact = require('../models/Contact');
const nodemailer = require('nodemailer');

// Create transporter for sending emails
const transporter = nodemailer.createTransport({
  // Configure with your email service
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// @route   POST /api/contact
// @desc    Submit contact form
// @access  Public
router.post('/', async (req, res) => {
  try {
    const { name, email, interestArea, message } = req.body;

    let savedContact = null;
    
    // Try to save to database if MongoDB is available
    try {
      const contact = new Contact({
        name,
        email,
        interestArea,
        message,
      });
      savedContact = await contact.save();
    } catch (dbError) {
      console.log('Database save failed, but continuing with email:', dbError.message);
    }

    // Send email notification (this will work even without database)
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: 'jatinmahajan1713@gmail.com',
      subject: `New Contact Form Submission: ${interestArea}`,
      replyTo: email,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>From:</strong> ${name} (${email})</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Interest Area:</strong> ${interestArea}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
        <p><strong>Submitted at:</strong> ${new Date().toLocaleString()}</p>
        <hr>
        <p><em>You can reply directly to this email to respond to ${name}</em></p>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.status(201).json({
      success: true,
      message: 'Contact form submitted successfully',
      data: savedContact,
    });
  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting contact form',
      error: error.message,
    });
  }
});

// @route   GET /api/contact
// @desc    Get all contacts (admin only)
// @access  Private
router.get('/', async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      count: contacts.length,
      data: contacts,
    });
  } catch (error) {
    console.error('Get contacts error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching contacts',
      error: error.message,
    });
  }
});

module.exports = router;
