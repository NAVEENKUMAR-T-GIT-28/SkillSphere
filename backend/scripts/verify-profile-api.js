/**
 * Phase 2.5 — Profile API Verification Script
 * Run: node scripts/verify-profile-api.js
 * 
 * This script tests the GET /api/v1/student/profile endpoint
 * to verify the DTO contract is correct.
 */
const http = require('http');

const BASE = 'http://localhost:5000';

function request(method, path, token, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function main() {
  console.log('=== Phase 2.5 Profile API Verification ===\n');

  // Step 1: Health check
  console.log('1. Health check...');
  const health = await request('GET', '/api/health');
  console.log(`   Status: ${health.status} ${health.status === 200 ? '✓' : '✗'}`);

  // Step 2: Login to get a token
  const email = process.argv[2] || process.env.TEST_EMAIL;
  const password = process.argv[3] || process.env.TEST_PASSWORD;
  
  if (!email || !password) {
    console.log('\n2. Login skipped — provide credentials:');
    console.log('   node scripts/verify-profile-api.js <email> <password>');
    return;
  }
  
  console.log(`\n2. Logging in as ${email}...`);
  const login = await request('POST', '/api/auth/login', null, { email, password });
  
  if (login.status !== 200 || !login.body?.data?.token) {
    console.log(`   Login failed: ${login.status}`, login.body?.error?.message || '');
    return;
  }
  const token = login.body.data.token;
  console.log(`   Login: ✓ (token obtained)`);

  // Step 3: GET /api/v1/student/profile
  console.log('\n3. GET /api/v1/student/profile...');
  const profile = await request('GET', '/api/v1/student/profile', token);
  console.log(`   Status: ${profile.status}`);
  
  if (profile.status !== 200) {
    console.log('   ERROR:', JSON.stringify(profile.body, null, 2));
    return;
  }

  const data = profile.body.data;
  
  // Step 4: DTO Contract Verification
  console.log('\n4. DTO Contract Verification...');
  
  const checks = [];
  
  // Check envelope
  checks.push(['success field exists', profile.body.success === true]);
  checks.push(['data field exists', !!data]);
  checks.push(['error is null', profile.body.error === null]);
  
  // Check student block
  checks.push(['student block exists', !!data?.student]);
  checks.push(['student.id exists', !!data?.student?.id]);
  checks.push(['student.full_name is string', typeof data?.student?.full_name === 'string']);
  checks.push(['student.email is string', typeof data?.student?.email === 'string']);
  checks.push(['student.phone is string', typeof data?.student?.phone === 'string']);
  checks.push(['student.roll_number is string', typeof data?.student?.roll_number === 'string']);
  checks.push(['student.department is string', typeof data?.student?.department === 'string']);
  checks.push(['student.languages is array', Array.isArray(data?.student?.languages)]);
  checks.push(['student.preferred_locations is array', Array.isArray(data?.student?.preferred_locations)]);
  
  // Check no raw Mongo fields
  checks.push(['no _id in student', !data?.student?._id]);
  checks.push(['no __v in response', data?.__v === undefined]);
  checks.push(['no user_id in response', data?.student?.user_id === undefined]);
  checks.push(['no class_id in response', data?.student?.class_id === undefined]);

  // Check social_links block
  checks.push(['social_links block exists', !!data?.social_links]);
  checks.push(['social_links.github is string', typeof data?.social_links?.github === 'string']);
  checks.push(['social_links.linkedin is string', typeof data?.social_links?.linkedin === 'string']);
  
  // Check resume block
  checks.push(['resume block exists', !!data?.resume]);
  checks.push(['resume.uploaded is boolean', typeof data?.resume?.uploaded === 'boolean']);

  // Check statistics block
  checks.push(['statistics block exists', !!data?.statistics]);
  checks.push(['statistics.projects is number', typeof data?.statistics?.projects === 'number']);
  checks.push(['statistics.skills is number', typeof data?.statistics?.skills === 'number']);
  
  // Check profile_completion block
  checks.push(['profile_completion block exists', !!data?.profile_completion]);
  checks.push(['completion.percentage is number', typeof data?.profile_completion?.percentage === 'number']);
  checks.push(['completion.completed_sections is array', Array.isArray(data?.profile_completion?.completed_sections)]);
  checks.push(['completion.missing_sections is array', Array.isArray(data?.profile_completion?.missing_sections)]);
  checks.push(['completion.progress is array', Array.isArray(data?.profile_completion?.progress)]);
  
  let passed = 0, failed = 0;
  for (const [label, ok] of checks) {
    if (ok) { passed++; console.log(`   ✓ ${label}`); }
    else { failed++; console.log(`   ✗ ${label}`); }
  }
  
  console.log(`\n   Results: ${passed} passed, ${failed} failed`);

  // Step 5: Print actual values for visual verification
  console.log('\n5. Actual Data Values...');
  console.log(`   Name:       ${data?.student?.full_name}`);
  console.log(`   Email:      ${data?.student?.email}`);
  console.log(`   Phone:      ${data?.student?.phone}`);
  console.log(`   Roll:       ${data?.student?.roll_number}`);
  console.log(`   Dept:       ${data?.student?.department}`);
  console.log(`   Batch:      ${data?.student?.batch_year}`);
  console.log(`   CGPA:       ${data?.student?.cgpa}`);
  console.log(`   City:       ${data?.student?.city}`);
  console.log(`   State:      ${data?.student?.state}`);
  console.log(`   DOB:        ${data?.student?.date_of_birth}`);
  console.log(`   Languages:  ${JSON.stringify(data?.student?.languages)}`);
  console.log(`   Job Role:   ${data?.student?.preferred_job_role}`);
  console.log(`   Location:   ${JSON.stringify(data?.student?.preferred_locations)}`);
  console.log(`   GitHub:     ${data?.social_links?.github}`);
  console.log(`   LinkedIn:   ${data?.social_links?.linkedin}`);
  console.log(`   Portfolio:  ${data?.social_links?.portfolio}`);
  console.log(`   Projects:   ${data?.statistics?.projects}`);
  console.log(`   Skills:     ${data?.statistics?.skills}`);
  console.log(`   Resume:     ${data?.resume?.uploaded ? 'Uploaded' : 'Not uploaded'}`);
  console.log(`   Completion: ${data?.profile_completion?.percentage}%`);
  console.log(`   Sections:   ${data?.profile_completion?.completed_sections?.join(', ') || 'none'}`);
  console.log(`   Missing:    ${data?.profile_completion?.missing_sections?.join(', ') || 'none'}`);

  // Step 6: Test unauthorized request
  console.log('\n6. Unauthorized request (no token)...');
  const noAuth = await request('GET', '/api/v1/student/profile');
  checks.push(['401 without token', noAuth.status === 401]);
  console.log(`   Status: ${noAuth.status} ${noAuth.status === 401 ? '✓' : '✗'}`);

  // Step 7: Test invalid token
  console.log('\n7. Invalid token...');
  const badAuth = await request('GET', '/api/v1/student/profile', 'invalid-token');
  console.log(`   Status: ${badAuth.status} ${badAuth.status === 401 ? '✓' : '✗'}`);

  console.log('\n=== Verification Complete ===');
}

main().catch(err => {
  console.error('Script error:', err.message);
  process.exit(1);
});
