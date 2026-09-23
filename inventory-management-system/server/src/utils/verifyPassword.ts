import bcrypt from 'bcrypt';
import httpStatus from 'http-status';
import CustomError from '../errors/customError';

const verifyPassword = async (password: string, hashedPassword: string) => {
  const matchedPassword = await bcrypt.compare(password, hashedPassword);

  if (!matchedPassword) {
    throw new CustomError(httpStatus.UNAUTHORIZED, 'Invalid email or password', 'WrongCredentials');
  }
};

export default verifyPassword;
