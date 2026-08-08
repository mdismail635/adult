/**
 * Generates a SHA-1 signature for Cloudinary signed uploads using client-side Web Crypto API.
 * Parameters must be sorted alphabetically and appended with the API Secret (no '&' before the secret).
 * 
 * @param {Object} params - Object containing parameters to sign
 * @param {string} apiSecret - Cloudinary API Secret
 * @returns {Promise<string>} - Hex-encoded SHA-1 signature
 */
export async function generateCloudinarySignature(params, apiSecret) {
  // 1. Sort the parameters alphabetically by key
  const sortedKeys = Object.keys(params).sort();
  
  // 2. Build the parameter string: "key1=value1&key2=value2"
  const paramString = sortedKeys
    .map(key => `${key}=${params[key]}`)
    .join('&');
  
  // 3. Append the API Secret directly to the parameter string
  const stringToSign = `${paramString}${apiSecret}`;
  
  // 4. Calculate SHA-1 hash of the stringToSign
  const encoder = new TextEncoder();
  const data = encoder.encode(stringToSign);
  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  
  // 5. Convert hash buffer to hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map(bytes => bytes.toString(16).padStart(2, '0'))
    .join('');
    
  return hashHex;
}
