const mongoose = require('mongoose');
const VerificationLog = require('../../models/VerificationLog');
const { createStudent, createFaculty } = require('../helpers/factories');

describe('VerificationLog model — append-only guards', () => {
  let log;

  beforeAll(async () => {
    const { student } = await createStudent();
    const { user } = await createFaculty();

    log = await VerificationLog.create({
      item_type: 'skill',
      item_id: new mongoose.Types.ObjectId(),
      student_id: student._id,
      actor_id: user._id,
      action: 'submitted',
      comment: 'Initial submission'
    });
  });

  test('findOneAndUpdate is blocked', async () => {
    await expect(
      VerificationLog.findOneAndUpdate({ _id: log._id }, { comment: 'edited' })
    ).rejects.toThrow('verification_logs is append-only — updates are not allowed');
  });

  test('updateOne is blocked', async () => {
    await expect(
      VerificationLog.updateOne({ _id: log._id }, { comment: 'edited' })
    ).rejects.toThrow('verification_logs is append-only — updates are not allowed');
  });

  test('updateMany is blocked', async () => {
    await expect(
      VerificationLog.updateMany({ _id: log._id }, { comment: 'edited' })
    ).rejects.toThrow('verification_logs is append-only — updates are not allowed');
  });

  test('findOneAndDelete is blocked', async () => {
    await expect(
      VerificationLog.findOneAndDelete({ _id: log._id })
    ).rejects.toThrow('verification_logs is append-only — deletes are not allowed');
  });

  test('deleteOne is blocked', async () => {
    await expect(
      VerificationLog.deleteOne({ _id: log._id })
    ).rejects.toThrow('verification_logs is append-only — deletes are not allowed');
  });

  test('deleteMany is blocked', async () => {
    await expect(
      VerificationLog.deleteMany({ _id: log._id })
    ).rejects.toThrow('verification_logs is append-only — deletes are not allowed');
  });

  test('create (insert) is allowed and persists the document', async () => {
    const found = await VerificationLog.findById(log._id);
    expect(found).toBeTruthy();
    expect(found.action).toBe('submitted');
    expect(found.item_type).toBe('skill');
  });
});
