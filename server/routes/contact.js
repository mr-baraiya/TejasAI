import { Router } from 'express';
import { logContactSubmission } from '../services/db.js';

const router = Router();

/**
 * POST /contact (or /api/contact)
 * Accepts contact & feedback inquiries.
 */
router.post('/contact', async (req, res) => {
  try {
    const { name, email, category = 'Feedback', phone = '', comments } = req.body || {};

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        field: 'name',
        error: 'Please enter your name (at least 2 characters).',
      });
    }

    if (!email || typeof email !== 'string' || !emailRegex.test(email.trim())) {
      return res.status(400).json({
        success: false,
        field: 'email',
        error: 'Please enter a valid email address (e.g. name@example.com).',
      });
    }

    if (phone && typeof phone === 'string' && phone.trim()) {
      const phoneRegex = /^[\d\s+\-()]{7,20}$/;
      if (!phoneRegex.test(phone.trim())) {
        return res.status(400).json({
          success: false,
          field: 'phone',
          error: 'Please enter a valid phone number format.',
        });
      }
    }

    if (!comments || typeof comments !== 'string' || comments.trim().length < 5) {
      return res.status(400).json({
        success: false,
        field: 'comments',
        error: 'Please provide at least 5 characters for your comments or feedback.',
      });
    }

    const sanitizedData = {
      name: name.trim().slice(0, 100),
      email: email.trim().toLowerCase().slice(0, 150),
      category: (category || 'Feedback').toString().trim().slice(0, 50),
      phone: (phone || '').toString().trim().slice(0, 30),
      comments: comments.trim().slice(0, 3000),
      requestIp: req.ip || req.headers['x-forwarded-for'] || null,
    };

    console.info(`[Contact Form] New submission from ${sanitizedData.name} <${sanitizedData.email}> [Category: ${sanitizedData.category}]`);

    // Best-effort database logging (non-blocking)
    await logContactSubmission(sanitizedData);

    return res.status(200).json({
      success: true,
      message: 'Thank you! Your response has been submitted successfully.',
    });
  } catch (err) {
    console.error('[Contact Form Error]:', err.message);
    return res.status(500).json({
      success: false,
      error: 'An internal error occurred while saving your response. Please try again.',
    });
  }
});

export default router;
