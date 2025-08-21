import { NextRequest } from 'next/server';

export const mockRequest = (options: any = {}) => ({
  method: 'GET',
  headers: new Headers(),
  url: 'http://localhost:3000',
  ...options
});

export const mockResponse = () => {
  const res: any = {
    status: 200,
    headers: new Headers(),
    json: jest?.fn().mockResolvedValue({}) || (() => Promise.resolve({})),
    text: jest?.fn().mockResolvedValue('') || (() => Promise.resolve('')),
    setStatus: function(code: number) { this.status = code; return this; },
    setHeader: function(key: string, value: string) { this.headers.set(key, value); return this; }
  };
  return res;
};

export const createMockContext = () => ({
  req: mockRequest(),
  res: mockResponse(),
  params: {},
  query: {}
});

export default { mockRequest, mockResponse, createMockContext };