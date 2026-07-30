require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const studentRepo = require('../repositories/studentRepo');
const { buildProjection } = require('../services/studentSync/projection.builder');

const BATCH_SIZE = parseInt(process.env.STUDENT_SYNC_BATCH_SIZE) || 100;

async function run() {
  console.log(`Starting StudentSearch Rebuild...`);
  console.log(`Batch Size: ${BATCH_SIZE}`);
  
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI not found in env');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  
  const totalStudents = await studentRepo.countDocuments({ academic_status: { $ne: 'DROPPED' } });
  console.log(`Total Active Students to Process: ${totalStudents}`);

  const startTime = Date.now();
  let processed = 0;
  let succeeded = 0;
  let failed = 0;
  let skipped = 0;
  
  const failedStudents = [];
  
  // Streaming only active students
  const cursor = studentRepo.findMany({ 
    academic_status: { $ne: 'DROPPED' } 
  }).cursor();
  
  let batch = [];
  
  const processBatch = async (currentBatch) => {
    const promises = currentBatch.map(async (student) => {
      try {
        await buildProjection(student._id, 'RebuildScript');
        succeeded++;
      } catch (err) {
        failed++;
        failedStudents.push({ id: student._id, error: err.message });
      }
    });
    
    await Promise.all(promises);
    processed += currentBatch.length;
    
    const elapsedSeconds = (Date.now() - startTime) / 1000;
    const rate = processed / elapsedSeconds;
    const remaining = totalStudents - processed;
    const etaSeconds = rate > 0 ? (remaining / rate) : 0;
    
    console.log(`Processed: ${processed}/${totalStudents} | Succeeded: ${succeeded} | Failed: ${failed} | Skipped: ${skipped} | Elapsed: ${elapsedSeconds.toFixed(1)}s | ETA: ${etaSeconds.toFixed(1)}s`);
  };

  for await (const student of cursor) {
    batch.push(student);
    if (batch.length >= BATCH_SIZE) {
      await processBatch(batch);
      batch = [];
    }
  }
  
  if (batch.length > 0) {
    await processBatch(batch);
  }
  
  const durationMs = Date.now() - startTime;
  
  console.log('\n--- Rebuild Complete ---');
  console.log(`Total Processed: ${processed}`);
  console.log(`Succeeded: ${succeeded}`);
  console.log(`Failed: ${failed}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Duration: ${(durationMs / 1000).toFixed(1)}s\n`);
  
  const report = {
    totals: { processed, succeeded, failed, skipped },
    duration_ms: durationMs,
    failed_students: failedStudents
  };
  
  fs.writeFileSync(path.join(__dirname, '..', 'rebuild-report.json'), JSON.stringify(report, null, 2));
  console.log('Report saved to backend/rebuild-report.json');
  
  process.exit(0);
}

run().catch(err => {
  console.error('Fatal Rebuild Error:', err);
  process.exit(1);
});
