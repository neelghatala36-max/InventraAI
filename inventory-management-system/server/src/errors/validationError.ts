import mongoose from 'mongoose';

const validationError = (error: mongoose.Error.ValidationError) => {
  const errRes: Record<string, string> = {};

  Object.values(error.errors).forEach((err) => {
    if (err && 'path' in err && 'message' in err) {
      errRes[err.path] = err.message;
    }
  });

  return errRes;
};

export default validationError;
