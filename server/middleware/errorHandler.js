/**
 * Centralized error handling middleware for TejasAI backend.
 * Ensures internal details, stack traces, and API secrets are never exposed to clients.
 */
export function errorHandler(err, req, res, next) {
  // Log sanitized error message to server console for debugging
  console.error(`[Server Error] ${new Date().toISOString()} - ${req.method} ${req.originalUrl}:`, err.message || err);

  const statusCode = err.statusCode || (res.statusCode !== 200 ? res.statusCode : 500);

  // Default user-safe message
  let userMessage = err.message || 'An unexpected server error occurred. Please try again.';

  // If status is 500 and no custom user message was provided, keep it strictly generic
  if (statusCode === 500 && !err.isCustomError) {
    userMessage = 'An unexpected server error occurred. Please try again later.';
  }

  res.status(statusCode).json({
    success: false,
    error: userMessage,
  });
}
