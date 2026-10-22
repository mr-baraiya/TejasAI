import { Router } from 'express';
import { validatePrompt } from '../utils/validatePrompt.js';
import { enhancePrompt } from '../services/aiService.js';

const router = Router();

/**
 * POST /api/enhance
 * Accepts user prompt and options, validates, calls Groq AI service,
 * and returns { success, enhancedPrompt, whyBetter, meta }.
 * Do not log prompt text anywhere.
 */
router.post('/enhance', async (req, res, next) => {
  try {
    const validation = validatePrompt(req.body);

    if (!validation.isValid) {
      return res.status(validation.statusCode || 400).json({
        success: false,
        error: validation.error,
      });
    }

    const { sanitizedPrompt, targetAI, tweak, previousResult } = validation;

    const result = await enhancePrompt({
      prompt: sanitizedPrompt,
      targetAI,
      tweak,
      previousResult,
    });

    return res.status(200).json({
      success: true,
      enhancedPrompt: result.enhancedPrompt,
      whyBetter: result.whyBetter,
      meta: {
        targetAI,
        tweak: tweak || null,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
