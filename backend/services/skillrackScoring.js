/**
 * SkillRack Scoring Engine
 * Implements FR-062: SkillRack Sub-Score calculation.
 *
 * Scoring is always computed for the ENTIRE PEER GROUP atomically.
 * Peer group = all students sharing the same department AND batch_year
 * (across all sections).
 */

const studentRepo = require('../repositories/studentRepo');
const classRepo = require('../repositories/classRepo');
const codingProfileRepo = require('../repositories/codingProfileRepo');
const skillRackScoreRepo = require('../repositories/skillRackScoreRepo');
const { recalculateScore } = require('./readinessScore');

// ── Constants (match environment config if provided) ───────────────────────
const CERT_CAP      = Number(process.env.SR_CERT_CAP      || 50);
const RANK_WEIGHT   = Number(process.env.SR_RANK_WEIGHT   || 0.80);
const CERT_WEIGHT   = Number(process.env.SR_CERT_WEIGHT   || 0.20);
const BASE_THRESHOLD_SEM1 = Number(process.env.SR_BASE_THRESHOLD_SEM1 || 500);

// ── Pure functions (easily unit-testable) ──────────────────────────────────

const semesterThreshold = (semester) =>
  BASE_THRESHOLD_SEM1 * Math.pow(2, semester - 1);

const computeRawPoints = (stats) =>
  (stats.code_track * 2) +
  (stats.dc         * 2) +
  (stats.dt         * 20) +
  (stats.code_test  * 30);

const computeBaseScore = (rawPoints, semester) => {
  const threshold = semesterThreshold(semester);
  if (rawPoints >= threshold) return 9.0;
  return Math.min(
    parseFloat((9.0 * (rawPoints / threshold)).toFixed(4)),
    8.99
  );
};

const computeRankBonus = (peerRank, peerTotal) => {
  if (peerTotal === 1) return RANK_WEIGHT;
  return parseFloat(
    (RANK_WEIGHT * (1 - (peerRank - 1) / (peerTotal - 1))).toFixed(4)
  );
};

const computeCertBonus = (certificates) =>
  parseFloat(
    (CERT_WEIGHT * Math.min(certificates / CERT_CAP, 1.0)).toFixed(4)
  );

// ── Main orchestration function ────────────────────────────────────────────

const recomputePeerGroup = async (classId) => {
  // 1. Resolve the peer group boundaries from the class document
  const cls = await classRepo.findById(classId);
  if (!cls) throw new Error(`Class ${classId} not found`);

  // 2. Find all classes in this cohort (same dept + batch_year)
  const peerClasses = await classRepo.find({ department: cls.department, batch_year: cls.batch_year });
  const classIds = peerClasses.map(c => c._id);

  // 3. Find all students belonging to any class in this peer group
  const students = await studentRepo.findAll({ class_id: { $in: classIds } });
  const studentIds = students.map(s => s._id);

  // 4. Fetch SkillRack profiles for all these students
  const profiles = await codingProfileRepo.find({
    student_id: { $in: studentIds },
    platform: 'skillrack'
  });

  const profileMap = new Map();
  for (const p of profiles) {
    profileMap.set(p.student_id.toString(), p.skillrack_stats);
  }

  // 5. Build a lookup map: student_id → class
  const classMap = new Map();
  for (const c of peerClasses) {
    classMap.set(c._id.toString(), c);
  }
  const studentClassMap = new Map();
  for (const s of students) {
    studentClassMap.set(s._id.toString(), classMap.get(s.class_id.toString()));
  }

  // Load previous scores to detect changes
  const previousScores = await skillRackScoreRepo.find({
    student_id: { $in: studentIds }
  }).select('student_id final_score');

  const prevMap = new Map();
  for (const p of previousScores) {
    prevMap.set(p.student_id.toString(), p.final_score);
  }

  // 6. Compute raw_points and base_score for every student
  const computed = students.map(s => {
    const sid    = s._id.toString();
    const stats  = profileMap.get(sid);
    const cls    = studentClassMap.get(sid);
    const sem    = cls?.semester || semester;

    if (!stats) {
      return {
        student_id:         s._id,
        class_id:           s.class_id,
        raw_points:         0,
        semester_threshold: semesterThreshold(sem),
        threshold_met:      false,
        base_score:         0,
        certificates:       0,
        peer_rank:          null,
        peer_total:         null,
        rank_bonus:         0,
        cert_bonus:         0,
        bonus_score:        0,
        final_score:        0,
        badges:             { gold: 0, silver: 0, bronze: 0 },
        solved:             0
      };
    }

    const rawPoints   = stats.raw_points ?? computeRawPoints(stats);
    const threshold   = semesterThreshold(sem);
    const baseScore   = computeBaseScore(rawPoints, sem);
    const certs       = stats.sr_certificates || 0;

    return {
      student_id:         s._id,
      class_id:           s.class_id,
      raw_points:         rawPoints,
      semester_threshold: threshold,
      threshold_met:      baseScore >= 9.0,
      base_score:         baseScore,
      certificates:       certs,
      peer_rank:          null,
      peer_total:         null,
      rank_bonus:         0,
      cert_bonus:         computeCertBonus(certs),
      bonus_score:        0,
      final_score:        baseScore,
      badges:             stats.badges || { gold: 0, silver: 0, bronze: 0 },
      solved:             stats.solved || 0
    };
  });

  // 7. Identify qualifiers (base_score === 9.0) and rank them
  const qualifiers = computed.filter(c => c.threshold_met);
  const peerTotal  = qualifiers.length;

  if (peerTotal > 0) {
    qualifiers.sort((a, b) => {
      if (b.raw_points !== a.raw_points) return b.raw_points - a.raw_points;
      if (b.badges.gold !== a.badges.gold) return b.badges.gold - a.badges.gold;
      if (b.badges.silver !== a.badges.silver) return b.badges.silver - a.badges.silver;
      if (b.badges.bronze !== a.badges.bronze) return b.badges.bronze - a.badges.bronze;
      if (b.certificates !== a.certificates) return b.certificates - a.certificates;
      if (b.solved !== a.solved) return b.solved - a.solved;
      return a.student_id.toString() < b.student_id.toString() ? -1 : 1;
    });

    qualifiers.forEach((q, idx) => {
      const rank       = idx + 1;
      const rankBonus  = computeRankBonus(rank, peerTotal);
      const certBonus  = q.cert_bonus;
      const bonusScore = parseFloat((rankBonus + certBonus).toFixed(4));
      const finalScore = parseFloat((9.0 + bonusScore).toFixed(4));

      q.peer_rank    = rank;
      q.peer_total   = peerTotal;
      q.rank_bonus   = rankBonus;
      q.bonus_score  = bonusScore;
      q.final_score  = finalScore;
    });
  }

  // 8. Merge qualifier updates back into the full computed array
  const scoreMap = new Map();
  for (const q of qualifiers) {
    scoreMap.set(q.student_id.toString(), q);
  }

  const finalScores = computed.map(c =>
    scoreMap.get(c.student_id.toString()) || c
  );

  // 9. Bulk upsert SkillRackScore
  const bulkOps = finalScores.map(score => {
    // Exclude 'badges' and 'solved' from the document we save to the DB 
    // as they are just used for tiebreaking here, or we can just save them (schema doesn't have them defined but it's fine).
    // Let's explicitly omit them to match the schema.
    const { badges, solved, ...dbDoc } = score;
    return {
      updateOne: {
        filter: { student_id: score.student_id },
        update: {
          $set: {
            ...dbDoc,
            last_computed_at: new Date()
          }
        },
        upsert: true
      }
    };
  });

  await skillRackScoreRepo.bulkWrite(bulkOps, { ordered: false });

  // 10. Recalculate readiness score for changed students
  const changedStudentIds = finalScores
    .filter(s => {
      const prev = prevMap.get(s.student_id.toString());
      return prev === undefined || Math.abs(prev - s.final_score) > 0.0001;
    })
    .map(s => s.student_id);

  for (const sid of changedStudentIds) {
    await recalculateScore(sid);
  }
};

module.exports = {
  recomputePeerGroup,
  semesterThreshold,
  computeRawPoints,
  computeBaseScore,
  computeRankBonus,
  computeCertBonus
};
