/**
 * Manual Test for Session API Endpoints (S3.1)
 * Run this in browser console to test session functionality
 */

const testSessionAPI = async () => {
  const baseURL = 'http://localhost:5029';
  const sessionId = `test_session_${Date.now()}`;
  
  console.log('🧪 Testing Session API Endpoints');
  console.log('Session ID:', sessionId);
  
  try {
    // Test 1: Apply Session Override
    console.log('\n1️⃣ Testing Apply Session Override...');
    const applyResponse = await fetch(`${baseURL}/api/SpeakerMapping/session/override`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        speakerId: 'speaker_001',
        newName: 'John Doe',
        sessionId: sessionId
      })
    });
    
    if (applyResponse.ok) {
      const applyData = await applyResponse.json();
      console.log('✅ Apply Override Success:', applyData);
    } else {
      console.log('❌ Apply Override Failed:', applyResponse.status, await applyResponse.text());
    }
    
    // Test 2: Get Session Status
    console.log('\n2️⃣ Testing Get Session Status...');
    const statusResponse = await fetch(`${baseURL}/api/SpeakerMapping/session/status/${sessionId}`);
    
    if (statusResponse.ok) {
      const statusData = await statusResponse.json();
      console.log('✅ Session Status Success:', statusData);
    } else {
      console.log('❌ Session Status Failed:', statusResponse.status, await statusResponse.text());
    }
    
    // Test 3: Revert Session Override
    console.log('\n3️⃣ Testing Revert Session Override...');
    const revertResponse = await fetch(`${baseURL}/api/SpeakerMapping/session/revert`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        speakerId: 'speaker_001',
        sessionId: sessionId
      })
    });
    
    if (revertResponse.ok) {
      const revertData = await revertResponse.json();
      console.log('✅ Revert Override Success:', revertData);
    } else {
      console.log('❌ Revert Override Failed:', revertResponse.status, await revertResponse.text());
    }
    
    // Test 4: Clear Session Data
    console.log('\n4️⃣ Testing Clear Session Data...');
    const clearResponse = await fetch(`${baseURL}/api/SpeakerMapping/session/clear`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionId: sessionId
      })
    });
    
    if (clearResponse.ok) {
      console.log('✅ Clear Session Data Success');
    } else {
      console.log('❌ Clear Session Data Failed:', clearResponse.status, await clearResponse.text());
    }
    
    console.log('\n🎉 Session API Test Complete');
    
  } catch (error) {
    console.error('💥 Test Error:', error);
  }
};

// Health check endpoint
const testHealthEndpoint = async () => {
  try {
    console.log('🔍 Testing Health Endpoint...');
    const response = await fetch('http://localhost:5029/api/health');
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Health Check Success:', data);
    } else {
      console.log('❌ Health Check Failed:', response.status);
    }
  } catch (error) {
    console.error('💥 Health Check Error:', error);
  }
};

console.log('📋 Manual Test Scripts Loaded');
console.log('Run testHealthEndpoint() to test health endpoint');
console.log('Run testSessionAPI() to test session endpoints');

// Export for use in browser console
if (typeof window !== 'undefined') {
  window.testSessionAPI = testSessionAPI;
  window.testHealthEndpoint = testHealthEndpoint;
}
