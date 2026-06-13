const { success, error } = require('../../utils/response');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('response utility', () => {
  describe('success()', () => {
    test('sends 200 with data and null error by default', () => {
      const res = mockRes();
      success(res, { id: 1 });

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { id: 1 },
        error: null,
        meta: {}
      });
    });

    test('respects custom statusCode', () => {
      const res = mockRes();
      success(res, { id: 1 }, {}, 201);

      expect(res.status).toHaveBeenCalledWith(201);
    });

    test('includes meta in response', () => {
      const res = mockRes();
      success(res, [], { total: 0, page: 1 });

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ meta: { total: 0, page: 1 } })
      );
    });
  });

  describe('error()', () => {
    test('sends 400 with error object by default', () => {
      const res = mockRes();
      error(res, 'Bad input');

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        data: null,
        error: { message: 'Bad input', code: null }
      });
    });

    test('respects custom statusCode and code', () => {
      const res = mockRes();
      error(res, 'Not found', 404, 'NOT_FOUND');

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: { message: 'Not found', code: 'NOT_FOUND' } })
      );
    });
  });
});
