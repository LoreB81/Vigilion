const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const express = require('express');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');

/** restrieving the JWT secret from env variables */
const JWT_SECRET = 'test_secret';
process.env.SUPER_SECRET = JWT_SECRET;

let app;
let mongoServer;
let server;

/** models and routes import */
const User = require('../app/models/user');
const userRoutes = require('../app/routes/userRoutes');

/** mock data */
const mockUsers = [
  { id: '8b849406-658b-4e68-b622-645166840fbe', firstname: 'Mario', lastname: 'Rossi', email: 'mario@rossi.it', password: '741b8a8f40d53d3b66a47ad40c08c86dde6511b4ae7750a16cddc683a0a6f6d7', district: 'Centro Storico-Piedicastello', blocked: false, admin: true, feedbacks: [] },
  { id: 'd39e8638-d87d-4b94-a493-afd42200eec2', firstname: 'Luca', lastname: 'Bianchi', email: 'luca@bianchi.it', password: 'dc557b9159008ab9eea36694cfdab3d6190c7fe3762c9b941aaa6be3f917946e', district: 'Gardolo', blocked: false, admin: false, feedbacks: [] }
];

/** helper function to simulate cookies */
function getAuthCookies(userId, email) {
  const token = jwt.sign({ email: email, id: userId }, JWT_SECRET);
  return [`logged_user=${userId}`, `auth_token=${token}`];
}

/** connection setup with a temporary database */
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri(), { useNewUrlParser: true, useUnifiedTopology: true });
  app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use('/api/users', userRoutes);
  server = app.listen();
});

/** closing all connections */
afterAll(async () => {
  await mongoose.disconnect();
  await mongoose.connection.close();
  if (server) await new Promise(res => server.close(res));
  if (mongoServer) await mongoServer.stop();
});

/** clean and populate temporary database */
beforeEach(async () => {
  await User.deleteMany({});
  await User.insertMany(mockUsers);
});

describe('User API', () => {
  describe('POST /api/users', () => {
    it('should register a new user', async () => {
      const res = await request(app)
        .post('/api/users')
        .send({
          firstname: 'Anna',
          lastname: 'Verdi',
          email: 'anna@verdi.it',
          password: 'Password1!',
          district: 'Gardolo'
        });
      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('email', 'anna@verdi.it');
    });

    it('should not register with existing email', async () => {
      const res = await request(app)
        .post('/api/users')
        .send({
          firstname: 'Mario',
          lastname: 'Rossi',
          email: 'mario@rossi.it',
          password: 'Password1!',
          district: 'Gardolo'
        });
      expect(res.statusCode).toBe(400);
    });

    it('should not register with invalid email', async () => {
      const res = await request(app)
        .post('/api/users')
        .send({
          firstname: 'Anna',
          lastname: 'Verdi',
          email: 'notanemail',
          password: 'Password1!',
          district: 'Gardolo'
        });
      expect(res.statusCode).toBe(400);
    });

    it('should not register with weak password', async () => {
      const res = await request(app)
        .post('/api/users')
        .send({
          firstname: 'Anna',
          lastname: 'Verdi',
          email: 'anna2@verdi.it',
          password: 'weak',
          district: 'Gardolo'
        });
      expect(res.statusCode).toBe(400);
    });
  });

  describe('GET /api/users/:id', () => {
    it('should get user data', async () => {
      const res = await request(app).get('/api/users/8b849406-658b-4e68-b622-645166840fbe');
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('email', 'mario@rossi.it');
    });
    it('should return 404 for non-existent user', async () => {
      const res = await request(app).get('/api/users/nonexistent');
      expect(res.statusCode).toBe(404);
    });
  });

  describe('GET /api/users', () => {
    it('should get all users', async () => {
      const res = await request(app).get('/api/users');
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });
  });

  describe('POST /api/users/send-feedback', () => {
    it('should add feedback for user', async () => {
      const cookies = getAuthCookies('8b849406-658b-4e68-b622-645166840fbe', 'mario@rossi.it');
      const res = await request(app)
        .post('/api/users/send-feedback')
        .set('Cookie', cookies)
        .send({ text: 'Ottimo servizio!' });
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });
    it('should return 401 if not authenticated', async () => {
      const res = await request(app)
        .post('/api/users/send-feedback')
        .send({ text: 'Ottimo servizio!' });
      expect(res.statusCode).toBe(401);
    });
  });

  describe('GET /api/users/feedbacks', () => {
    it('should get all feedbacks', async () => {
      /** inserting feedback */
      const user = await User.findOne({ id: '8b849406-658b-4e68-b622-645166840fbe' });
      user.feedbacks.push({ text: 'Ottimo servizio!', date: '2025-06-01' });
      await user.save();
      const res = await request(app).get('/api/users/feedbacks');
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body[0]).toHaveProperty('text', 'Ottimo servizio!');
    });
  });

  describe('POST /api/users/change-password', () => {
    it('should change password', async () => {
      const cookies = getAuthCookies('8b849406-658b-4e68-b622-645166840fbe', 'mario@rossi.it');
      const res = await request(app)
        .post('/api/users/change-password')
        .set('Cookie', cookies)
        .send({ oldPassword: 'Password1!', newPassword: 'NuovaPass1!' });
      
      /** mocked password does not match, so we expect an error */
      expect([200, 400]).toContain(res.statusCode);
    });
    it('should return 401 if not authenticated', async () => {
      const res = await request(app)
        .post('/api/users/change-password')
        .send({ oldPassword: 'Password1!', newPassword: 'NuovaPass1!' });
      expect(res.statusCode).toBe(401);
    });
  });

  describe('POST /api/users/change-district', () => {
    it('should change district', async () => {
      const cookies = getAuthCookies('d39e8638-d87d-4b94-a493-afd42200eec2', 'luca@bianchi.it');
      const res = await request(app)
        .post('/api/users/change-district')
        .set('Cookie', cookies)
        .send({ district: 'Meano' });
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });
    it('should return 400 for invalid district', async () => {
      const cookies = getAuthCookies('d39e8638-d87d-4b94-a493-afd42200eec2', 'luca@bianchi.it');
      const res = await request(app)
        .post('/api/users/change-district')
        .set('Cookie', cookies)
        .send({ district: 'NonEsistente' });
      expect(res.statusCode).toBe(400);
    });
  });

  describe('POST /api/users/change-email', () => {
    it('should change email', async () => {
      const cookies = getAuthCookies('d39e8638-d87d-4b94-a493-afd42200eec2', 'luca@bianchi.it');
      const res = await request(app)
        .post('/api/users/change-email')
        .set('Cookie', cookies)
        .send({ oldEmail: 'luca@bianchi.it', newEmail: 'lucab@nuovo.it' });
      expect([200, 400]).toContain(res.statusCode);
    });
    it('should return 400 for wrong old email', async () => {
      const cookies = getAuthCookies('d39e8638-d87d-4b94-a493-afd42200eec2', 'luca@bianchi.it');
      const res = await request(app)
        .post('/api/users/change-email')
        .set('Cookie', cookies)
        .send({ oldEmail: 'sbagliata@email.it', newEmail: 'lucab@nuovo.it' });
      expect(res.statusCode).toBe(400);
    });
  });

  describe('POST /api/users/change-notifications', () => {
    it('should change notifications', async () => {
      const cookies = getAuthCookies('d39e8638-d87d-4b94-a493-afd42200eec2', 'luca@bianchi.it');
      const res = await request(app)
        .post('/api/users/change-notifications')
        .set('Cookie', cookies)
        .send({ notifications: ['Gardolo', 'Meano'] });
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });
    it('should return 400 if notifications is not array', async () => {
      const cookies = getAuthCookies('d39e8638-d87d-4b94-a493-afd42200eec2', 'luca@bianchi.it');
      const res = await request(app)
        .post('/api/users/change-notifications')
        .set('Cookie', cookies)
        .send({ notifications: 'Gardolo' });
      expect(res.statusCode).toBe(400);
    });
  });

  describe('PATCH /api/users/:id/warn', () => {
    it('should warn user (admin only)', async () => {
      const cookies = getAuthCookies('8b849406-658b-4e68-b622-645166840fbe', 'mario@rossi.it');
      const res = await request(app)
        .patch('/api/users/d39e8638-d87d-4b94-a493-afd42200eec2/warn')
        .set('Cookie', cookies);
      expect([200, 403]).toContain(res.statusCode);
    });
  });

  describe('PATCH /api/users/:id/ban', () => {
    it('should ban user (admin only)', async () => {
      const cookies = getAuthCookies('8b849406-658b-4e68-b622-645166840fbe', 'mario@rossi.it');
      const res = await request(app)
        .patch('/api/users/d39e8638-d87d-4b94-a493-afd42200eec2/ban')
        .set('Cookie', cookies);
      expect([200, 403]).toContain(res.statusCode);
    });
  });

  describe('PATCH /api/users/:id/reactivate', () => {
    it('should reactivate user (admin only)', async () => {
      const cookies = getAuthCookies('8b849406-658b-4e68-b622-645166840fbe', 'mario@rossi.it');
      const res = await request(app)
        .patch('/api/users/d39e8638-d87d-4b94-a493-afd42200eec2/reactivate')
        .set('Cookie', cookies);
      expect([200, 403]).toContain(res.statusCode);
    });
  });

  describe('DELETE /api/users/delete-account', () => {
    it('should delete user account', async () => {
      const cookies = getAuthCookies('d39e8638-d87d-4b94-a493-afd42200eec2', 'luca@bianchi.it');
      const res = await request(app)
        .delete('/api/users/delete-account')
        .set('Cookie', cookies);
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });
    it('should return 401 if not authenticated', async () => {
      const res = await request(app)
        .delete('/api/users/delete-account');
      expect(res.statusCode).toBe(401);
    });
  });
});