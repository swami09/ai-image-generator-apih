import fs from 'fs';
import { imageUploader } from './server/services/image-uploader.js';

async function uploadImage() {
  try {
    // Read the decoded image file
    const imageBuffer = fs.readFileSync('attached_assets/decoded_image.jpg');
    
    console.log(`📊 Image size: ${imageBuffer.length} bytes`);
    
    // Upload using the image uploader service
    const result = await imageUploader.uploadWithFallback(imageBuffer, 'decoded_image.jpg');
    
    console.log('✅ Image uploaded successfully!');
    console.log(`🔗 Public URL: ${result.url}`);
    
    return result.url;
  } catch (error) {
    console.error('❌ Upload failed:', error.message);
  }
}

uploadImage();