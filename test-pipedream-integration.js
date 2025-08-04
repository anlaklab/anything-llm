#!/usr/bin/env node

const BASE_URL = 'http://localhost:3001/api';

async function testPipedreamIntegration() {
  console.log('🧪 Testing Pipedream MCP Integration...\n');

  // Test 1: Check if server is responsive
  console.log('1️⃣ Testing server connectivity...');
  try {
    const response = await fetch(`${BASE_URL}/mcp-servers/list`);
    const data = await response.json();
    console.log('✅ Server is responding:', data.success ? 'OK' : 'Error');
  } catch (error) {
    console.log('❌ Server connectivity failed:', error.message);
    return;
  }

  // Test 2: Check Pipedream MCP endpoints (they might not exist yet in Docker)
  console.log('\n2️⃣ Testing Pipedream MCP endpoints...');
  try {
    const response = await fetch(`${BASE_URL}/pipedream-mcp/health`);
    if (response.status === 404) {
      console.log('⚠️  Pipedream endpoints not found - integration needs deployment to Docker');
    } else {
      const data = await response.json();
      console.log('✅ Pipedream health check:', data);
    }
  } catch (error) {
    console.log('❌ Pipedream health check failed:', error.message);
  }

  // Test 3: Check MCP configuration
  console.log('\n3️⃣ Testing MCP configuration...');
  try {
    // This will tell us if the MCP layer can detect Pipedream config
    const testUserId = 'test-user-123';
    const response = await fetch(`${BASE_URL}/pipedream-mcp/auth/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId: testUserId })
    });
    
    if (response.status === 404) {
      console.log('⚠️  Pipedream MCP endpoints not available - needs deployment');
    } else {
      const data = await response.json();
      console.log('✅ Auth status response:', data);
    }
  } catch (error) {
    console.log('❌ Auth status test failed:', error.message);
  }

  // Test 4: Environment variable check (indirect)
  console.log('\n4️⃣ Testing environment configuration...');
  console.log('📝 To check if environment variables are set:');
  console.log('   - PIPEDREAM_CLIENT_ID should be set');
  console.log('   - PIPEDREAM_CLIENT_SECRET should be set');
  console.log('   - Check Docker container environment variables');

  // Test 5: Manual testing instructions
  console.log('\n📋 Manual Testing Steps:');
  console.log('');
  console.log('If endpoints are available:');
  console.log('1. Test auth status:');
  console.log(`   curl -X POST ${BASE_URL}/pipedream-mcp/auth/status \\`);
  console.log('     -H "Content-Type: application/json" \\');
  console.log('     -d \'{"userId": "test-user"}\'');
  console.log('');
  console.log('2. Start OAuth flow:');
  console.log(`   curl -X POST ${BASE_URL}/pipedream-mcp/auth/start \\`);
  console.log('     -H "Content-Type: application/json" \\');
  console.log('     -d \'{"userId": "test-user"}\'');
  console.log('');
  console.log('If endpoints return 404, the Docker container needs to be updated with new code.');
}

// Run the test
testPipedreamIntegration().catch(console.error);