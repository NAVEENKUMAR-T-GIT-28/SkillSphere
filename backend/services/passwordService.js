const bcrypt = require('bcryptjs');

class PasswordService {
  /**
   * Generates a secure, 12-character temporary password.
   */
  static generateTemporaryPassword() {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    // Ensure at least one of each required type
    password += 'A'; // uppercase
    password += 'a'; // lowercase
    password += '1'; // number
    password += '@'; // special
    
    for (let i = password.length; i < 12; i++) {
      password += chars[Math.floor(Math.random() * chars.length)];
    }
    
    // Shuffle the string
    return password.split('').sort(() => 0.5 - Math.random()).join('');
  }

  static async hashPassword(password) {
    return bcrypt.hash(password, 12);
  }

  static validatePolicy(password, policy = { min_length: 12, require_special: true }) {
    if (!password) return { valid: false, message: 'Password is required' };
    if (password.length < policy.min_length) {
      return { valid: false, message: `Password must be at least ${policy.min_length} characters long` };
    }
    if (policy.require_special && !/[!@#$%^&*]/.test(password)) {
      return { valid: false, message: 'Password must contain at least one special character (!@#$%^&*)' };
    }
    return { valid: true };
  }
}

module.exports = PasswordService;
