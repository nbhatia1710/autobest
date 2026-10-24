import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { isValidEmail, isValidPassword } from '../utils/validators.js';

export class AuthService {
  constructor(userRepository, jwtSecret = process.env.JWT_SECRET || 'autobest-secret-key-development', jwtExpiresIn = '24h') {
    this.userRepository = userRepository;
    this.jwtSecret = jwtSecret;
    this.jwtExpiresIn = jwtExpiresIn;
  }

  async register({ email, password }) {
    if (!isValidEmail(email)) {
      const error = new Error('Please enter a valid email address.');
      error.statusCode = 400;
      error.code = 'INVALID_EMAIL';
      throw error;
    }

    if (!isValidPassword(password, 6)) {
      const error = new Error('Password must be at least 6 characters long.');
      error.statusCode = 400;
      error.code = 'WEAK_PASSWORD';
      throw error;
    }

    const existingUser = this.userRepository.findByEmail(email);
    if (existingUser) {
      const error = new Error('This email already exists. Please sign in.');
      error.statusCode = 409;
      error.code = 'EMAIL_EXISTS';
      throw error;
    }

    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);
    const id = crypto.randomUUID();

    // Enforce role to 'customer' strictly, preventing privilege escalation
    const newUser = this.userRepository.create({
      id,
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      role: 'customer',
    });

    return {
      user: {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
      },
    };
  }

  async login({ email, password }) {
    if (!email || !password) {
      const error = new Error('Email and password are required.');
      error.statusCode = 400;
      error.code = 'MISSING_CREDENTIALS';
      throw error;
    }

    const user = this.userRepository.findByEmail(email);
    if (!user) {
      const error = new Error('Invalid email or password.');
      error.statusCode = 401;
      error.code = 'INVALID_CREDENTIALS';
      throw error;
    }

    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) {
      const error = new Error('Invalid email or password.');
      error.statusCode = 401;
      error.code = 'INVALID_CREDENTIALS';
      throw error;
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const token = jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.jwtExpiresIn,
    });

    return {
      access_token: token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  }
}
