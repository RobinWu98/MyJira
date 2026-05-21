import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";

export class NotFoundError extends Error {
  statusCode = 404;
}

export class BadRequestError extends Error {
  statusCode = 400;
}

export class UnauthorizedError extends Error {
  statusCode = 401;
}

export class ForbiddenError extends Error {
  statusCode = 403;
}

export class ConflictError extends Error {
  statusCode = 409;
}

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof ZodError) {
    return res.status(400).json({
      message: "Validation failed",
      issues: error.flatten()
    });
  }

  const statusCode = typeof error.statusCode === "number" ? error.statusCode : 500;
  const message = error instanceof Error ? error.message : "Unexpected server error";

  return res.status(statusCode).json({ message });
};
