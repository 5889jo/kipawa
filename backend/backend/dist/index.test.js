"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const vitest_1 = require("vitest");
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-session-cookie-secret-that-is-long-enough';
process.env.JWT_EXPIRES_IN = '1h';
process.env.CLIENT_URL = 'http://localhost:5173';
process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/veta_test?schema=public';
let app;
let prisma;
(0, vitest_1.describe)('cookie session CSRF protection', () => {
    (0, vitest_1.beforeAll)(async () => {
        ({ app, prisma } = await Promise.resolve().then(() => __importStar(require('./index'))));
    });
    (0, vitest_1.afterAll)(async () => {
        if (prisma)
            await prisma.$disconnect();
    });
    (0, vitest_1.it)('requires a valid signed CSRF cookie and header for API writes', async () => {
        const withoutToken = await (0, supertest_1.default)(app)
            .post('/api/auth/logout')
            .set('Origin', 'http://localhost:5173')
            .send({});
        (0, vitest_1.expect)(withoutToken.status).toBe(403);
        const csrfResponse = await (0, supertest_1.default)(app).get('/api/auth/csrf');
        (0, vitest_1.expect)(csrfResponse.status).toBe(200);
        (0, vitest_1.expect)(csrfResponse.headers['cache-control']).toContain('no-store');
        const csrfCookie = csrfResponse.headers['set-cookie']
            .find((cookie) => cookie.startsWith('kipawa_csrf='));
        (0, vitest_1.expect)(csrfCookie).toBeDefined();
        const cookiePair = csrfCookie.split(';', 1)[0];
        const { csrfToken } = csrfResponse.body;
        const rejectedOrigin = await (0, supertest_1.default)(app)
            .post('/api/auth/logout')
            .set('Origin', 'https://attacker.example')
            .set('Cookie', cookiePair)
            .set('X-CSRF-Token', csrfToken)
            .send({});
        (0, vitest_1.expect)(rejectedOrigin.status).toBe(403);
        const logout = await (0, supertest_1.default)(app)
            .post('/api/auth/logout')
            .set('Origin', 'http://localhost:5173')
            .set('Cookie', cookiePair)
            .set('X-CSRF-Token', csrfToken)
            .send({});
        (0, vitest_1.expect)(logout.status).toBe(200);
        (0, vitest_1.expect)(logout.body).toEqual({ message: 'Signed out.' });
        (0, vitest_1.expect)(logout.headers['set-cookie']).toEqual(vitest_1.expect.arrayContaining([
            vitest_1.expect.stringContaining('kipawa_session=;'),
            vitest_1.expect.stringContaining('kipawa_csrf=;')
        ]));
    });
});
