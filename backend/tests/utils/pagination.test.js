const { paginate, buildMeta } = require('../../utils/pagination');

describe('Pagination Utils', () => {
  describe('paginate()', () => {
    it('should return default skip, limit, and page when no arguments are provided', () => {
      const result = paginate();
      expect(result).toEqual({ skip: 0, limit: 20, page: 1 });
    });

    it('should calculate skip correctly for valid page and limit', () => {
      const result = paginate(2, 10);
      expect(result).toEqual({ skip: 10, limit: 10, page: 2 });
    });

    it('should parse string inputs correctly', () => {
      const result = paginate('3', '15');
      expect(result).toEqual({ skip: 30, limit: 15, page: 3 });
    });

    it('should handle invalid or zero page/limit inputs by defaulting sensibly', () => {
      expect(paginate(0, 10)).toEqual({ skip: 0, limit: 10, page: 1 });
      expect(paginate(-5, 10)).toEqual({ skip: 0, limit: 10, page: 1 });
      // limit=0 is falsy, so the `|| 20` default kicks in (same as omitting it)
      expect(paginate(1, 0)).toEqual({ skip: 0, limit: 20, page: 1 });
      // a negative limit is truthy, so it only gets floored to 1 by Math.max
      expect(paginate(1, -5)).toEqual({ skip: 0, limit: 1, page: 1 });
      expect(paginate('abc', 'def')).toEqual({ skip: 0, limit: 20, page: 1 });
    });
  });

  describe('buildMeta()', () => {
    it('should return metadata correctly for default values', () => {
      const result = buildMeta(50);
      expect(result).toEqual({ total: 50, page: 1, limit: 20, pages: 3 });
    });

    it('should return correct metadata for valid page and limit', () => {
      const result = buildMeta(50, 2, 10);
      expect(result).toEqual({ total: 50, page: 2, limit: 10, pages: 5 });
    });

    it('should parse string inputs correctly', () => {
      const result = buildMeta('45', '3', '15');
      expect(result).toEqual({ total: '45', page: 3, limit: 15, pages: 3 });
    });

    it('should handle zero total correctly', () => {
      const result = buildMeta(0, 1, 10);
      expect(result).toEqual({ total: 0, page: 1, limit: 10, pages: 0 });
    });
  });
});