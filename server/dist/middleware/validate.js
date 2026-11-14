"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = validate;
exports.validateQuery = validateQuery;
const zod_1 = require("zod");
function validate(schema) {
    return async (req, res, next) => {
        try {
            const parsed = await schema.parseAsync(req.body);
            req.body = parsed;
            return next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Invalid request data provided',
                        details: error.errors.map((err) => ({
                            field: err.path.join('.'),
                            message: err.message,
                        })),
                    },
                });
            }
            return next(error);
        }
    };
}
function validateQuery(schema) {
    return async (req, res, next) => {
        try {
            const parsed = await schema.parseAsync(req.query);
            req.query = parsed;
            return next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'QUERY_VALIDATION_ERROR',
                        message: 'Invalid search/query parameters provided',
                        details: error.errors.map((err) => ({
                            field: err.path.join('.'),
                            message: err.message,
                        })),
                    },
                });
            }
            return next(error);
        }
    };
}
