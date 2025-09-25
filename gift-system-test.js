// Gift System Test Script
// Test the gift code redemption and subscription tiers

const API_BASE_URL = 'http://localhost:5000';
const RAPIDAPI_KEY = 'test-api-key-12345';
const RAPIDAPI_HOST = 'api.yourdomain.com';

async function testGiftSystem() {
  console.log('🎁 Testing Gift Code System...\n');
  
  // Test 1: Check available gift codes
  console.log('1. 📋 Checking available gift codes...');
  try {
    const response = await fetch(`${API_BASE_URL}/api/gift-codes`, {
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': RAPIDAPI_HOST
      }
    });
    const data = await response.json();
    console.log('✅ Available gift codes:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Test 2: Check subscription status (should be free tier initially)
  console.log('2. 👤 Checking initial subscription status...');
  try {
    const response = await fetch(`${API_BASE_URL}/api/subscription/status`, {
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': RAPIDAPI_HOST
      }
    });
    const data = await response.json();
    console.log('✅ Initial status:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Test 3: Redeem a gift code
  console.log('3. 🎟️ Redeeming gift code WELCOME999...');
  try {
    const response = await fetch(`${API_BASE_URL}/api/redeem-gift`, {
      method: 'POST',
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': RAPIDAPI_HOST,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ gift_code: 'WELCOME999' })
    });
    const data = await response.json();
    console.log('✅ Gift redemption result:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Test 4: Check subscription status after gift redemption
  console.log('4. 🎁 Checking subscription status after gift...');
  try {
    const response = await fetch(`${API_BASE_URL}/api/subscription/status`, {
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': RAPIDAPI_HOST
      }
    });
    const data = await response.json();
    console.log('✅ Status after gift:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Test 5: Try to redeem the same gift code again (should fail)
  console.log('5. 🚫 Trying to redeem WELCOME999 again (should fail)...');
  try {
    const response = await fetch(`${API_BASE_URL}/api/redeem-gift`, {
      method: 'POST',
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': RAPIDAPI_HOST,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ gift_code: 'WELCOME999' })
    });
    const data = await response.json();
    console.log('✅ Expected failure:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Test 6: Generate some images to test usage tracking
  console.log('6. 🖼️ Generating images to test usage tracking...');
  for (let i = 1; i <= 3; i++) {
    console.log(`\n   Image ${i}/3:`);
    try {
      const response = await fetch(`${API_BASE_URL}/api/image/generate?prompt=Test%20image%20${i}&width=256&height=256`, {
        headers: {
          'X-RapidAPI-Key': RAPIDAPI_KEY,
          'X-RapidAPI-Host': RAPIDAPI_HOST
        }
      });
      
      console.log(`   📊 Status: ${response.status}`);
      console.log(`   📈 Tier: ${response.headers.get('x-subscription-tier')}`);
      console.log(`   📉 Remaining: ${response.headers.get('x-ratelimit-requests-remaining')}`);
      console.log(`   🎯 Total Remaining: ${response.headers.get('x-total-images-remaining')}`);
      
      const data = await response.json();
      if (data.usage) {
        console.log(`   💻 Usage: ${data.usage.images_used_today}/${data.usage.total_images_used} used`);
      }
    } catch (error) {
      console.error('   ❌ Error:', error.message);
    }
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Test 7: Final status check
  console.log('7. 📊 Final subscription status...');
  try {
    const response = await fetch(`${API_BASE_URL}/api/subscription/status`, {
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': RAPIDAPI_HOST
      }
    });
    const data = await response.json();
    console.log('✅ Final status:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  console.log('\n🎉 Gift system testing completed!');
  
  // Summary
  console.log('\n📋 Summary:');
  console.log('• Gift codes available: WELCOME999, LAUNCH2024, BETA999, RAPIDAPI999, CLOUDFLARE999');
  console.log('• Free tier: 25 images/day, unlimited total');
  console.log('• Gift tier: 100 images/day, 999 total images');
  console.log('• Starter tier: 500 images/day, unlimited total ($9.99)');
  console.log('• Enterprise tier: 5000 images/day, unlimited total ($49.99)');
}

// Run the test
testGiftSystem().catch(console.error);