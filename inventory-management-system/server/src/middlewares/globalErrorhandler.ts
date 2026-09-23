/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-unused-vars */
import { ZodError } from 'zod';
import mongoose from 'mongoose';
import { ErrorRequestHandler } from 'express';
import config from '../config';
import zodErrorSanitize from '../errors/zodErrorSanitize';
import validationError from '../errors/validationError';
import castError from '../errors/castError';
import handleCustomError from '../errors/handleCustomError';
import CustomError from '../errors/customError';
import httpStatus from 'http-status';

const globalErrorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (config.nodeEnv !== 'production') {
    console.error('❌ Server Error Caught:', err?.name || 'Error', err?.message);
  }

  const errorResponse = {
    success: false,
    statusCode: 500,
    message: err?.message || 'Internal Server Error!',
    errors: {},
    stack: config.nodeEnv === 'production' ? null : err.stack
  };

  if (err instanceof ZodError) {
    const errors = zodErrorSanitize(err);

    errorResponse.statusCode = httpStatus.BAD_REQUEST;
    errorResponse.message = 'Validation Failed!';
    errorResponse.errors = errors;
  } else if (err?.name === 'ValidationError') {
    const errors = validationError(err as mongoose.Error.ValidationError);

    errorResponse.statusCode = httpStatus.BAD_REQUEST;
    errorResponse.message = 'Validation Failed!';
    errorResponse.errors = errors;
  } else if (err?.name === 'CastError') {
    const errors = castError();

    errorResponse.statusCode = httpStatus.BAD_REQUEST;
    errorResponse.message = 'Cast Error!';
    errorResponse.errors = errors;
  } else if (err instanceof CustomError) {
    const errors = handleCustomError(err);

    errorResponse.statusCode = err.statusCode;
    errorResponse.message = err.message;
    errorResponse.errors = errors;
  } else if (err?.code === 11000 && err?.keyValue) {
    const [key, value] = Object.entries(err.keyValue)[0];

    errorResponse.statusCode = httpStatus.CONFLICT;
    errorResponse.message = `${key.charAt(0).toUpperCase() + key.slice(1)} already exists!`;
    errorResponse.errors = { [key]: `${value} is already registered.` };
  }

  return res.status(errorResponse.statusCode).json(errorResponse);
};

export default globalErrorHandler;
