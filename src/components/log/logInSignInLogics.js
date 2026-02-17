import crypto from 'crypto';

export function generateToken(username, password) {
  // Combine username and password into a single string
  const combined = username + password;
  
  // Create a hash from the combined string
  const hash = crypto.createHash('sha256').update(combined).digest('hex');
  
  // Select random characters from the hash
  const tokenLength = 10; // Adjust token length as needed
  let token = '';
  for (let i = 0; i < tokenLength; i++) {
    const randomIndex = parseInt(hash[i], 16); // Use the hex value from the hash
    token += combined[randomIndex % combined.length];
  }

  return token;
}
