import { Router } from 'express';
import { validatePrompt } from '../utils/validatePrompt.js';
import { moderatePrompt } from '../services/moderationService.js';
import { enhancePrompt } from '../services/aiService.js';

const router = Router();

/**
 * POST /api/enhance
 * Accepts user prompt and options, validates, performs context-aware content moderation,
 * calls Groq AI service, and returns { success, enhancedPrompt, whyBetter, meta }.
 * Never logs sensitive prompt content.
 */
router.post('/enhance', async (req, res, next) => {
  try {
    const validation = validatePrompt(req.body);

    if (!validation.isValid) {
      return res.status(validation.statusCode || 400).json({
        success: false,
        error: validation.error,
        code: validation.code || 'INVALID_INPUT',
      });
    }

    const { sanitizedPrompt, targetAI, tweak, previousResult } = validation;

    // 1. Context-aware content moderation (server-side before enhancement)
    const moderation = await moderatePrompt(sanitizedPrompt, { targetAI });
    if (!moderation.allowed) {
      // Do not log sensitive prompt text
      if (typeof console !== 'undefined' && console.info) {
        console.info(`[TejasAI Moderation] Blocked request under category: ${moderation.category}`);
      }
      return res.status(422).json({
        success: false,
        error: moderation.explanation,
        code: 'CONTENT_POLICY_VIOLATION',
        category: moderation.category,
      });
    }

    // 2. Intent-preserving prompt enhancement
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
    if (error.isRefused || error.statusCode === 422) {
      return res.status(422).json({
        success: false,
        error: error.message || "Sorry, we can't help with that request.",
        code: error.code || 'CONTENT_POLICY_VIOLATION',
        category: error.category || 'content_policy',
      });
    }
    next(error);
  }
});

export default router;
