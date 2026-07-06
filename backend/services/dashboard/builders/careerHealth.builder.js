/**
 * Career Health Builder
 * Calculates the overall career health KPI based on multiple factors.
 */

function buildCareerHealth(profileCompletion, atsScore, codingDna, portfolioProgress) {
  // Simple heuristic weightings
  const profileWeight = 0.15;
  const atsWeight = 0.35;
  const codingWeight = 0.25;
  const portfolioWeight = 0.25;

  let totalScore = 0;
  totalScore += (profileCompletion || 0) * profileWeight;
  totalScore += (atsScore || 0) * atsWeight;
  totalScore += (codingDna || 0) * codingWeight;
  totalScore += (portfolioProgress || 0) * portfolioWeight;

  const score = Math.round(totalScore);
  
  let status = "Needs Improvement";
  if (score >= 85) status = "Excellent";
  else if (score >= 70) status = "Good";
  else if (score >= 50) status = "Average";

  // Simple recommendations logic
  const recommendationsCount = [
    profileCompletion < 100,
    atsScore < 70,
    codingDna < 60,
    portfolioProgress < 50
  ].filter(Boolean).length;

  return {
    score,
    status,
    breakdown: {
      profile: profileCompletion,
      ats: atsScore,
      coding: codingDna,
      portfolio: portfolioProgress
    },
    recommendations_count: recommendationsCount
  };
}

module.exports = { buildCareerHealth };
