const studentRepo = require('../../repositories/studentRepo');
const codingProfileRepo = require('../../repositories/codingProfileRepo');

class ProfileUpdateService {
  static async updateBasic(studentId, payload) {
    const updateData = {};
    const allowed = ['full_name', 'phone', 'alternate_phone', 'gender', 'date_of_birth', 'city', 'state', 'country', 'pincode'];
    
    allowed.forEach(field => {
      if (payload[field] !== undefined) updateData[field] = payload[field];
    });

    if (payload.languages !== undefined) {
      updateData.languages_known = payload.languages;
    }

    if (Object.keys(updateData).length > 0) {
      await studentRepo.updateById(studentId, updateData);
    }
  }

  static async updateAcademic(studentId, payload) {
    const updateData = {};
    const allowed = ['department', 'section', 'semester', 'cgpa']; // Only safe non-identifying updates
    
    allowed.forEach(field => {
      if (payload[field] !== undefined) updateData[field] = payload[field];
    });

    if (Object.keys(updateData).length > 0) {
      await studentRepo.updateById(studentId, updateData);
    }
  }

  static async updateCareer(studentId, payload) {
    const updateData = {};
    const allowed = ['career_objective', 'preferred_job_role'];
    
    allowed.forEach(field => {
      if (payload[field] !== undefined) updateData[field] = payload[field];
    });

    if (payload.preferred_locations && Array.isArray(payload.preferred_locations) && payload.preferred_locations.length > 0) {
      updateData.preferred_work_location = payload.preferred_locations[0]; // Legacy fallback, if multiple needed then schema needs changing to Array
    } else if (payload.preferred_locations !== undefined) {
      updateData.preferred_work_location = "";
    }

    if (Object.keys(updateData).length > 0) {
      await studentRepo.updateById(studentId, updateData);
    }
  }

  static async updateSocial(studentId, payload) {
    // 1. Update basic links on Student
    const student = await studentRepo.findById(studentId);
    if (!student) return;

    const links = { ...(student.links?.toObject ? student.links.toObject() : (student.links || {})) };
    
    // Only basic social links (coding platforms are handled via codingProfile module typically)
    const allowedSocial = ['github', 'linkedin', 'portfolio'];
    let updated = false;

    allowedSocial.forEach(field => {
      if (payload[field] !== undefined) {
        links[field] = payload[field];
        updated = true;
      }
    });

    if (updated) {
      await studentRepo.updateById(studentId, { links });
    }

    // Note: If they pass coding platform urls (leetcode, etc), we might want to trigger the codingProfileController
    // But per RFC, updating social links only updates URLs. Coding profiles auto-sync is complex.
    // For now, if leetcode/hackerrank/codechef/codeforces/skillrack are passed, we save them to Student.links as well as fallback.
    const codingPlatforms = ['leetcode', 'hackerrank', 'codechef', 'codeforces', 'skillrack'];
    let codingUpdated = false;
    codingPlatforms.forEach(field => {
      if (payload[field] !== undefined) {
        links[field] = payload[field];
        codingUpdated = true;
      }
    });

    if (codingUpdated) {
      await studentRepo.updateById(studentId, { links });
    }
  }
}

module.exports = ProfileUpdateService;
