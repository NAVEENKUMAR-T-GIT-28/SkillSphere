export const getTotalSolvedProblems = (platforms) => {
  const lc = platforms?.leetcode?.data?.totalSolved || 0;
  const sr = platforms?.skillrack?.data?.solved || 0;
  
  const hr = platforms?.hackerrank?.data?.badges?.reduce(
    (sum, badge) => sum + (badge.solved || 0),
    0
  ) || 0;

  return lc + sr + hr;
};
