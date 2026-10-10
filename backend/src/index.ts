// @ts-nocheck
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
exports.prisma = exports.app = void 0;
const express_1 = __importDefault(require("express"));
const node_crypto_1 = require("node:crypto");
const node_fs_1 = require("node:fs");
const promises_1 = require("node:fs/promises");
const node_path_1 = __importDefault(require("node:path"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const dotenv_1 = __importDefault(require("dotenv"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const multer_1 = __importStar(require("multer"));
const adapter_pg_1 = require("@prisma/adapter-pg");
const client_1 = require("./generated/prisma/client");
dotenv_1.default.config({ path: '../.env' });
const app = (0, express_1.default)();
exports.app = app;
const port = Number(process.env.PORT ?? 4000);
const newsUploadDirectory = node_path_1.default.resolve(__dirname, '..', 'uploads', 'news');
(0, node_fs_1.mkdirSync)(newsUploadDirectory, { recursive: true });
const jwtSecret = process.env.JWT_SECRET ?? 'kipawa-demo-secret';
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
    throw new Error('DATABASE_URL must be set in the project root .env file.');
}
const prisma = new client_1.PrismaClient({ adapter: new adapter_pg_1.PrismaPg({ connectionString: databaseUrl }) });
exports.prisma = prisma;
const expiryMatch = /^(\d+)(s|m|h|d)?$/.exec(process.env.JWT_EXPIRES_IN ?? '7d');
if (!expiryMatch || Number(expiryMatch[1]) <= 0) {
    throw new Error('JWT_EXPIRES_IN must be a positive number optionally followed by s, m, h, or d.');
}
const expiryUnit = expiryMatch[2];
const jwtExpiresIn = Number(expiryMatch[1]) * (expiryUnit === 'd' ? 24 * 60 * 60 :
    expiryUnit === 'h' ? 60 * 60 :
        expiryUnit === 'm' ? 60 : 1);
class NewsMediaUploadError extends Error {
}
const newsImageExtensions = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'image/gif': '.gif'
};
const newsVideoExtensions = {
    'video/mp4': '.mp4',
    'video/webm': '.webm'
};
const newsMediaUpload = (0, multer_1.default)({
    storage: multer_1.default.diskStorage({
        destination: (_req, _file, callback) => callback(null, newsUploadDirectory),
        filename: (_req, file, callback) => {
            const extension = file.fieldname === 'image'
                ? newsImageExtensions[file.mimetype]
                : newsVideoExtensions[file.mimetype];
            callback(null, `${(0, node_crypto_1.randomUUID)()}${extension}`);
        }
    }),
    limits: { fileSize: 50 * 1024 * 1024, files: 2 },
    fileFilter: (_req, file, callback) => {
        const extensions = file.fieldname === 'image' ? newsImageExtensions :
            file.fieldname === 'video' ? newsVideoExtensions : null;
        if (!extensions || !extensions[file.mimetype]) {
            callback(new NewsMediaUploadError('Upload a supported image (JPEG, PNG, WebP, GIF) or video (MP4, WebM, MOV).'));
            return;
        }
        callback(null, true);
    }
}).fields([{ name: 'image', maxCount: 1 }, { name: 'video', maxCount: 1 }]);
const uploadNewsMedia = (req, res, next) => {
    newsMediaUpload(req, res, (error) => {
        if (error) {
            next(error);
            return;
        }
        const uploadedFiles = req.files;
        const image = uploadedFiles?.image?.[0];
        if (image && image.size > 5 * 1024 * 1024) {
            void removeUploadedNewsFiles(req).then(() => res.status(413).json({ message: 'News images must be 5 MB or smaller.' }), (cleanupError) => next(cleanupError));
            return;
        }
        next();
    });
};
const getUploadedNewsFile = (req, field) => req.files?.[field]?.[0];
const removeUploadedNewsFiles = async (req) => {
    const files = req.files;
    await Promise.all(Object.values(files ?? {}).flat().map(async (file) => {
        try {
            await (0, promises_1.unlink)(file.path);
        }
        catch (error) {
            if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'ENOENT')
                return;
            throw error;
        }
    }));
};
const getYouTubeEmbedUrl = (value) => {
    if (value === undefined)
        return undefined;
    if (typeof value !== 'string' || !value.trim())
        return null;
    try {
        const url = new URL(value.trim());
        const hostname = url.hostname.toLowerCase().replace(/^www\./, '');
        let videoId = null;
        if (hostname === 'youtu.be') {
            videoId = url.pathname.split('/').filter(Boolean)[0] ?? null;
        }
        else if (hostname === 'youtube.com' ||
            hostname === 'm.youtube.com' ||
            hostname === 'youtube-nocookie.com') {
            if (url.pathname === '/watch')
                videoId = url.searchParams.get('v');
            else {
                const [, route, id] = url.pathname.split('/');
                if (route === 'embed' ||
                    (hostname !== 'youtube-nocookie.com' && ['shorts', 'live'].includes(route))) {
                    videoId = id ?? null;
                }
            }
        }
        return videoId && /^[\w-]{11}$/.test(videoId)
            ? `https://www.youtube-nocookie.com/embed/${videoId}`
            : null;
    }
    catch {
        return null;
    }
};
const removeNewsImage = async (imageUrl) => {
    if (!imageUrl)
        return;
    const filename = node_path_1.default.basename(imageUrl);
    if (imageUrl !== `/uploads/news/${filename}`) {
        throw new Error('Stored news image path is invalid.');
    }
    try {
        await (0, promises_1.unlink)(node_path_1.default.join(newsUploadDirectory, filename));
    }
    catch (error) {
        if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'ENOENT')
            return;
        throw error;
    }
};
const userWithRoles = {
    roles: {
        include: {
            role: true
        }
    }
};
const getRole = (user) => user.roles.some(({ role }) => role.name === 'admin') ? 'admin' : 'user';
const sanitizeUser = (user) => ({
    id: String(user.id),
    name: `${user.firstName} ${user.lastName}`.trim(),
    email: user.email,
    role: getRole(user)
});
const signToken = (user) => jsonwebtoken_1.default.sign({ sub: String(user.id), email: user.email, role: getRole(user) }, jwtSecret, { expiresIn: jwtExpiresIn });
const authMiddleware = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        res.status(401).json({ message: 'Authentication required.' });
        return;
    }
    let userId;
    try {
        const payload = jsonwebtoken_1.default.verify(authHeader.slice('Bearer '.length), jwtSecret);
        if (typeof payload === 'string' || typeof payload.sub !== 'string') {
            res.status(401).json({ message: 'Invalid or expired token.' });
            return;
        }
        userId = Number(payload.sub);
        if (!Number.isSafeInteger(userId) || userId <= 0) {
            res.status(401).json({ message: 'Invalid or expired token.' });
            return;
        }
    }
    catch {
        res.status(401).json({ message: 'Invalid or expired token.' });
        return;
    }
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: userWithRoles
    });
    if (!user || !user.isActive) {
        res.status(401).json({ message: 'User not found or inactive.' });
        return;
    }
    const name = `${user.firstName} ${user.lastName}`.trim();
    req.user = {
        id: user.id,
        email: user.email,
        name,
        role: getRole(user)
    };
    next();
};
const optionalAuthMiddleware = (req, res, next) => req.headers.authorization ? authMiddleware(req, res, next) : next();
const requireAdmin = (req, res, next) => {
    const user = req.user;
    if (!user || user.role !== 'admin') {
        res.status(user ? 403 : 401).json({ message: 'Admin access only.' });
        return;
    }
    next();
};
const isPrismaError = (error, code) => typeof error === 'object' && error !== null && 'code' in error && error.code === code;
const slugify = (value) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const isValidCourseStartDate = (value) => {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value))
        return false;
    const date = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
};
const isValidCourseImageUrl = (value) => {
    if (typeof value !== 'string')
        return false;
    try {
        const url = new URL(value);
        return (url.protocol === 'http:' || url.protocol === 'https:') && Boolean(url.hostname);
    }
    catch {
        return false;
    }
};
app.use((0, cors_1.default)({ origin: process.env.CLIENT_URL ?? 'http://localhost:5173' }));
app.use((0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            frameSrc: ["'self'", 'https://www.youtube-nocookie.com']
        }
    }
}));
app.use((0, morgan_1.default)('dev'));
app.use('/uploads/news', (_req, res, next) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    next();
}, express_1.default.static(newsUploadDirectory));
app.use(express_1.default.json());
app.use('/api/auth', (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) => {
        res.status(429).json({ message: 'Too many authentication attempts. Please try again later.' });
    }
}));
app.use((0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 500,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) => {
        res.status(429).json({ message: 'Too many requests. Please try again later.' });
    }
}));
app.get('/api/health', async (_req, res) => {
    try {
        await prisma.$queryRaw `SELECT 1`;
        res.json({ status: 'ok', service: 'kipawa-backend', database: 'connected' });
    }
    catch (error) {
        console.error('Database health check failed:', error);
        res.status(503).json({ status: 'error', service: 'kipawa-backend', database: 'unavailable' });
    }
});
app.get('/api', (_req, res) => {
    res.json({ message: 'VETA-inspired API is running.' });
});
app.get('/api/courses', async (_req, res) => {
    const courses = await prisma.course.findMany({
        include: { centres: { include: { centre: true } } },
        orderBy: { createdAt: 'desc' }
    });
    res.json({
        data: courses.map((course) => ({
            id: String(course.id),
            name: course.name,
            level: course.level,
            duration: course.duration,
            courseType: course.courseType,
            startDate: course.startDate?.toISOString() ?? null,
            fee: course.fee,
            imageUrl: course.imageUrl,
            centre: course.centres[0]?.centre.name,
            summary: course.description ?? 'Practical training aligned to workplace demand.'
        }))
    });
});
app.get('/api/centres', async (_req, res) => {
    const centres = await prisma.trainingCentre.findMany({
        include: { district: { include: { region: true } } },
        orderBy: { name: 'asc' }
    });
    res.json({
        data: centres.map((centre) => ({
            id: String(centre.id),
            name: centre.name,
            district: centre.district.name,
            region: centre.district.region.name,
            type: centre.type,
            focus: centre.focus
        }))
    });
});
app.get('/api/news', async (_req, res) => {
    const articles = await prisma.newsArticle.findMany({
        where: { published: true },
        orderBy: { createdAt: 'desc' }
    });
    res.json({
        data: articles.map((article) => ({
            id: String(article.id),
            slug: article.slug,
            title: article.title,
            date: article.createdAt.toISOString(),
            category: article.category,
            summary: article.summary ?? article.body,
            body: article.body,
            imageUrl: article.imageUrl,
            videoUrl: article.videoUrl,
            youtubeUrl: article.youtubeUrl
        }))
    });
});
app.get('/api/news/:slug', optionalAuthMiddleware, async (req, res) => {
    const slug = req.params.slug;
    if (typeof slug !== 'string') {
        res.status(400).json({ message: 'A valid news article slug is required.' });
        return;
    }
    const article = await prisma.newsArticle.findFirst({
        where: { slug, published: true },
        include: {
            reactions: { select: { userId: true, reaction: true } },
            comments: {
                orderBy: { createdAt: 'desc' },
                include: { user: { select: { firstName: true, lastName: true } } }
            }
        }
    });
    if (!article) {
        res.status(404).json({ message: 'News article not found.' });
        return;
    }
    const userId = req.user?.id;
    res.json({
        article: {
            id: String(article.id),
            slug: article.slug,
            title: article.title,
            date: article.createdAt.toISOString(),
            category: article.category,
            summary: article.summary ?? '',
            body: article.body,
            imageUrl: article.imageUrl,
            videoUrl: article.videoUrl,
            youtubeUrl: article.youtubeUrl,
            likes: article.reactions.filter(({ reaction }) => reaction === 'like').length,
            dislikes: article.reactions.filter(({ reaction }) => reaction === 'dislike').length,
            userReaction: userId
                ? article.reactions.find(({ userId: reactionUserId }) => reactionUserId === userId)?.reaction ?? null
                : null,
            comments: article.comments.map((comment) => ({
                id: String(comment.id),
                userName: `${comment.user.firstName} ${comment.user.lastName}`.trim(),
                content: comment.content,
                createdAt: comment.createdAt.toISOString()
            }))
        }
    });
});
app.put('/api/news/:slug/reaction', authMiddleware, async (req, res) => {
    const slug = req.params.slug;
    if (typeof slug !== 'string') {
        res.status(400).json({ message: 'A valid news article slug is required.' });
        return;
    }
    const { reaction } = req.body;
    if (reaction !== null && reaction !== 'like' && reaction !== 'dislike') {
        res.status(400).json({ message: 'Reaction must be like, dislike, or null.' });
        return;
    }
    const article = await prisma.newsArticle.findFirst({
        where: { slug, published: true },
        select: { id: true }
    });
    if (!article) {
        res.status(404).json({ message: 'News article not found.' });
        return;
    }
    const userId = req.user.id;
    if (reaction === null) {
        await prisma.newsReaction.deleteMany({ where: { newsArticleId: article.id, userId } });
    }
    else {
        await prisma.newsReaction.upsert({
            where: { newsArticleId_userId: { newsArticleId: article.id, userId } },
            create: { newsArticleId: article.id, userId, reaction },
            update: { reaction }
        });
    }
    res.json({ message: 'Reaction saved.' });
});
app.post('/api/news/:slug/comments', authMiddleware, async (req, res) => {
    const slug = req.params.slug;
    if (typeof slug !== 'string') {
        res.status(400).json({ message: 'A valid news article slug is required.' });
        return;
    }
    const { content } = req.body;
    if (typeof content !== 'string' || !content.trim() || content.trim().length > 2000) {
        res.status(400).json({ message: 'Comment must contain between 1 and 2000 characters.' });
        return;
    }
    const article = await prisma.newsArticle.findFirst({
        where: { slug, published: true },
        select: { id: true }
    });
    if (!article) {
        res.status(404).json({ message: 'News article not found.' });
        return;
    }
    const user = req.user;
    const comment = await prisma.newsComment.create({
        data: { newsArticleId: article.id, userId: user.id, content: content.trim() }
    });
    res.status(201).json({
        message: 'Comment posted.',
        comment: {
            id: String(comment.id),
            userName: user.name,
            content: comment.content,
            createdAt: comment.createdAt.toISOString()
        }
    });
});
app.get('/api/publications', async (_req, res) => {
    const publications = await prisma.publication.findMany({ orderBy: { createdAt: 'desc' } });
    res.json({
        data: publications.map((publication) => ({
            id: String(publication.id),
            title: publication.title,
            fileUrl: publication.fileUrl,
            createdAt: publication.createdAt.toISOString()
        }))
    });
});
app.get('/api/site-settings', async (_req, res) => {
    const settings = await prisma.siteSetting.findMany({
        where: {
            OR: [
                { key: { startsWith: 'site.' } },
                { key: { startsWith: 'home.' } },
                { key: { startsWith: 'about.' } },
                { key: { startsWith: 'admissions.' } }
            ]
        },
        orderBy: { key: 'asc' }
    });
    res.json({ data: Object.fromEntries(settings.map(({ key, value }) => [key, value])) });
});
app.get('/api/site-stats', async (_req, res) => {
    const [centreCount, courseCount, learnerCount, bookingCount] = await Promise.all([
        prisma.trainingCentre.count(),
        prisma.course.count(),
        prisma.user.count({ where: { isActive: true, roles: { none: { role: { name: 'admin' } } } } }),
        prisma.booking.count()
    ]);
    res.json({
        data: [
            { value: String(centreCount), label: 'Training centres' },
            { value: String(courseCount), label: 'Occupational programmes' },
            { value: String(learnerCount), label: 'Registered learners' },
            { value: String(bookingCount), label: 'Course registrations' }
        ]
    });
});
app.post('/api/auth/register', async (req, res) => {
    const { name, email, password } = req.body;
    if (typeof name !== 'string' || !name.trim() ||
        typeof email !== 'string' || !email.trim() ||
        typeof password !== 'string' || password.length < 8) {
        res.status(400).json({ message: 'Enter your name, a valid email, and a password of at least 8 characters.' });
        return;
    }
    const normalizedEmail = email.trim().toLowerCase();
    const nameParts = name.trim().split(/\s+/);
    const applicantRole = await prisma.role.upsert({
        where: { name: 'applicant' },
        update: {},
        create: { name: 'applicant', description: 'Training applicant' }
    });
    const newUser = await prisma.user.create({
        data: {
            email: normalizedEmail,
            passwordHash: await bcryptjs_1.default.hash(password, Number(process.env.BCRYPT_ROUNDS ?? 12)),
            firstName: nameParts[0],
            lastName: nameParts.slice(1).join(' ') || nameParts[0],
            roles: { create: { role: { connect: { id: applicantRole.id } } } }
        },
        include: userWithRoles
    }).catch((error) => {
        if (typeof error === 'object' &&
            error !== null &&
            'code' in error &&
            error.code === 'P2002') {
            res.status(409).json({ message: 'An account with this email already exists.' });
            return null;
        }
        throw error;
    });
    if (!newUser)
        return;
    res.status(201).json({
        token: signToken(newUser),
        user: sanitizeUser(newUser)
    });
});
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
        res.status(400).json({ message: 'Email and password are required.' });
        return;
    }
    const user = await prisma.user.findUnique({
        where: { email: email.trim().toLowerCase() },
        include: userWithRoles
    });
    if (!user || !user.isActive || !(await bcryptjs_1.default.compare(password, user.passwordHash))) {
        res.status(401).json({ message: 'Invalid email or password.' });
        return;
    }
    res.json({ token: signToken(user), user: sanitizeUser(user) });
});
app.get('/api/me', authMiddleware, async (req, res) => {
    const authUser = req.user;
    const user = await prisma.user.findUnique({
        where: { id: authUser.id },
        include: userWithRoles
    });
    if (!user) {
        res.status(404).json({ message: 'Profile not found.' });
        return;
    }
    res.json({ user: sanitizeUser(user) });
});
app.post('/api/bookings', authMiddleware, async (req, res) => {
    const { course, centre, date, note } = req.body;
    if (typeof course !== 'string' || !course.trim() ||
        typeof centre !== 'string' || !centre.trim() ||
        typeof date !== 'string' || !date.trim()) {
        res.status(400).json({ message: 'Course, centre and date are required.' });
        return;
    }
    const startDate = new Date(date);
    if (Number.isNaN(startDate.getTime())) {
        res.status(400).json({ message: 'Enter a valid preferred start date.' });
        return;
    }
    const authUser = req.user;
    const booking = await prisma.booking.create({
        data: {
            userId: authUser.id,
            userName: authUser.name,
            course: course.trim(),
            centre: centre.trim(),
            date: startDate,
            note: typeof note === 'string' ? note.trim() : ''
        }
    });
    res.status(201).json({
        message: 'Course booking request submitted successfully.',
        booking: {
            id: String(booking.id),
            userName: booking.userName,
            course: booking.course,
            centre: booking.centre,
            date: booking.date.toISOString(),
            note: booking.note,
            status: booking.status
        }
    });
});
app.post('/api/applications', async (req, res) => {
    const { applicantName, email, programme, centrePreference } = req.body;
    if (typeof applicantName !== 'string' || !applicantName.trim() ||
        typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
        typeof programme !== 'string' || !programme.trim() ||
        (centrePreference !== undefined && typeof centrePreference !== 'string')) {
        res.status(400).json({ message: 'Enter your name, a valid email, and a programme.' });
        return;
    }
    const application = await prisma.application.create({
        data: {
            applicantName: applicantName.trim(),
            email: email.trim().toLowerCase(),
            programme: programme.trim(),
            centrePreference: typeof centrePreference === 'string' && centrePreference.trim()
                ? centrePreference.trim()
                : null
        }
    });
    res.status(201).json({
        message: 'Application submitted successfully.',
        application: { id: String(application.id), status: application.status }
    });
});
app.post('/api/contact', async (req, res) => {
    const { name, email, category, message } = req.body;
    if (typeof name !== 'string' || !name.trim() ||
        typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
        typeof category !== 'string' || !category.trim() ||
        typeof message !== 'string' || !message.trim()) {
        res.status(400).json({ message: 'Enter your name, a valid email, an inquiry type, and a message.' });
        return;
    }
    const inquiry = await prisma.contactInquiry.create({
        data: {
            name: name.trim(),
            email: email.trim().toLowerCase(),
            category: category.trim(),
            message: message.trim()
        }
    });
    res.status(201).json({
        message: 'Your message has been sent successfully.',
        inquiry: { id: String(inquiry.id) }
    });
});
app.get('/api/bookings', authMiddleware, async (req, res) => {
    const authUser = req.user;
    const bookings = await prisma.booking.findMany({
        where: authUser.role === 'admin' ? undefined : { userId: authUser.id },
        orderBy: { createdAt: 'desc' }
    });
    res.json({
        data: bookings.map((booking) => ({
            id: String(booking.id),
            userName: booking.userName,
            course: booking.course,
            centre: booking.centre,
            date: booking.date.toISOString(),
            note: booking.note,
            status: booking.status
        }))
    });
});
app.post('/api/comments', async (req, res) => {
    const { course, rating, comment, userName } = req.body;
    if (typeof userName !== 'string' || !userName.trim() ||
        typeof course !== 'string' || !course.trim() ||
        typeof comment !== 'string' || !comment.trim() ||
        !Number.isInteger(rating) || Number(rating) < 1 || Number(rating) > 5) {
        res.status(400).json({ message: 'Name, course, comment, and a rating from 1 to 5 are required.' });
        return;
    }
    const review = await prisma.review.create({
        data: {
            userName: userName.trim(),
            course: course.trim(),
            rating: Number(rating),
            comment: comment.trim()
        }
    });
    res.status(201).json({
        message: 'Comment submitted successfully.',
        review: { ...review, id: String(review.id) }
    });
});
app.get('/api/comments', async (_req, res) => {
    const reviews = await prisma.review.findMany({ orderBy: { createdAt: 'desc' } });
    res.json({
        data: reviews.map((review) => ({
            id: String(review.id),
            userName: review.userName,
            course: review.course,
            rating: review.rating,
            comment: review.comment,
            createdAt: review.createdAt.toISOString()
        }))
    });
});
app.use('/api/admin', authMiddleware, requireAdmin);
app.get('/api/admin/overview', async (req, res) => {
    const user = req.user;
    const [bookingCount, userCount, pendingCount, reviewCount, applicationCount, inquiryCount, bookings, reviews, applications, inquiries] = await Promise.all([
        prisma.booking.count(),
        prisma.user.count(),
        prisma.booking.count({ where: { status: 'Pending' } }),
        prisma.review.count(),
        prisma.application.count(),
        prisma.contactInquiry.count(),
        prisma.booking.findMany({ orderBy: { createdAt: 'desc' }, take: 5 }),
        prisma.review.findMany({ orderBy: { createdAt: 'desc' }, take: 5 }),
        prisma.application.findMany({ orderBy: { submittedAt: 'desc' }, take: 5 }),
        prisma.contactInquiry.findMany({ orderBy: { createdAt: 'desc' }, take: 5 })
    ]);
    res.json({
        overview: [
            { label: 'Admissions', value: String(userCount), note: 'Registered applicants' },
            { label: 'Course registrations', value: String(bookingCount), note: 'Booking requests' },
            { label: 'Staff review', value: String(pendingCount), note: 'Pending bookings' },
            { label: 'Student reviews', value: String(reviewCount), note: 'Published feedback' },
            { label: 'Applications', value: String(applicationCount), note: 'Submitted applications' },
            { label: 'Contact inquiries', value: String(inquiryCount), note: 'Messages received' }
        ],
        bookings: bookings.map((booking) => ({
            id: String(booking.id),
            user_name: booking.userName,
            course: booking.course,
            centre: booking.centre,
            start_date: booking.date.toISOString().slice(0, 10),
            status: booking.status
        })),
        reviews: reviews.map((review) => ({
            id: String(review.id),
            user_name: review.userName,
            course: review.course,
            rating: review.rating,
            comment: review.comment
        })),
        applications: applications.map((application) => ({
            id: String(application.id),
            applicant_name: application.applicantName,
            email: application.email,
            programme: application.programme,
            centre_preference: application.centrePreference ?? '',
            status: application.status,
            submitted_at: application.submittedAt.toISOString()
        })),
        inquiries: inquiries.map((inquiry) => ({
            id: String(inquiry.id),
            name: inquiry.name,
            email: inquiry.email,
            category: inquiry.category,
            message: inquiry.message,
            created_at: inquiry.createdAt.toISOString()
        }))
    });
});
app.get('/api/admin/data', async (_req, res) => {
    const [users, courses, centres, articles, publications, bookings, applications, reviews, inquiries, settings] = await Promise.all([
        prisma.user.findMany({
            include: userWithRoles,
            orderBy: { createdAt: 'desc' }
        }),
        prisma.course.findMany({
            include: { centres: { include: { centre: true } } },
            orderBy: { createdAt: 'desc' }
        }),
        prisma.trainingCentre.findMany({
            include: { district: { include: { region: true } } },
            orderBy: { name: 'asc' }
        }),
        prisma.newsArticle.findMany({ orderBy: { createdAt: 'desc' } }),
        prisma.publication.findMany({ orderBy: { createdAt: 'desc' } }),
        prisma.booking.findMany({ orderBy: { createdAt: 'desc' } }),
        prisma.application.findMany({ orderBy: { submittedAt: 'desc' } }),
        prisma.review.findMany({ orderBy: { createdAt: 'desc' } }),
        prisma.contactInquiry.findMany({ orderBy: { createdAt: 'desc' } }),
        prisma.siteSetting.findMany({ orderBy: { key: 'asc' } })
    ]);
    res.json({
        users: users.map((user) => ({
            ...sanitizeUser(user),
            firstName: user.firstName,
            lastName: user.lastName,
            phone: user.phone,
            isActive: user.isActive,
            createdAt: user.createdAt.toISOString()
        })),
        courses: courses.map((course) => ({
            id: String(course.id),
            name: course.name,
            slug: course.slug,
            description: course.description ?? '',
            level: course.level,
            duration: course.duration,
            courseType: course.courseType,
            startDate: course.startDate?.toISOString() ?? null,
            fee: course.fee,
            imageUrl: course.imageUrl,
            centres: course.centres.map(({ centre }) => centre.name)
        })),
        centres: centres.map((centre) => ({
            id: String(centre.id),
            name: centre.name,
            slug: centre.slug,
            type: centre.type,
            focus: centre.focus,
            district: centre.district.name,
            region: centre.district.region.name
        })),
        news: articles.map((article) => ({
            id: String(article.id),
            title: article.title,
            slug: article.slug,
            category: article.category,
            summary: article.summary ?? '',
            body: article.body,
            imageUrl: article.imageUrl,
            videoUrl: article.videoUrl,
            youtubeUrl: article.youtubeUrl,
            published: article.published
        })),
        publications: publications.map((publication) => ({
            id: String(publication.id),
            title: publication.title,
            fileUrl: publication.fileUrl
        })),
        bookings: bookings.map((booking) => ({
            id: String(booking.id),
            userId: String(booking.userId),
            userName: booking.userName,
            course: booking.course,
            centre: booking.centre,
            date: booking.date.toISOString(),
            note: booking.note,
            status: booking.status
        })),
        applications: applications.map((application) => ({
            id: String(application.id),
            applicantName: application.applicantName,
            email: application.email,
            programme: application.programme,
            centrePreference: application.centrePreference ?? '',
            status: application.status,
            submittedAt: application.submittedAt.toISOString()
        })),
        reviews: reviews.map((review) => ({
            id: String(review.id),
            userName: review.userName,
            course: review.course,
            rating: review.rating,
            comment: review.comment
        })),
        inquiries: inquiries.map((inquiry) => ({
            id: String(inquiry.id),
            name: inquiry.name,
            email: inquiry.email,
            category: inquiry.category,
            message: inquiry.message
        })),
        settings: Object.fromEntries(settings.map(({ key, value }) => [key, value]))
    });
});
app.post('/api/admin/users', async (req, res) => {
    const { name, email, password, role, phone } = req.body;
    if (typeof name !== 'string' || !name.trim() ||
        typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
        typeof password !== 'string' || password.length < 8 ||
        (role !== 'user' && role !== 'admin') ||
        (phone !== undefined && typeof phone !== 'string')) {
        res.status(400).json({ message: 'Enter a name, valid email, password of at least 8 characters, and valid role.' });
        return;
    }
    const nameParts = name.trim().split(/\s+/);
    try {
        const user = await prisma.user.create({
            data: {
                email: email.trim().toLowerCase(),
                firstName: nameParts[0],
                lastName: nameParts.slice(1).join(' ') || nameParts[0],
                phone: typeof phone === 'string' && phone.trim() ? phone.trim() : null,
                passwordHash: await bcryptjs_1.default.hash(password, Number(process.env.BCRYPT_ROUNDS ?? 12)),
                roles: {
                    create: {
                        role: {
                            connectOrCreate: {
                                where: { name: role },
                                create: { name: role, description: role === 'admin' ? 'System administrator' : 'Training applicant' }
                            }
                        }
                    }
                }
            },
            include: userWithRoles
        });
        res.status(201).json({ user: { ...sanitizeUser(user), isActive: user.isActive } });
    }
    catch (error) {
        if (isPrismaError(error, 'P2002')) {
            res.status(409).json({ message: 'An account with this email already exists.' });
            return;
        }
        throw error;
    }
});
app.patch('/api/admin/users/:id', async (req, res) => {
    const id = Number(req.params.id);
    const { name, email, role, isActive, phone } = req.body;
    if (!Number.isSafeInteger(id) || id <= 0 ||
        (name !== undefined && (typeof name !== 'string' || !name.trim())) ||
        (email !== undefined && (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))) ||
        (role !== undefined && role !== 'user' && role !== 'admin') ||
        (isActive !== undefined && typeof isActive !== 'boolean') ||
        (phone !== undefined && typeof phone !== 'string') ||
        (name === undefined && email === undefined && role === undefined && isActive === undefined && phone === undefined)) {
        res.status(400).json({ message: 'Provide valid account details to update.' });
        return;
    }
    const actor = req.user;
    const current = await prisma.user.findUnique({ where: { id }, include: userWithRoles });
    if (!current) {
        res.status(404).json({ message: 'User not found.' });
        return;
    }
    const isCurrentAdmin = getRole(current) === 'admin';
    const willRemainAdmin = role === undefined ? isCurrentAdmin : role === 'admin';
    const willRemainActive = isActive === undefined ? current.isActive : isActive;
    if (id === actor.id && (!willRemainAdmin || !willRemainActive)) {
        res.status(400).json({ message: 'You cannot remove your own administrator access or deactivate your account.' });
        return;
    }
    if (isCurrentAdmin && current.isActive && (!willRemainAdmin || !willRemainActive)) {
        const activeAdmins = await prisma.user.count({
            where: { isActive: true, roles: { some: { role: { name: 'admin' } } } }
        });
        if (activeAdmins <= 1) {
            res.status(400).json({ message: 'The last active administrator cannot be demoted or deactivated.' });
            return;
        }
    }
    const nameParts = typeof name === 'string' ? name.trim().split(/\s+/) : null;
    try {
        const user = await prisma.$transaction(async (transaction) => {
            const updated = await transaction.user.update({
                where: { id },
                data: {
                    ...(nameParts ? { firstName: nameParts[0], lastName: nameParts.slice(1).join(' ') || nameParts[0] } : {}),
                    ...(typeof email === 'string' ? { email: email.trim().toLowerCase() } : {}),
                    ...(typeof phone === 'string' ? { phone: phone.trim() || null } : {}),
                    ...(typeof isActive === 'boolean' ? { isActive } : {})
                }
            });
            if (role !== undefined && role !== getRole(current)) {
                await transaction.userRole.deleteMany({ where: { userId: id } });
                await transaction.userRole.create({
                    data: {
                        user: { connect: { id } },
                        role: {
                            connectOrCreate: {
                                where: { name: role },
                                create: { name: role, description: role === 'admin' ? 'System administrator' : 'Training applicant' }
                            }
                        }
                    }
                });
            }
            return transaction.user.findUniqueOrThrow({ where: { id: updated.id }, include: userWithRoles });
        });
        res.json({ user: { ...sanitizeUser(user), isActive: user.isActive } });
    }
    catch (error) {
        if (isPrismaError(error, 'P2002')) {
            res.status(409).json({ message: 'An account with this email already exists.' });
            return;
        }
        throw error;
    }
});
app.delete('/api/admin/users/:id', async (req, res) => {
    const id = Number(req.params.id);
    const actor = req.user;
    if (!Number.isSafeInteger(id) || id <= 0) {
        res.status(400).json({ message: 'Invalid user ID.' });
        return;
    }
    if (id === actor.id) {
        res.status(400).json({ message: 'You cannot delete your own administrator account.' });
        return;
    }
    const user = await prisma.user.findUnique({ where: { id }, include: userWithRoles });
    if (!user) {
        res.status(404).json({ message: 'User not found.' });
        return;
    }
    if (getRole(user) === 'admin' && user.isActive) {
        const activeAdmins = await prisma.user.count({
            where: { isActive: true, roles: { some: { role: { name: 'admin' } } } }
        });
        if (activeAdmins <= 1) {
            res.status(400).json({ message: 'The last active administrator cannot be deleted.' });
            return;
        }
    }
    await prisma.$transaction([
        prisma.applicantProfile.deleteMany({ where: { userId: id } }),
        prisma.userRole.deleteMany({ where: { userId: id } }),
        prisma.user.delete({ where: { id } })
    ]);
    res.json({ message: 'User deleted.' });
});
app.post('/api/admin/courses', async (req, res) => {
    const { name, level, duration, description, courseType, startDate, fee, imageUrl, centres: centreNames } = req.body;
    const validStartDate = startDate === undefined || startDate === null || isValidCourseStartDate(startDate);
    const validImageUrl = imageUrl === undefined || imageUrl === null || imageUrl === '' || isValidCourseImageUrl(imageUrl);
    if (typeof name !== 'string' || !name.trim() ||
        typeof level !== 'string' || !level.trim() ||
        typeof duration !== 'string' || !duration.trim() ||
        (description !== undefined && typeof description !== 'string') ||
        (courseType !== undefined && courseType !== 'Long Course' && courseType !== 'Short Course') ||
        !validStartDate ||
        (fee !== undefined && fee !== null && (!Number.isSafeInteger(fee) || Number(fee) < 0)) ||
        !validImageUrl ||
        (centreNames !== undefined && (!Array.isArray(centreNames) || !centreNames.every((value) => typeof value === 'string')))) {
        res.status(400).json({ message: 'Enter valid course details, including a course type, start date, fee, and image URL.' });
        return;
    }
    const slug = slugify(name);
    if (!slug) {
        res.status(400).json({ message: 'Course name must contain letters or numbers.' });
        return;
    }
    try {
        const course = await prisma.course.create({
            data: {
                name: name.trim(),
                slug,
                level: level.trim(),
                duration: duration.trim(),
                description: typeof description === 'string' ? description.trim() : null,
                courseType: courseType === 'Short Course' ? 'Short Course' : 'Long Course',
                startDate: typeof startDate === 'string' ? new Date(`${startDate}T00:00:00.000Z`) : null,
                fee: typeof fee === 'number' ? fee : null,
                imageUrl: typeof imageUrl === 'string' && imageUrl.trim() ? imageUrl.trim() : null,
                centres: Array.isArray(centreNames)
                    ? { create: await Promise.all(centreNames.map(async (centreName) => ({
                            centre: { connect: { id: (await prisma.trainingCentre.findFirstOrThrow({ where: { name: centreName } })).id } }
                        }))) }
                    : undefined
            }
        });
        res.status(201).json({ id: String(course.id) });
    }
    catch (error) {
        if (isPrismaError(error, 'P2002')) {
            res.status(409).json({ message: 'A course with this name already exists.' });
            return;
        }
        if (isPrismaError(error, 'P2025')) {
            res.status(400).json({ message: 'One or more selected training centres were not found.' });
            return;
        }
        throw error;
    }
});
app.patch('/api/admin/courses/:id', async (req, res) => {
    const id = Number(req.params.id);
    const { name, level, duration, description, courseType, startDate, fee, imageUrl, centres } = req.body;
    const validStartDate = startDate === undefined || startDate === null || isValidCourseStartDate(startDate);
    const validImageUrl = imageUrl === undefined || imageUrl === null || imageUrl === '' || isValidCourseImageUrl(imageUrl);
    if (!Number.isSafeInteger(id) || id <= 0 ||
        (name !== undefined && (typeof name !== 'string' || !name.trim())) ||
        (level !== undefined && (typeof level !== 'string' || !level.trim())) ||
        (duration !== undefined && (typeof duration !== 'string' || !duration.trim())) ||
        (description !== undefined && typeof description !== 'string') ||
        (courseType !== undefined && courseType !== 'Long Course' && courseType !== 'Short Course') ||
        !validStartDate ||
        (fee !== undefined && fee !== null && (!Number.isSafeInteger(fee) || Number(fee) < 0)) ||
        !validImageUrl ||
        (centres !== undefined && (!Array.isArray(centres) || !centres.every((value) => typeof value === 'string'))) ||
        (name === undefined && level === undefined && duration === undefined && description === undefined &&
            courseType === undefined && startDate === undefined && fee === undefined && imageUrl === undefined && centres === undefined)) {
        res.status(400).json({ message: 'Provide valid course details to update.' });
        return;
    }
    try {
        const course = await prisma.$transaction(async (transaction) => {
            let centreLinks;
            if (Array.isArray(centres)) {
                const selectedCentres = await transaction.trainingCentre.findMany({
                    where: { name: { in: centres } },
                    select: { id: true }
                });
                if (selectedCentres.length !== new Set(centres).size) {
                    throw new Error('One or more selected training centres were not found.');
                }
                centreLinks = selectedCentres.map(({ id: centreId }) => ({ centreId }));
            }
            return transaction.course.update({
                where: { id },
                data: {
                    ...(typeof name === 'string' ? { name: name.trim(), slug: slugify(name) } : {}),
                    ...(typeof level === 'string' ? { level: level.trim() } : {}),
                    ...(typeof duration === 'string' ? { duration: duration.trim() } : {}),
                    ...(typeof description === 'string' ? { description: description.trim() } : {}),
                    ...(courseType === 'Long Course' || courseType === 'Short Course' ? { courseType } : {}),
                    ...(startDate === null ? { startDate: null } : typeof startDate === 'string' ? { startDate: new Date(`${startDate}T00:00:00.000Z`) } : {}),
                    ...(fee === null ? { fee: null } : typeof fee === 'number' ? { fee } : {}),
                    ...(imageUrl === null || imageUrl === '' ? { imageUrl: null } : typeof imageUrl === 'string' ? { imageUrl: imageUrl.trim() } : {}),
                    ...(centreLinks !== undefined
                        ? { centres: { deleteMany: {}, create: centreLinks.map(({ centreId }) => ({ centreId })) } }
                        : {})
                }
            });
        });
        res.json({ id: String(course.id) });
    }
    catch (error) {
        if (error instanceof Error && error.message === 'One or more selected training centres were not found.') {
            res.status(400).json({ message: error.message });
            return;
        }
        if (isPrismaError(error, 'P2002')) {
            res.status(409).json({ message: 'A course with this name already exists.' });
            return;
        }
        if (isPrismaError(error, 'P2025')) {
            res.status(404).json({ message: 'Course not found.' });
            return;
        }
        throw error;
    }
});
app.delete('/api/admin/courses/:id', async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id <= 0) {
        res.status(400).json({ message: 'Invalid course ID.' });
        return;
    }
    await prisma.$transaction(async (transaction) => {
        await transaction.centreCourse.deleteMany({ where: { courseId: id } });
        await transaction.course.delete({ where: { id } });
    }).catch((error) => {
        if (isPrismaError(error, 'P2025')) {
            res.status(404).json({ message: 'Course not found.' });
            return;
        }
        throw error;
    });
    if (!res.headersSent)
        res.json({ message: 'Course deleted.' });
});
app.post('/api/admin/centres', async (req, res) => {
    const { name, region, district, type, focus } = req.body;
    if (typeof name !== 'string' || !name.trim() ||
        typeof region !== 'string' || !region.trim() ||
        typeof district !== 'string' || !district.trim() ||
        typeof type !== 'string' || !type.trim() ||
        typeof focus !== 'string' || !focus.trim()) {
        res.status(400).json({ message: 'Enter a name, region, district, type, and focus for the centre.' });
        return;
    }
    try {
        const centre = await prisma.$transaction(async (transaction) => {
            const savedRegion = await transaction.region.upsert({
                where: { name: region.trim() },
                update: {},
                create: { name: region.trim() }
            });
            const savedDistrict = await transaction.district.findFirst({
                where: { name: district.trim(), regionId: savedRegion.id }
            }) ?? await transaction.district.create({
                data: { name: district.trim(), regionId: savedRegion.id }
            });
            return transaction.trainingCentre.create({
                data: {
                    name: name.trim(),
                    slug: slugify(name),
                    type: type.trim(),
                    focus: focus.trim(),
                    districtId: savedDistrict.id
                }
            });
        });
        res.status(201).json({ id: String(centre.id) });
    }
    catch (error) {
        if (isPrismaError(error, 'P2002')) {
            res.status(409).json({ message: 'A training centre with this name already exists.' });
            return;
        }
        throw error;
    }
});
app.patch('/api/admin/centres/:id', async (req, res) => {
    const id = Number(req.params.id);
    const { name, region, district, type, focus } = req.body;
    if (!Number.isSafeInteger(id) || id <= 0 ||
        (name !== undefined && (typeof name !== 'string' || !name.trim())) ||
        (region !== undefined && (typeof region !== 'string' || !region.trim())) ||
        (district !== undefined && (typeof district !== 'string' || !district.trim())) ||
        (type !== undefined && (typeof type !== 'string' || !type.trim())) ||
        (focus !== undefined && (typeof focus !== 'string' || !focus.trim())) ||
        [name, region, district, type, focus].every((value) => value === undefined)) {
        res.status(400).json({ message: 'Provide valid training centre details to update.' });
        return;
    }
    try {
        const centre = await prisma.$transaction(async (transaction) => {
            const current = await transaction.trainingCentre.findUniqueOrThrow({
                where: { id },
                include: { district: { include: { region: true } } }
            });
            const nextRegion = typeof region === 'string' ? region.trim() : current.district.region.name;
            const nextDistrict = typeof district === 'string' ? district.trim() : current.district.name;
            const nextDistrictId = region !== undefined || district !== undefined
                ? await transaction.region.upsert({
                    where: { name: nextRegion },
                    update: {},
                    create: { name: nextRegion }
                }).then(async (savedRegion) => (await transaction.district.findFirst({
                    where: { name: nextDistrict, regionId: savedRegion.id }
                }) ?? await transaction.district.create({
                    data: { name: nextDistrict, regionId: savedRegion.id }
                }))).then(({ id: districtId }) => districtId)
                : undefined;
            return transaction.trainingCentre.update({
                where: { id },
                data: {
                    ...(typeof name === 'string' ? { name: name.trim(), slug: slugify(name) } : {}),
                    ...(typeof type === 'string' ? { type: type.trim() } : {}),
                    ...(typeof focus === 'string' ? { focus: focus.trim() } : {}),
                    ...(nextDistrictId !== undefined ? { districtId: nextDistrictId } : {})
                }
            });
        });
        res.json({ id: String(centre.id) });
    }
    catch (error) {
        if (isPrismaError(error, 'P2002')) {
            res.status(409).json({ message: 'A training centre with this name already exists.' });
            return;
        }
        if (isPrismaError(error, 'P2025')) {
            res.status(404).json({ message: 'Training centre not found.' });
            return;
        }
        throw error;
    }
});
app.delete('/api/admin/centres/:id', async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id <= 0) {
        res.status(400).json({ message: 'Invalid training centre ID.' });
        return;
    }
    try {
        await prisma.$transaction(async (transaction) => {
            await transaction.centreCourse.deleteMany({ where: { centreId: id } });
            await transaction.trainingCentre.delete({ where: { id } });
        });
        res.json({ message: 'Training centre deleted.' });
    }
    catch (error) {
        if (isPrismaError(error, 'P2025')) {
            res.status(404).json({ message: 'Training centre not found.' });
            return;
        }
        throw error;
    }
});
app.post('/api/admin/news', uploadNewsMedia, async (req, res) => {
    const { title, category, summary, body, published, youtubeUrl } = req.body;
    const image = getUploadedNewsFile(req, 'image');
    const video = getUploadedNewsFile(req, 'video');
    const youtubeEmbedUrl = getYouTubeEmbedUrl(youtubeUrl);
    const isPublished = published === undefined || published === true || published === 'true';
    const validPublished = published === undefined || published === true || published === false ||
        published === 'true' || published === 'false';
    if (typeof title !== 'string' || !title.trim() ||
        typeof category !== 'string' || !category.trim() ||
        typeof body !== 'string' || !body.trim() ||
        (summary !== undefined && typeof summary !== 'string') ||
        youtubeEmbedUrl === null ||
        (video && youtubeEmbedUrl) ||
        !validPublished) {
        await removeUploadedNewsFiles(req);
        res.status(400).json({
            message: youtubeEmbedUrl === null
                ? 'Enter a valid YouTube video link.'
                : video && youtubeEmbedUrl
                    ? 'Choose either an uploaded video or a YouTube link.'
                    : 'Enter a title, category, and article body.'
        });
        return;
    }
    const slug = slugify(title);
    if (!slug) {
        await removeUploadedNewsFiles(req);
        res.status(400).json({ message: 'Article title must contain letters or numbers.' });
        return;
    }
    try {
        const article = await prisma.newsArticle.create({
            data: {
                title: title.trim(),
                slug,
                category: category.trim(),
                summary: typeof summary === 'string' && summary.trim() ? summary.trim() : null,
                body: body.trim(),
                imageUrl: image ? `/uploads/news/${image.filename}` : null,
                videoUrl: video ? `/uploads/news/${video.filename}` : null,
                youtubeUrl: youtubeEmbedUrl ?? null,
                published: isPublished
            }
        });
        res.status(201).json({ id: String(article.id) });
    }
    catch (error) {
        await removeUploadedNewsFiles(req);
        if (isPrismaError(error, 'P2002')) {
            res.status(409).json({ message: 'An article with this title already exists.' });
            return;
        }
        throw error;
    }
});
app.patch('/api/admin/news/:id', uploadNewsMedia, async (req, res) => {
    const id = Number(req.params.id);
    const { title, category, summary, body, published, youtubeUrl } = req.body;
    const image = getUploadedNewsFile(req, 'image');
    const video = getUploadedNewsFile(req, 'video');
    const youtubeEmbedUrl = getYouTubeEmbedUrl(youtubeUrl);
    const isPublished = published === true || published === 'true';
    const validPublished = published === undefined || published === true || published === false ||
        published === 'true' || published === 'false';
    const removeImage = req.body.removeImage === true || req.body.removeImage === 'true';
    const removeVideo = req.body.removeVideo === true || req.body.removeVideo === 'true';
    if (!Number.isSafeInteger(id) || id <= 0 ||
        (title !== undefined && (typeof title !== 'string' || !title.trim())) ||
        (category !== undefined && (typeof category !== 'string' || !category.trim())) ||
        (summary !== undefined && typeof summary !== 'string') ||
        (body !== undefined && (typeof body !== 'string' || !body.trim())) ||
        (youtubeUrl !== undefined && typeof youtubeUrl !== 'string') ||
        youtubeEmbedUrl === null ||
        (req.body.removeVideo !== undefined && req.body.removeVideo !== true && req.body.removeVideo !== false &&
            req.body.removeVideo !== 'true' && req.body.removeVideo !== 'false') ||
        (video && youtubeEmbedUrl) ||
        !validPublished ||
        (req.body.removeImage !== undefined && req.body.removeImage !== true && req.body.removeImage !== false &&
            req.body.removeImage !== 'true' && req.body.removeImage !== 'false') ||
        [title, category, summary, body, published, youtubeUrl, image, video, removeImage ? true : undefined, removeVideo ? true : undefined].every((value) => value === undefined)) {
        await removeUploadedNewsFiles(req);
        res.status(400).json({
            message: youtubeEmbedUrl === null
                ? 'Enter a valid YouTube video link.'
                : video && youtubeEmbedUrl
                    ? 'Choose either an uploaded video or a YouTube link.'
                    : 'Provide valid article details to update.'
        });
        return;
    }
    try {
        const existingArticle = await prisma.newsArticle.findUnique({ where: { id } });
        if (!existingArticle) {
            await removeUploadedNewsFiles(req);
            res.status(404).json({ message: 'Article not found.' });
            return;
        }
        if (youtubeEmbedUrl && existingArticle.videoUrl && !video && !removeVideo) {
            await removeUploadedNewsFiles(req);
            res.status(400).json({ message: 'Remove the uploaded video before adding a YouTube video link.' });
            return;
        }
        const article = await prisma.newsArticle.update({
            where: { id },
            data: {
                ...(typeof title === 'string' ? { title: title.trim(), slug: slugify(title) } : {}),
                ...(typeof category === 'string' ? { category: category.trim() } : {}),
                ...(typeof summary === 'string' ? { summary: summary.trim() || null } : {}),
                ...(typeof body === 'string' ? { body: body.trim() } : {}),
                ...(published !== undefined ? { published: isPublished } : {}),
                ...(image ? { imageUrl: `/uploads/news/${image.filename}` } : {}),
                ...(removeImage && !image ? { imageUrl: null } : {}),
                ...(video ? { videoUrl: `/uploads/news/${video.filename}`, youtubeUrl: null } : {}),
                ...(youtubeUrl !== undefined ? { youtubeUrl: youtubeEmbedUrl ?? null } : {}),
                ...(removeVideo && !video ? { videoUrl: null } : {})
            }
        });
        if (image || removeImage) {
            try {
                await removeNewsImage(existingArticle.imageUrl);
            }
            catch (error) {
                console.error('Unable to remove replaced news image:', error);
            }
        }
        if (video || removeVideo) {
            try {
                await removeNewsImage(existingArticle.videoUrl);
            }
            catch (error) {
                console.error('Unable to remove replaced news video:', error);
            }
        }
        res.json({ id: String(article.id) });
    }
    catch (error) {
        await removeUploadedNewsFiles(req);
        if (isPrismaError(error, 'P2002')) {
            res.status(409).json({ message: 'An article with this title already exists.' });
            return;
        }
        if (isPrismaError(error, 'P2025')) {
            res.status(404).json({ message: 'Article not found.' });
            return;
        }
        throw error;
    }
});
app.delete('/api/admin/news/:id', async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id <= 0) {
        res.status(400).json({ message: 'Invalid article ID.' });
        return;
    }
    try {
        const article = await prisma.newsArticle.delete({ where: { id } });
        try {
            await removeNewsImage(article.imageUrl);
            await removeNewsImage(article.videoUrl);
        }
        catch (error) {
            console.error('Unable to remove deleted news image:', error);
        }
        res.json({ message: 'Article deleted.' });
    }
    catch (error) {
        if (isPrismaError(error, 'P2025')) {
            res.status(404).json({ message: 'Article not found.' });
            return;
        }
        throw error;
    }
});
app.post('/api/admin/publications', async (req, res) => {
    const { title, fileUrl } = req.body;
    if (typeof title !== 'string' || !title.trim() ||
        typeof fileUrl !== 'string' || !/^https?:\/\/\S+$/i.test(fileUrl.trim())) {
        res.status(400).json({ message: 'Enter a publication title and a valid HTTP(S) file URL.' });
        return;
    }
    const publication = await prisma.publication.create({
        data: { title: title.trim(), fileUrl: fileUrl.trim() }
    });
    res.status(201).json({ id: String(publication.id) });
});
app.patch('/api/admin/publications/:id', async (req, res) => {
    const id = Number(req.params.id);
    const { title, fileUrl } = req.body;
    if (!Number.isSafeInteger(id) || id <= 0 ||
        (title !== undefined && (typeof title !== 'string' || !title.trim())) ||
        (fileUrl !== undefined && (typeof fileUrl !== 'string' || !/^https?:\/\/\S+$/i.test(fileUrl.trim()))) ||
        (title === undefined && fileUrl === undefined)) {
        res.status(400).json({ message: 'Provide a valid publication title or file URL to update.' });
        return;
    }
    try {
        const publication = await prisma.publication.update({
            where: { id },
            data: {
                ...(typeof title === 'string' ? { title: title.trim() } : {}),
                ...(typeof fileUrl === 'string' ? { fileUrl: fileUrl.trim() } : {})
            }
        });
        res.json({ id: String(publication.id) });
    }
    catch (error) {
        if (isPrismaError(error, 'P2025')) {
            res.status(404).json({ message: 'Publication not found.' });
            return;
        }
        throw error;
    }
});
app.delete('/api/admin/publications/:id', async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id <= 0) {
        res.status(400).json({ message: 'Invalid publication ID.' });
        return;
    }
    try {
        await prisma.publication.delete({ where: { id } });
        res.json({ message: 'Publication deleted.' });
    }
    catch (error) {
        if (isPrismaError(error, 'P2025')) {
            res.status(404).json({ message: 'Publication not found.' });
            return;
        }
        throw error;
    }
});
app.patch('/api/admin/bookings/:id', async (req, res) => {
    const id = Number(req.params.id);
    const { status } = req.body;
    if (!Number.isSafeInteger(id) || id <= 0 ||
        (status !== 'Pending' && status !== 'Confirmed' && status !== 'Review')) {
        res.status(400).json({ message: 'Choose a valid booking status.' });
        return;
    }
    try {
        await prisma.booking.update({ where: { id }, data: { status } });
        res.json({ message: 'Booking updated.' });
    }
    catch (error) {
        if (isPrismaError(error, 'P2025')) {
            res.status(404).json({ message: 'Booking not found.' });
            return;
        }
        throw error;
    }
});
app.delete('/api/admin/bookings/:id', async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id <= 0) {
        res.status(400).json({ message: 'Invalid booking ID.' });
        return;
    }
    try {
        await prisma.booking.delete({ where: { id } });
        res.json({ message: 'Booking deleted.' });
    }
    catch (error) {
        if (isPrismaError(error, 'P2025')) {
            res.status(404).json({ message: 'Booking not found.' });
            return;
        }
        throw error;
    }
});
app.patch('/api/admin/applications/:id', async (req, res) => {
    const id = Number(req.params.id);
    const { status } = req.body;
    if (!Number.isSafeInteger(id) || id <= 0 ||
        (status !== 'submitted' && status !== 'under_review' && status !== 'accepted' && status !== 'rejected')) {
        res.status(400).json({ message: 'Choose a valid application status.' });
        return;
    }
    try {
        await prisma.application.update({ where: { id }, data: { status } });
        res.json({ message: 'Application updated.' });
    }
    catch (error) {
        if (isPrismaError(error, 'P2025')) {
            res.status(404).json({ message: 'Application not found.' });
            return;
        }
        throw error;
    }
});
app.delete('/api/admin/applications/:id', async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id <= 0) {
        res.status(400).json({ message: 'Invalid application ID.' });
        return;
    }
    try {
        await prisma.application.delete({ where: { id } });
        res.json({ message: 'Application deleted.' });
    }
    catch (error) {
        if (isPrismaError(error, 'P2025')) {
            res.status(404).json({ message: 'Application not found.' });
            return;
        }
        throw error;
    }
});
app.delete('/api/admin/reviews/:id', async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id <= 0) {
        res.status(400).json({ message: 'Invalid review ID.' });
        return;
    }
    try {
        await prisma.review.delete({ where: { id } });
        res.json({ message: 'Review deleted.' });
    }
    catch (error) {
        if (isPrismaError(error, 'P2025')) {
            res.status(404).json({ message: 'Review not found.' });
            return;
        }
        throw error;
    }
});
app.delete('/api/admin/inquiries/:id', async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id <= 0) {
        res.status(400).json({ message: 'Invalid inquiry ID.' });
        return;
    }
    try {
        await prisma.contactInquiry.delete({ where: { id } });
        res.json({ message: 'Inquiry deleted.' });
    }
    catch (error) {
        if (isPrismaError(error, 'P2025')) {
            res.status(404).json({ message: 'Inquiry not found.' });
            return;
        }
        throw error;
    }
});
app.put('/api/admin/site-settings/:key', async (req, res) => {
    const key = req.params.key;
    const { value } = req.body;
    if (!/^[a-zA-Z0-9._-]{1,100}$/.test(key) || typeof value !== 'string' || value.length > 10000) {
        res.status(400).json({ message: 'Enter a valid setting key and a value under 10,000 characters.' });
        return;
    }
    await prisma.siteSetting.upsert({
        where: { key },
        update: { value },
        create: { key, value }
    });
    res.json({ message: 'Site setting saved.' });
});
app.delete('/api/admin/site-settings/:key', async (req, res) => {
    const key = req.params.key;
    try {
        await prisma.siteSetting.delete({ where: { key } });
        res.json({ message: 'Site setting deleted.' });
    }
    catch (error) {
        if (isPrismaError(error, 'P2025')) {
            res.status(404).json({ message: 'Site setting not found.' });
            return;
        }
        throw error;
    }
});
app.use((error, _req, res, _next) => {
    if (error instanceof NewsMediaUploadError) {
        res.status(400).json({ message: error.message });
        return;
    }
    if (error instanceof multer_1.MulterError) {
        const status = error.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
        res.status(status).json({
            message: error.code === 'LIMIT_FILE_SIZE'
                ? 'Uploaded news videos must be 50 MB or smaller; images must be 5 MB or smaller.'
                : 'Upload at most one image and one video per news article.'
        });
        return;
    }
    console.error('Unhandled API error:', error);
    res.status(500).json({ message: 'An unexpected server error occurred.' });
});
if (require.main === module) {
    app.listen(port, () => {
        console.log(`Server listening on http://localhost:${port}`);
    });
}
