const { ZodError } = require('zod');

/**
 * Generic validation middleware wrapping a Zod schema
 */
function validateBody(schema) {
  return (req, res, next) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: err.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        });
      }
      return res.status(400).json({ success: false, error: 'Malformed request data' });
    }
  };
}

module.exports = { validateBody };
