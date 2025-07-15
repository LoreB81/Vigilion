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
const Report = require('../app/models/report');
const User = require('../app/models/user');
const reportRoutes = require('../app/routes/reportRoutes');

/** mock district checker, doesn't work like the real one */
jest.mock('../app/districtChecker', () => jest.fn(async (location) => {
  let loc = location;
  if (typeof location === 'string') {
    try { loc = JSON.parse(location); } catch { loc = {}; }
  }
  if (loc && loc.lat === 0 && loc.lng === 0) return 'Error';
  return 'Centro Storico-Piedicastello';
}));

/** mock data */
const mockUsers = [
  { id: '8b849406-658b-4e68-b622-645166840fbe', firstname: 'Mario', lastname: 'Rossi', email: 'mario@rossi.it', password: '741b8a8f40d53d3b66a47ad40c08c86dde6511b4ae7750a16cddc683a0a6f6d7', district: 'Centro Storico-Piedicastello', blocked: false },
  { id: 'd39e8638-d87d-4b94-a493-afd42200eec2', firstname: 'Luca', lastname: 'Bianchi', email: 'luca@bianchi.it', password: 'dc557b9159008ab9eea36694cfdab3d6190c7fe3762c9b941aaa6be3f917946e', district: 'Gardolo', blocked: true }
];

const mockReports = [
  { id: 1, user: '8b849406-658b-4e68-b622-645166840fbe', typology: 'Furto', notes: 'Bici rubata', location: JSON.stringify({ lat: 46.07, lng: 11.12 }), district: 'Centro Storico-Piedicastello', upvote: 2, downvote: 0, createdtime: '2025-06-01 12:00' },
  { id: 2, user: '8b849406-658b-4e68-b622-645166840fbe', typology: 'Aggressione', notes: 'Lite in strada', location: JSON.stringify({ lat: 46.08, lng: 11.13 }), district: 'Centro Storico-Piedicastello', upvote: 1, downvote: 0, createdtime: '2025-06-02 13:00' },
  { id: 3, user: '8b849406-658b-4e68-b622-645166840fbe', typology: 'Aggressione', notes: 'Lite in strada', location: JSON.stringify({ lat: 46.08, lng: 11.13 }), district: 'Centro Storico-Piedicastello', upvote: 1, downvote: 0, createdtime: '2025-06-02 13:00' },
  { id: 4, user: '8b849406-658b-4e68-b622-645166840fbe', typology: 'Aggressione', notes: 'Lite in strada', location: JSON.stringify({ lat: 46.08, lng: 11.13 }), district: 'Centro Storico-Piedicastello', upvote: 1, downvote: 0, createdtime: '2025-06-02 13:00' },
  { id: 5, user: '8b849406-658b-4e68-b622-645166840fbe', typology: 'Aggressione', notes: 'Lite in strada', location: JSON.stringify({ lat: 46.08, lng: 11.13 }), district: 'Centro Storico-Piedicastello', upvote: 1, downvote: 0, createdtime: '2025-06-02 13:00' },
  { id: 6, user: '8b849406-658b-4e68-b622-645166840fbe', typology: 'Aggressione', notes: 'Lite in strada', location: JSON.stringify({ lat: 46.08, lng: 11.13 }), district: 'Centro Storico-Piedicastello', upvote: 1, downvote: 0, createdtime: '2025-06-02 13:00' }
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
  app.use('/api/reports', reportRoutes);
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
  await Report.deleteMany({});
  await User.insertMany(mockUsers);
  await Report.insertMany(mockReports);
});

describe('Report API', () => {
  describe('GET /api/reports', () => {
    it('should return all reports (200)', async () => {
      const res = await request(app).get('/api/reports');
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('should return 404 if no reports', async () => {
      await Report.deleteMany({});
      const res = await request(app).get('/api/reports');
      expect(res.statusCode).toBe(404);
    });
  });

  describe('GET /api/reports/latest', () => {
    it('should return the latest 5 reports (200)', async () => {
      const res = await request(app).get('/api/reports/latest');
      expect(res.statusCode).toBe(200);
      expect(res.body.length).toBeLessThanOrEqual(5);
    });

    it('should return 404 if no reports', async () => {
      await Report.deleteMany({});
      const res = await request(app).get('/api/reports/latest');
      expect(res.statusCode).toBe(404);
    });
  });

  describe('GET /api/reports/:id', () => {
    it('should return a single report (200)', async () => {
      const report = await Report.findOne({});
      const res = await request(app).get(`/api/reports/${report.id}`);
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('id', report.id);
    });

    it('should return 404 if report not found', async () => {
      const res = await request(app).get('/api/reports/9999');
      expect(res.statusCode).toBe(404);
    });
  });

  describe('POST /api/reports', () => {
    it('should create a report (201)', async () => {
      const cookies = getAuthCookies('8b849406-658b-4e68-b622-645166840fbe', 'mario@rossi.it');
      const res = await request(app)
        .post('/api/reports')
        .set('Cookie', cookies)
        .send({
          typology: 'Furto',
          notes: 'Test segnalazione',
          location: JSON.stringify({ lat: 46.07, lng: 11.12 }),
          createdtime: '2025-06-03 10:00'
        });
      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('typology', 'Furto');
      expect(res.body).toHaveProperty('district', 'Centro Storico-Piedicastello');
    });

    it('should return 400 if required fields are missing', async () => {
      const cookies = getAuthCookies('8b849406-658b-4e68-b622-645166840fbe', 'mario@rossi.it');
      const res = await request(app)
        .post('/api/reports')
        .set('Cookie', cookies)
        .send({});
      expect(res.statusCode).toBe(400);
    });

    it('should return 404 if user not found', async () => {
      const cookies = getAuthCookies('utenteNonEsistente', 'mailnon@esistente.it');
      const res = await request(app)
        .post('/api/reports')
        .set('Cookie', cookies)
        .send({
          typology: 'Furto',
          notes: 'Test segnalazione',
          location: JSON.stringify({ lat: 46.07, lng: 11.12 }),
        });
      expect(res.statusCode).toBe(404);
    });

    it('should return 403 if user is banned', async () => {
      const cookies = getAuthCookies('d39e8638-d87d-4b94-a493-afd42200eec2', 'luca@bianchi.it');
      const res = await request(app)
        .post('/api/reports')
        .set('Cookie', cookies)
        .send({
          typology: 'Furto',
          notes: 'Test segnalazione',
          location: JSON.stringify({ lat: 46.07, lng: 11.12 }),
        });
      expect(res.statusCode).toBe(403);
    });

    it('should return 422 if location is not in any district', async () => {
      const cookies = getAuthCookies('8b849406-658b-4e68-b622-645166840fbe', 'mario@rossi.it');
      const res = await request(app)
        .post('/api/reports')
        .set('Cookie', cookies)
        .send({
          typology: 'Furto',
          notes: 'Test segnalazione',
          location: JSON.stringify({ lat: 0, lng: 0 })
        });
      expect(res.statusCode).toBe(422);
    });
  });

  describe('POST /api/reports/filtered', () => {
    it('should return filtered reports (200)', async () => {
      const res = await request(app)
        .post('/api/reports/filtered')
        .send({ startDate: '2025-06-01', endDate: '2025-06-30', district: 'Centro Storico-Piedicastello', typology: 'Furto' });
      expect([200, 204]).toContain(res.statusCode);
      if (res.statusCode === 200) {
        expect(Array.isArray(res.body)).toBe(true);
      }
    });

    it('should return 204 if no reports match', async () => {
      const res = await request(app)
        .post('/api/reports/filtered')
        .send({ startDate: '2025-01-01', endDate: '2025-01-02', district: 'Gardolo', typology: 'Altro' });
      expect(res.statusCode).toBe(204);
    });
  });

  describe('POST /api/reports/by-districts', () => {
    it('should return reports for given districts (200)', async () => {
      const res = await request(app)
        .post('/api/reports/by-districts')
        .send({ districts: ['Centro Storico-Piedicastello', 'Gardolo'] });
      expect([200, 204]).toContain(res.statusCode);
      if (res.statusCode === 200) {
        expect(Array.isArray(res.body)).toBe(true);
      }
    });

    it('should return 400 if districts array is missing or empty', async () => {
      const res = await request(app)
        .post('/api/reports/by-districts')
        .send({});
      expect(res.statusCode).toBe(400);
    });

    it('should return 204 if no reports found', async () => {
      const res = await request(app)
        .post('/api/reports/by-districts')
        .send({ districts: ['Meano'] });
      expect(res.statusCode).toBe(204);
    });
  });
});