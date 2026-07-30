// Currently Placement domain is not fully implemented in terms of application repositories
// For Phase B2, we mock the base structure until Placement Migration.
const build = async (studentId) => {
  return {
    placement: {
      eligible: true, // Will be computed by Placement service rules
      applied: 0,
      placed: false,
      company: '',
      package_lpa: 0
    }
  };
};
module.exports = { build };
