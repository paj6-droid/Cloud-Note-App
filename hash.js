const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;

// Hash a password
async function hashPassword(password) {
  try {
    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    return hash;
  } catch (error) {
    throw new Error('Error hashing password: ' + error.message);
  }
}

// Compare password with hash
async function comparePassword(password, hash) {
  try {
    const match = await bcrypt.compare(password, hash);
    return match;
  } catch (error) {
    throw new Error('Error comparing password: ' + error.message);
  }
}

module.exports = {
  hashPassword,
  comparePassword
};

