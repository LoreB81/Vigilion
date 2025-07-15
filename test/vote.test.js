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
const Vote = require('../app/models/vote');
const reportRoutes = require('../app/routes/reportRoutes');

/** mock data */
const mockUsers = [
  { id: '8b849406-658b-4e68-b622-645166840fbe', firstname: 'Mario', lastname: 'Rossi', email: 'mario@rossi.it', password: '741b8a8f40d53d3b66a47ad40c08c86dde6511b4ae7750a16cddc683a0a6f6d7', district: 'Centro Storico-Piedicastello', blocked: false },
  { id: 'd39e8638-d87d-4b94-a493-afd42200eec2', firstname: 'Luca', lastname: 'Bianchi', email: 'luca@bianchi.it', password: 'dc557b9159008ab9eea36694cfdab3d6190c7fe3762c9b941aaa6be3f917946e', district: 'Gardolo', blocked: true }
];

const mockReports = [
  { id: 1, user: '8b849406-658b-4e68-b622-645166840fbe', typology: 'Furto', notes: 'Bici rubata', location: JSON.stringify({ lat: 46.07, lng: 11.12 }), district: 'Centro Storico-Piedicastello', upvote: 0, downvote: 0, createdtime: '2025-06-01 12:00' }
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
  await Vote.deleteMany({});
  await User.insertMany(mockUsers);
  await Report.insertMany(mockReports);
});

describe('Vote API', () => {
  const userId = '8b849406-658b-4e68-b622-645166840fbe';
  const userEmail = 'mario@rossi.it';
  const cookies = getAuthCookies(userId, userEmail);
  const reportId = 1;

  describe('POST /api/reports/:id/vote', () => {
    it('should upvote a report', async () => {
      const res = await request(app)
        .post(`/api/reports/${reportId}/vote`)
        .set('Cookie', cookies)
        .send({ voteType: 'upvote' });
      expect(res.statusCode).toBe(200);
      expect(res.body.upvotes).toBe(1);
      expect(res.body.downvotes).toBe(0);
      expect(res.body.userVote).toBe('upvote');
    });

    it('should downvote a report', async () => {
      const res = await request(app)
        .post(`/api/reports/${reportId}/vote`)
        .set('Cookie', cookies)
        .send({ voteType: 'downvote' });
      expect(res.statusCode).toBe(200);
      expect(res.body.upvotes).toBe(0);
      expect(res.body.downvotes).toBe(1);
      expect(res.body.userVote).toBe('downvote');
    });

    it('should change vote from upvote to downvote', async () => {
      /** first we upvote */
      await request(app)
        .post(`/api/reports/${reportId}/vote`)
        .set('Cookie', cookies)
        .send({ voteType: 'upvote' });
      
      /** then we downvote */
      const res = await request(app)
        .post(`/api/reports/${reportId}/vote`)
        .set('Cookie', cookies)
        .send({ voteType: 'downvote' });
      expect(res.statusCode).toBe(200);
      expect(res.body.upvotes).toBe(0);
      expect(res.body.downvotes).toBe(1);
      expect(res.body.userVote).toBe('downvote');
    });

    it('should remove vote if same vote is sent again', async () => {
      /** first we upvote */
      await request(app)
        .post(`/api/reports/${reportId}/vote`)
        .set('Cookie', cookies)
        .send({ voteType: 'upvote' });
      
      /** then we remove the upvote */
      const res = await request(app)
        .post(`/api/reports/${reportId}/vote`)
        .set('Cookie', cookies)
        .send({ voteType: 'upvote' });
      expect(res.statusCode).toBe(200);
      expect(res.body.upvotes).toBe(0);
      expect(res.body.downvotes).toBe(0);
      expect(res.body.userVote).toBe(null);
    });

    it('should return 400 for invalid voteType', async () => {
      const res = await request(app)
        .post(`/api/reports/${reportId}/vote`)
        .set('Cookie', cookies)
        .send({ voteType: 'invalid' });
      expect(res.statusCode).toBe(400);
    });

    it('should return 401 if not authenticated', async () => {
      const res = await request(app)
        .post(`/api/reports/${reportId}/vote`)
        .send({ voteType: 'upvote' });
      expect(res.statusCode).toBe(401);
    });

    it('should return 404 if report not found', async () => {
      const res = await request(app)
        .post(`/api/reports/9999/vote`)
        .set('Cookie', cookies)
        .send({ voteType: 'upvote' });
      expect(res.statusCode).toBe(404);
    });
  });

  describe('GET /api/reports/:id/user-vote', () => {
    it('should return user voteType if voted', async () => {
      /** first we upvote */
      await request(app)
        .post(`/api/reports/${reportId}/vote`)
        .set('Cookie', cookies)
        .send({ voteType: 'upvote' });
      
      /** then we return the vote type */
      const res = await request(app)
        .get(`/api/reports/${reportId}/user-vote`)
        .set('Cookie', cookies);
      expect(res.statusCode).toBe(200);
      expect(res.body.voteType).toBe('upvote');
    });

    it('should return null if user has not voted', async () => {
      const res = await request(app)
        .get(`/api/reports/${reportId}/user-vote`)
        .set('Cookie', cookies);
      expect(res.statusCode).toBe(200);
      expect(res.body.voteType).toBe(null);
    });

    it('should return 401 if not authenticated', async () => {
      const res = await request(app)
        .get(`/api/reports/${reportId}/user-vote`);
      expect(res.statusCode).toBe(401);
    });
  });
});