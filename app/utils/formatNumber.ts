type ScoreType = 'overall' | 'sauce' | 'crispy' | 'meat';

export const formatNumber = (num: number, type: ScoreType = 'overall') => {
  if (type === 'overall') {
    return Number(num).toFixed(1);
  }
  // For sauce, crispy, and meat, return whole numbers
  return Math.round(Number(num)).toString();
}; 