// RapidAPI Test Script
// Test your API with simulated RapidAPI headers

const API_BASE_URL = 'http://localhost:5000'; // Change to your deployed URL
const RAPIDAPI_KEY = 'test-api-key-12345';
const RAPIDAPI_HOST = 'api.yourdomain.com';

async function testAPI(endpoint, params = {}) {
  try {
    const url = new URL(endpoint, API_BASE_URL);
    Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
    
    console.log(`\n🧪 Testing: ${endpoint}`);
    console.log(`📍 URL: ${url.toString()}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': RAPIDAPI_HOST,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    
    // Show rate limit headers
    if (response.headers.get('x-ratelimit-requests-limit')) {
      console.log(`⏱️  Rate Limit: ${response.headers.get('x-ratelimit-requests-remaining')}/${response.headers.get('x-ratelimit-requests-limit')}`);
    }
    
    const data = await response.json();
    console.log('📋 Response:', JSON.stringify(data, null, 2));
    
    return { success: response.ok, data, status: response.status };
    
  } catch (error) {
    console.error(`❌ Error testing ${endpoint}:`, error.message);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('🚀 Starting RapidAPI Compliance Tests...\n');
  
  // Test 1: Health Check (no auth required)
  await testAPI('/health');
  
  // Test 2: Missing RapidAPI Key
  console.log('\n🔒 Testing authentication...');
  try {
    const response = await fetch(`${API_BASE_URL}/api/image/generate?prompt=test`, {
      headers: { 'X-RapidAPI-Host': RAPIDAPI_HOST } // Missing key
    });
    console.log(`🚫 No API Key Status: ${response.status}`);
    const data = await response.json();
    console.log('📋 Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('❌ Auth test error:', error.message);
  }
  
  // Test 3: Valid Image Generation
  await testAPI('/api/image/generate', {
    prompt: 'A beautiful sunset over mountains',
    model: 'flux',
    width: '512',
    height: '512',
    format: 'base64'
  });
  
  // Test 4: Invalid Parameters
  await testAPI('/api/image/generate', {
    // Missing prompt
    model: 'flux'
  });
  
  // Test 5: Text Generation
  await testAPI('/api/text/generate', {
    prompt: 'Write a short poem about technology',
    model: 'openai',
    max_tokens: '100'
  });
  
  // Test 6: Rate Limiting (multiple requests)
  console.log('\n⚡ Testing rate limiting...');
  for (let i = 1; i <= 3; i++) {
    console.log(`Request ${i}/3:`);
    await testAPI('/api/image/generate', {
      prompt: `Test image ${i}`,
      width: '256',
      height: '256'
    });
  }
  
  console.log('\n✅ Tests completed!');
}

// Run tests
runTests().catch(console.error);