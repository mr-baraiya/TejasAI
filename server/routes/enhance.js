import { Router } from 'express';
import { validatePrompt } from '../utils/validatePrompt.js';
import { moderatePrompt } from '../services/moderationService.js';
import { enhancePrompt } from '../services/aiService.js';
import {
  analyzePromptCompleteness,
  processClarificationStep,
} from '../services/clarificationService.js';
import { logPrompt } from '../services/db.js';

const router = Router();

/**
 * POST /api/enhance/analyze
 * Analyzes prompt completeness before enhancing.
 * Returns { success, needsClarification: false, enhancedPrompt, whyBetter } if sufficient.
 * Returns { success, needsClarification: true, question, questionIndex: 1 } if incomplete.
 */
router.post('/enhance/analyze', async (req, res, next) => {
  try {
    const validation = validatePrompt(req.body);

    if (!validation.isValid) {
      return res.status(validation.statusCode || 400).json({
        success: false,
        error: validation.error,
        code: validation.code || 'INVALID_INPUT',
      });
    }

    const { sanitizedPrompt, targetAI } = validation;

    // Context-aware content moderation
    const moderation = await moderatePrompt(sanitizedPrompt, { targetAI });
    if (!moderation.allowed) {
      return res.status(422).json({
        success: false,
        error: moderation.explanation,
        code: 'CONTENT_POLICY_VIOLATION',
        category: moderation.category,
      });
    }

    const result = await analyzePromptCompleteness({
      prompt: sanitizedPrompt,
      targetAI,
    });

    // If enhanced immediately, log prompt
    if (!result.needsClarification && result.enhancedPrompt) {
      const clientIp = req.ip || req.headers['x-forwarded-for'] || null;
      logPrompt({
        original: sanitizedPrompt,
        enhanced: result.enhancedPrompt,
        targetAI: targetAI || null,
        whyBetter: result.whyBetter || [],
        engineUsed: result.engineUsed || null,
        requestIp: clientIp,
      });
    }

    return res.status(200).json({
      success: true,
      ...result,
      meta: {
        targetAI,
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

/**
 * POST /api/enhance/clarify
 * Submits user's answer to a clarification question.
 * Returns next question or final enhanced prompt.
 */
router.post('/enhance/clarify', async (req, res, next) => {
  try {
    const {
      prompt,
      targetAI = 'any',
      clarificationHistory = [],
      currentQuestion = null,
      answer,
      skip = false,
    } = req.body;

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Original prompt is required.',
        code: 'MISSING_PROMPT',
      });
    }

    const sanitizedPrompt = prompt.trim();

    // Moderation check on prompt and answer
    const answerText = typeof answer === 'string' ? answer : JSON.stringify(answer || '');
    const moderation = await moderatePrompt(`${sanitizedPrompt} ${answerText}`, { targetAI });
    if (!moderation.allowed) {
      return res.status(422).json({
        success: false,
        error: moderation.explanation,
        code: 'CONTENT_POLICY_VIOLATION',
        category: moderation.category,
      });
    }

    const result = await processClarificationStep({
      prompt: sanitizedPrompt,
      targetAI,
      clarificationHistory,
      currentQuestion,
      answer,
      skip: Boolean(skip),
    });

    // If enhancement completed, log final prompt
    if (!result.needsClarification && result.enhancedPrompt) {
      const clientIp = req.ip || req.headers['x-forwarded-for'] || null;
      logPrompt({
        original: sanitizedPrompt,
        enhanced: result.enhancedPrompt,
        targetAI: targetAI || null,
        whyBetter: result.whyBetter || [],
        engineUsed: result.engineUsed || null,
        requestIp: clientIp,
      });
    }

    return res.status(200).json({
      success: true,
      ...result,
      meta: {
        targetAI,
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

/**
 * POST /api/enhance
 * Direct prompt enhancement endpoint (retained for backward compatibility and quick tweaks).
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

    // 3. Fire-and-forget prompt log
    const clientIp = req.ip || req.headers['x-forwarded-for'] || null;
    logPrompt({
      original: sanitizedPrompt,
      enhanced: result.enhancedPrompt,
      targetAI: targetAI || null,
      tweak: tweak || null,
      whyBetter: result.whyBetter || [],
      engineUsed: result.engineUsed || null,
      requestIp: clientIp,
    });

    return res.status(200).json({
      success: true,
      enhancedPrompt: result.enhancedPrompt,
      whyBetter: result.whyBetter,
      engineUsed: result.engineUsed,
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

