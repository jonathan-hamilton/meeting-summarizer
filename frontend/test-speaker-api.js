// Quick test of speaker mapping API methods using fetch directly
async function testSpeakerMappingAPI() {
  try {
    console.log('🧪 Testing Speaker Mapping API methods...');
    
    const baseUrl = 'http://localhost:5029/api/SpeakerMapping';
    
    // Test data
    const testRequest = {
      transcriptionId: 'test-frontend-123',
      mappings: [
        {
          speakerId: 'Speaker 1',
          name: 'Alice Johnson',
          role: 'Product Manager',
          transcriptionId: 'test-frontend-123'
        },
        {
          speakerId: 'Speaker 2', 
          name: 'Bob Smith',
          role: 'Software Engineer',
          transcriptionId: 'test-frontend-123'
        }
      ]
    };

    // Test save
    console.log('📤 Testing saveSpeakerMappings...');
    const saveResponse = await fetch(`${baseUrl}/map`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testRequest)
    });
    
    if (!saveResponse.ok) {
      throw new Error(`Save failed: ${saveResponse.status} ${saveResponse.statusText}`);
    }
    
    const saveResult = await saveResponse.json();
    console.log('✅ Save result:', saveResult);

    // Test get
    console.log('📥 Testing getSpeakerMappings...');
    const getResponse = await fetch(`${baseUrl}/test-frontend-123`);
    
    if (!getResponse.ok) {
      throw new Error(`Get failed: ${getResponse.status} ${getResponse.statusText}`);
    }
    
    const getResult = await getResponse.json();
    console.log('✅ Get result:', getResult);

    console.log('🎉 All speaker mapping API tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run test
testSpeakerMappingAPI();
