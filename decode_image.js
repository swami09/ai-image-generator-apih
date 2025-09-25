const fs = require('fs');

// Read the base64 data from the file
const fileContent = fs.readFileSync('attached_assets/Pasted--image-base64-9j-4QWeRXhpZgAASUkqAAgAAAAIAA0BAgAFAAAAfgAAABIBAwABAAAAAQAAABoBBQABAAAAbgAAABs-1756049898678_1756049898685.txt', 'utf8');

// Extract the base64 string (it's in quotes after "image_base64": ")
const match = fileContent.match(/"image_base64":\s*"([^"]+)"/);
if (match) {
  const base64Data = match[1];
  
  // Convert base64 to binary data
  const imageBuffer = Buffer.from(base64Data, 'base64');
  
  // Save as JPG file
  fs.writeFileSync('attached_assets/decoded_image.jpg', imageBuffer);
  
  console.log('✅ Image saved as decoded_image.jpg');
  console.log(`📊 Image size: ${imageBuffer.length} bytes`);
} else {
  console.log('❌ Could not extract base64 data');
}