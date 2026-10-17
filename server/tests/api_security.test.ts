import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';

describe('API Security & Route Protection', () => {
  it('GET /health responds with 200 or 503 depending on db', async () => {
    const res = await request(app).get('/health');
    expect([200, 503]).toContain(res.status);
  });

  it('GET /api/admin/dashboard rejects unauthenticated requests with 401', async () => {
    const res = await request(app).get('/api/admin/dashboard');
    expect(res.status).toBe(401);
    expect(res.body.error?.code).toBe('UNAUTHENTICATED');
  });

  it('GET /api/stores rejects unauthenticated requests with 401', async () => {
    const res = await request(app).get('/api/stores');
    expect(res.status).toBe(401);
    expect(res.body.error?.code).toBe('UNAUTHENTICATED');
  });

  it('GET /api/owner/dashboard rejects unauthenticated requests with 401', async () => {
    const res = await request(app).get('/api/owner/dashboard');
    expect(res.status).toBe(401);
    expect(res.body.error?.code).toBe('UNAUTHENTICATED');
  });

  it('POST /api/auth/login rejects requests missing CSRF header', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user@example.com', password: 'Password@1' });
    expect(res.status).toBe(403);
    expect(res.body.error?.code).toBe('CSRF_ERROR');
  });

  it('Returns standard error payload without leaking stack traces', async () => {
    const res = await request(app).get('/api/invalid-route-that-does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
    expect(res.body.error).toHaveProperty('message');
    expect(res.body.error).toHaveProperty('code');
    expect(res.body.error).not.toHaveProperty('stack');
  });
});
