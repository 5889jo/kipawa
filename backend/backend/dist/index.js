// @ts-nocheck
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function (o, m, k, k2) {
    if (k2 === undefined)
        k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function () { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function (o, m, k, k2) {
    if (k2 === undefined)
        k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function (o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function (o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function (o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o)
                if (Object.prototype.hasOwnProperty.call(o, k))
                    ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule)
            return mod;
        var result = {};
        if (mod != null)
            for (var k = ownKeys(mod), i = 0; i < k.length; i++)
                if (k[i] !== "default")
                    __createBinding(result, mod, k[i]);
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
const { canAccessAdminBookingPath, canSubmitCourseRequest, getAdminBookingDataAccess } = require("./adminBookingAccess");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const dotenv_1 = __importDefault(require("dotenv"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const multer_1 = __importStar(require("multer"));
const { getCourseCategoryForDisplay } = require("./courseCategory");
const { parseCampaignAttribution } = require("./campaignAttribution");
const adapter_pg_1 = require("@prisma/adapter-pg");
const client_1 = require("./generated/prisma/client");
dotenv_1.default.config({ path: '../.env' });
const app = (0, express_1.default)();
exports.app = app;
const port = Number(process.env.PORT ?? 4000);
const applicationFormFeeTzs = 5000;
const newsUploadDirectory = node_path_1.default.resolve(__dirname, '..', 'uploads', 'news');
const courseUploadDirectory = node_path_1.default.resolve(__dirname, '..', 'uploads', 'courses');
const organizationUploadDirectory = node_path_1.default.resolve(__dirname, '..', 'uploads', 'organization');
const partnerUploadDirectory = node_path_1.default.resolve(__dirname, '..', 'uploads', 'partners');
const publicationUploadDirectory = node_path_1.default.resolve(__dirname, '..', 'uploads', 'publications');
const paymentProofUploadDirectory = node_path_1.default.resolve(__dirname, '..', 'uploads', 'payment-proofs');
(0, node_fs_1.mkdirSync)(newsUploadDirectory, { recursive: true });
(0, node_fs_1.mkdirSync)(courseUploadDirectory, { recursive: true });
(0, node_fs_1.mkdirSync)(organizationUploadDirectory, { recursive: true });
(0, node_fs_1.mkdirSync)(partnerUploadDirectory, { recursive: true });
(0, node_fs_1.mkdirSync)(publicationUploadDirectory, { recursive: true });
(0, node_fs_1.mkdirSync)(paymentProofUploadDirectory, { recursive: true });
const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
    throw new Error('JWT_SECRET must be set in the project root .env file.');
}
if (process.env.NODE_ENV === 'production' && (jwtSecret.length < 32 || /demo|change[-_ ]?me|placeholder|example|default/i.test(jwtSecret))) {
    throw new Error('Production JWT_SECRET must be at least 32 characters and must not be a placeholder or demo value.');
}
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
    throw new Error('DATABASE_URL must be set in the project root .env file.');
}
const bcryptRounds = Number(process.env.BCRYPT_ROUNDS ?? 12);
if (!Number.isInteger(bcryptRounds) || bcryptRounds < 10 || bcryptRounds > 14) {
    throw new Error('BCRYPT_ROUNDS must be an integer between 10 and 14.');
}
const prisma = new client_1.PrismaClient({ adapter: new adapter_pg_1.PrismaPg({ connectionString: databaseUrl }) });
exports.prisma = prisma;
app.disable('x-powered-by');
const expiryMatch = /^(\d+)(s|m|h|d)?$/.exec(process.env.JWT_EXPIRES_IN ?? '7d');
if (!expiryMatch || Number(expiryMatch[1]) <= 0) {
    throw new Error('JWT_EXPIRES_IN must be a positive number optionally followed by s, m, h, or d.');
}
const expiryUnit = expiryMatch[2];
const jwtExpiresIn = Number(expiryMatch[1]) * (expiryUnit === 'd' ? 24 * 60 * 60 :
    expiryUnit === 'h' ? 60 * 60 :
        expiryUnit === 'm' ? 60 : 1);
if (process.env.NODE_ENV === 'production' && jwtExpiresIn > 12 * 60 * 60) {
    throw new Error('Production JWT_EXPIRES_IN must not exceed 12 hours.');
}
const isProduction = process.env.NODE_ENV === 'production';
const configuredCookieSameSite = (process.env.SESSION_COOKIE_SAME_SITE ?? 'lax').toLowerCase();
if (!['strict', 'lax', 'none'].includes(configuredCookieSameSite)) {
    throw new Error('SESSION_COOKIE_SAME_SITE must be strict, lax, or none.');
}
if (configuredCookieSameSite === 'none' && !isProduction) {
    throw new Error('SESSION_COOKIE_SAME_SITE=none requires production HTTPS.');
}
const sessionCookieName = isProduction ? '__Host-kipawa_session' : 'kipawa_session';
const csrfCookieName = isProduction ? '__Host-kipawa_csrf' : 'kipawa_csrf';
const sessionCookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: configuredCookieSameSite,
    path: '/',
    maxAge: jwtExpiresIn * 1000
};
const csrfCookieOptions = {
    httpOnly: false,
    secure: isProduction,
    sameSite: configuredCookieSameSite,
    path: '/',
    maxAge: jwtExpiresIn * 1000
};
const clearedCookieOptions = {
    secure: isProduction,
    sameSite: configuredCookieSameSite,
    path: '/'
};
class NewsMediaUploadError extends Error {
}
class PublicationPdfUploadError extends Error {
}
class CourseMediaUploadError extends Error {
}
class PaymentProofUploadError extends Error {
}
class OrganizationImageUploadError extends Error {
}
class PartnerLogoUploadError extends Error {
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
const courseImageExtensions = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'image/gif': '.gif'
};
const courseVideoExtensions = {
    'video/mp4': '.mp4',
    'video/webm': '.webm'
};
const organizationImageExtensions = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp'
};
const partnerLogoExtensions = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp'
};
const paymentProofExtensions = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp'
};
const paymentProofMatchesMimeType = async (proof) => {
    const imageHeader = await promises_1.readFile(proof.path).then((image) => image.subarray(0, 12));
    if (proof.mimetype === 'image/jpeg') {
        return imageHeader.length >= 3 && imageHeader[0] === 0xff && imageHeader[1] === 0xd8 && imageHeader[2] === 0xff;
    }
    if (proof.mimetype === 'image/png') {
        return imageHeader.length >= 8 &&
            imageHeader[0] === 0x89 && imageHeader[1] === 0x50 &&
            imageHeader[2] === 0x4e && imageHeader[3] === 0x47 &&
            imageHeader[4] === 0x0d && imageHeader[5] === 0x0a &&
            imageHeader[6] === 0x1a && imageHeader[7] === 0x0a;
    }
    return proof.mimetype === 'image/webp' &&
        imageHeader.length >= 12 &&
        imageHeader.toString('ascii', 0, 4) === 'RIFF' &&
        imageHeader.toString('ascii', 8, 12) === 'WEBP';
};
const publicationPdfExtensions = { 'application/pdf': '.pdf' };
const courseMediaUpload = (0, multer_1.default)({
    storage: multer_1.default.diskStorage({
        destination: (_req, _file, callback) => callback(null, courseUploadDirectory),
        filename: (_req, file, callback) => {
            const extension = file.fieldname === 'coverImage'
                ? courseImageExtensions[file.mimetype]
                : courseVideoExtensions[file.mimetype] ?? courseImageExtensions[file.mimetype];
            callback(null, `${(0, node_crypto_1.randomUUID)()}${extension}`);
        }
    }),
    limits: { fileSize: 50 * 1024 * 1024, files: 11, fields: 25, fieldSize: 256 * 1024, parts: 40 },
    fileFilter: (_req, file, callback) => {
        const validCoverImage = file.fieldname === 'coverImage' && Boolean(courseImageExtensions[file.mimetype]);
        const validCourseMedia = file.fieldname === 'courseMedia' &&
            Boolean(courseImageExtensions[file.mimetype] || courseVideoExtensions[file.mimetype]);
        if (!validCoverImage && !validCourseMedia) {
            callback(new CourseMediaUploadError('Upload course images in JPEG, PNG, WebP, or GIF format, or videos in MP4 or WebM format.'));
            return;
        }
        callback(null, true);
    }
}).fields([{ name: 'coverImage', maxCount: 1 }, { name: 'courseMedia', maxCount: 10 }]);
const organizationImageUpload = (0, multer_1.default)({
    storage: multer_1.default.diskStorage({
        destination: (_req, _file, callback) => callback(null, organizationUploadDirectory),
        filename: (_req, file, callback) => callback(null, `${(0, node_crypto_1.randomUUID)()}${organizationImageExtensions[file.mimetype]}`)
    }),
    limits: { fileSize: 10 * 1024 * 1024, files: 1, fields: 25, fieldSize: 256 * 1024, parts: 30 },
    fileFilter: (_req, file, callback) => {
        if (file.fieldname !== 'profileImage' || !organizationImageExtensions[file.mimetype]) {
            callback(new OrganizationImageUploadError('Upload a profile photo in JPEG, PNG, or WebP format.'));
            return;
        }
        callback(null, true);
    }
}).single('profileImage');
const uploadOrganizationImage = (req, res, next) => {
    organizationImageUpload(req, res, (error) => {
        if (error) {
            next(error);
            return;
        }
        next();
    });
};
const partnerLogoUpload = (0, multer_1.default)({
    storage: multer_1.default.diskStorage({
        destination: (_req, _file, callback) => callback(null, partnerUploadDirectory),
        filename: (_req, file, callback) => callback(null, `${(0, node_crypto_1.randomUUID)()}${partnerLogoExtensions[file.mimetype]}`)
    }),
    limits: { fileSize: 5 * 1024 * 1024, files: 1, fields: 25, fieldSize: 256 * 1024, parts: 30 },
    fileFilter: (_req, file, callback) => {
        if (file.fieldname !== 'partnerLogo' || !partnerLogoExtensions[file.mimetype]) {
            callback(new PartnerLogoUploadError('Upload a partner logo in JPEG, PNG, or WebP format.'));
            return;
        }
        callback(null, true);
    }
}).single('partnerLogo');
const uploadPartnerLogo = (req, res, next) => {
    partnerLogoUpload(req, res, (error) => {
        if (error) {
            next(error);
            return;
        }
        next();
    });
};
const removeUploadedPartnerLogo = async (req) => {
    if (!req.file)
        return;
    try {
        await (0, promises_1.unlink)(req.file.path);
    }
    catch (error) {
        if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'ENOENT')
            return;
        throw error;
    }
};
const removeUploadedOrganizationImage = async (req) => {
    if (!req.file)
        return;
    try {
        await (0, promises_1.unlink)(req.file.path);
    }
    catch (error) {
        if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'ENOENT')
            return;
        throw error;
    }
};
const paymentProofUpload = (0, multer_1.default)({
    storage: multer_1.default.diskStorage({
        destination: (_req, _file, callback) => callback(null, paymentProofUploadDirectory),
        filename: (_req, file, callback) => callback(null, `${(0, node_crypto_1.randomUUID)()}${paymentProofExtensions[file.mimetype]}`)
    }),
    limits: { fileSize: 5 * 1024 * 1024, files: 1, fields: 25, fieldSize: 256 * 1024, parts: 30 },
    fileFilter: (_req, file, callback) => {
        if (file.fieldname !== 'paymentProof' || !paymentProofExtensions[file.mimetype]) {
            callback(new PaymentProofUploadError('Upload a payment screenshot in JPEG, PNG, or WebP format.'));
            return;
        }
        callback(null, true);
    }
}).single('paymentProof');
const uploadCourseImage = (req, res, next) => {
    courseMediaUpload(req, res, (error) => {
        if (error) {
            next(error);
            return;
        }
        const uploadedFiles = req.files;
        const files = [
            ...(uploadedFiles?.coverImage ?? []),
            ...(uploadedFiles?.courseMedia ?? [])
        ];
        const oversizedImage = files.find((file) => (file.fieldname === 'coverImage' || Boolean(courseImageExtensions[file.mimetype])) &&
            file.size > 5 * 1024 * 1024);
        if (oversizedImage) {
            void Promise.all(files.map(async (file) => {
                try {
                    await (0, promises_1.unlink)(file.path);
                }
                catch (cleanupError) {
                    if (typeof cleanupError === 'object' && cleanupError !== null && 'code' in cleanupError && cleanupError.code === 'ENOENT')
                        return;
                    throw cleanupError;
                }
            })).then(() => res.status(413).json({ message: 'Course images and cover images must be 5 MB or smaller. Videos must be 50 MB or smaller.' }), (cleanupError) => next(cleanupError));
            return;
        }
        next();
    });
};
const getUploadedCourseImage = (req) => req.files?.coverImage?.[0];
const getUploadedCourseMedia = (req) => req.files?.courseMedia ?? [];
const removeUploadedCourseImage = async (req) => {
    const files = [
        ...(getUploadedCourseImage(req) ? [getUploadedCourseImage(req)] : []),
        ...getUploadedCourseMedia(req)
    ];
    await Promise.all(files.map(async (file) => {
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
    limits: { fileSize: 50 * 1024 * 1024, files: 2, fields: 25, fieldSize: 256 * 1024, parts: 30 },
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
const publicationPdfUpload = (0, multer_1.default)({
    storage: multer_1.default.diskStorage({
        destination: (_req, _file, callback) => callback(null, publicationUploadDirectory),
        filename: (_req, _file, callback) => callback(null, `${(0, node_crypto_1.randomUUID)()}.pdf`)
    }),
    limits: { fileSize: 20 * 1024 * 1024, files: 1, fields: 25, fieldSize: 256 * 1024, parts: 30 },
    fileFilter: (_req, file, callback) => {
        if (file.fieldname !== 'publicationPdf' || !publicationPdfExtensions[file.mimetype]) {
            callback(new PublicationPdfUploadError('Upload a publication in PDF format.'));
            return;
        }
        callback(null, true);
    }
}).single('publicationPdf');
const uploadPublicationPdf = (req, res, next) => {
    publicationPdfUpload(req, res, (error) => {
        if (error) {
            next(error);
            return;
        }
        next();
    });
};
const getUploadedPublicationPdf = (req) => req.file;
const removeUploadedPublicationPdf = async (req) => {
    const file = getUploadedPublicationPdf(req);
    if (!file)
        return;
    try {
        await (0, promises_1.unlink)(file.path);
    }
    catch (error) {
        if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'ENOENT')
            return;
        throw error;
    }
};
const removePublicationPdf = async (fileUrl) => {
    if (!fileUrl || !fileUrl.startsWith('/uploads/publications/'))
        return;
    const filename = node_path_1.default.basename(fileUrl);
    if (fileUrl !== `/uploads/publications/${filename}` || !/^[\w-]+\.pdf$/i.test(filename)) {
        throw new Error('Stored publication PDF path is invalid.');
    }
    try {
        await (0, promises_1.unlink)(node_path_1.default.join(publicationUploadDirectory, filename));
    }
    catch (error) {
        if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'ENOENT')
            return;
        throw error;
    }
};
const isValidPublicationFileUrl = (value) => typeof value === 'string' &&
    (/^https?:\/\/\S+$/i.test(value.trim()) || /^\/uploads\/publications\/[\w-]+\.pdf$/i.test(value.trim()));
const parsePublicationCourseId = (value) => {
    if (value === undefined)
        return { valid: true, courseId: undefined };
    if (value === null || value === '')
        return { valid: true, courseId: null };
    if (typeof value !== 'string' && typeof value !== 'number')
        return { valid: false, courseId: null };
    const courseId = Number(value);
    return Number.isSafeInteger(courseId) && courseId > 0
        ? { valid: true, courseId }
        : { valid: false, courseId: null };
};
const isValidPdfSignature = async (file) => {
    if (!file)
        return false;
    const content = await (0, promises_1.readFile)(file.path);
    return content.subarray(0, 5).toString('ascii') === '%PDF-';
};
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
const removeRequestUploads = async (req) => {
    const files = [
        ...(req.file ? [req.file] : []),
        ...Object.values(req.files ?? {}).flat()
    ];
    await Promise.all(files.map(async (file) => {
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
    if (typeof value !== 'string')
        return null;
    if (!value.trim())
        return undefined;
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
const removeCourseImage = async (imageUrl) => {
    if (!imageUrl || !imageUrl.startsWith('/uploads/courses/'))
        return;
    const filename = node_path_1.default.basename(imageUrl);
    if (imageUrl !== `/uploads/courses/${filename}`) {
        throw new Error('Stored course image path is invalid.');
    }
    try {
        await (0, promises_1.unlink)(node_path_1.default.join(courseUploadDirectory, filename));
    }
    catch (error) {
        if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'ENOENT')
            return;
        throw error;
    }
};
const removeOrganizationImage = async (imageUrl) => {
    if (!imageUrl || !imageUrl.startsWith('/uploads/organization/'))
        return;
    const filename = node_path_1.default.basename(imageUrl);
    if (imageUrl !== `/uploads/organization/${filename}` || !/^[\w-]+\.(jpg|png|webp)$/i.test(filename)) {
        throw new Error('Stored organization profile image path is invalid.');
    }
    try {
        await (0, promises_1.unlink)(node_path_1.default.join(organizationUploadDirectory, filename));
    }
    catch (error) {
        if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'ENOENT')
            return;
        throw error;
    }
};
const removePartnerLogo = async (imageUrl) => {
    if (!imageUrl || !imageUrl.startsWith('/uploads/partners/'))
        return;
    const filename = node_path_1.default.basename(imageUrl);
    if (imageUrl !== `/uploads/partners/${filename}` || !/^[\w-]+\.(jpg|png|webp)$/i.test(filename)) {
        throw new Error('Stored partner logo path is invalid.');
    }
    try {
        await (0, promises_1.unlink)(node_path_1.default.join(partnerUploadDirectory, filename));
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
const adminPermissions = ['users', 'courses', 'news', 'shortCourseEnquiries', 'bookings', 'publications', 'siteSettings', 'organizationStructure', 'partners'];
const adminSectionPermissions = {
    users: 'users',
    courses: 'courses',
    centres: 'courses',
    news: 'news',
    'course-interests': 'shortCourseEnquiries',
    bookings: 'bookings',
    publications: 'publications',
    'site-settings': 'siteSettings',
    'organization-structure': 'organizationStructure',
    partners: 'partners'
};
const isAdminRole = (role) => role?.name.toLowerCase() === 'admin';
const getAssignedRole = (user) => user.roles.find(({ role }) => isAdminRole(role))?.role ?? user.roles[0]?.role;
const getRole = (user) => {
    const role = getAssignedRole(user);
    if (!role || ['applicant', 'user'].includes(role.name.toLowerCase()))
        return 'user';
    return isAdminRole(role) ? 'admin' : role.name;
};
const getPermissions = (user) => user.roles.some(({ role }) => isAdminRole(role))
    ? adminPermissions
    : [...new Set(user.roles.flatMap(({ role }) => role.permissions)
            .filter((permission) => adminPermissions.includes(permission)))];
const canAssignRole = (actor, role) => actor.role === 'admin' ||
    (!isAdminRole(role) && role.permissions.every((permission) => actor.permissions.includes(permission)));
const sanitizeUser = (user) => ({
    id: String(user.id),
    name: `${user.firstName} ${user.lastName}`.trim(),
    email: user.email,
    role: getRole(user),
    roleId: getAssignedRole(user) ? String(getAssignedRole(user).id) : null,
    permissions: getPermissions(user)
});
const signToken = (user) => jsonwebtoken_1.default.sign({ sub: String(user.id), email: user.email }, jwtSecret, { algorithm: 'HS256', expiresIn: jwtExpiresIn });
const readCookie = (req, name) => {
    const cookieHeader = req.headers.cookie;
    if (typeof cookieHeader !== 'string')
        return null;
    for (const cookie of cookieHeader.split(';')) {
        const separator = cookie.indexOf('=');
        if (separator < 0 || cookie.slice(0, separator).trim() !== name)
            continue;
        try {
            return decodeURIComponent(cookie.slice(separator + 1).trim());
        }
        catch {
            return null;
        }
    }
    return null;
};
const signCsrfToken = (nonce) => `${nonce}.${(0, node_crypto_1.createHmac)('sha256', jwtSecret).update(nonce).digest('hex')}`;
const isValidCsrfToken = (token) => {
    if (typeof token !== 'string')
        return false;
    const [nonce, signature, ...extra] = token.split('.');
    if (extra.length || !/^[a-f0-9]{64}$/.test(nonce ?? '') || !/^[a-f0-9]{64}$/.test(signature ?? ''))
        return false;
    const expected = (0, node_crypto_1.createHmac)('sha256', jwtSecret).update(nonce).digest();
    return (0, node_crypto_1.timingSafeEqual)(Buffer.from(signature, 'hex'), expected);
};
const csrfProtection = (req, res, next) => {
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        next();
        return;
    }
    const origin = req.get('origin');
    if (origin && !configuredClientOrigins.includes(origin)) {
        res.status(403).json({ message: 'Request origin is not allowed.' });
        return;
    }
    const cookieToken = readCookie(req, csrfCookieName);
    const headerToken = req.get('X-CSRF-Token');
    if (!isValidCsrfToken(cookieToken) || !isValidCsrfToken(headerToken) ||
        cookieToken.length !== headerToken.length ||
        !(0, node_crypto_1.timingSafeEqual)(Buffer.from(cookieToken), Buffer.from(headerToken))) {
        res.status(403).json({ message: 'Your security token is missing or expired. Refresh the page and try again.' });
        return;
    }
    next();
};
const csrfTokenHandler = (req, res) => {
    const existingToken = readCookie(req, csrfCookieName);
    const token = isValidCsrfToken(existingToken)
        ? existingToken
        : signCsrfToken((0, node_crypto_1.randomBytes)(32).toString('hex'));
    res.cookie(csrfCookieName, token, csrfCookieOptions);
    res.json({ csrfToken: token });
};
const setSessionCookie = (res, user) => {
    res.cookie(sessionCookieName, signToken(user), sessionCookieOptions);
};
const clearAuthCookies = (res) => {
    res.clearCookie(sessionCookieName, clearedCookieOptions);
    res.clearCookie(csrfCookieName, clearedCookieOptions);
};
const authMiddleware = async (req, res, next) => {
    const token = readCookie(req, sessionCookieName);
    if (!token) {
        res.status(401).json({ message: 'Authentication required.' });
        return;
    }
    let userId;
    try {
        const payload = jsonwebtoken_1.default.verify(token, jwtSecret, { algorithms: ['HS256'] });
        if (typeof payload === 'string' || typeof payload.sub !== 'string') {
            clearAuthCookies(res);
            res.status(401).json({ message: 'Invalid or expired token.' });
            return;
        }
        userId = Number(payload.sub);
        if (!Number.isSafeInteger(userId) || userId <= 0) {
            clearAuthCookies(res);
            res.status(401).json({ message: 'Invalid or expired token.' });
            return;
        }
    }
    catch {
        clearAuthCookies(res);
        res.status(401).json({ message: 'Invalid or expired token.' });
        return;
    }
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: userWithRoles
    });
    if (!user || !user.isActive) {
        clearAuthCookies(res);
        if (user && user.paymentProofRejectionCount >= 3) {
            res.status(403).json({ message: 'Your account has been blocked after three rejected payment screenshots. Contact the centre for assistance.' });
            return;
        }
        res.status(401).json({ message: 'User not found or inactive.' });
        return;
    }
    const name = `${user.firstName} ${user.lastName}`.trim();
    req.user = {
        id: user.id,
        email: user.email,
        name,
        role: getRole(user),
        permissions: getPermissions(user)
    };
    next();
};
const optionalAuthMiddleware = (req, res, next) => readCookie(req, sessionCookieName) ? authMiddleware(req, res, next) : next();
const requireCourseRequestAccess = (req, res, next) => {
    if (req.user && !canSubmitCourseRequest(req.user.role)) {
        res.status(403).json({ message: 'Administrator accounts cannot request course bookings.' });
        return;
    }
    next();
};
const requireAdmin = (req, res, next) => {
    const user = req.user;
    if (!user) {
        res.status(401).json({ message: 'Authentication required.' });
        return;
    }
    if (user.role === 'admin') {
        next();
        return;
    }
    const section = req.path.split('/')[1];
    const permission = adminSectionPermissions[section];
    const allowed = section === 'data'
        ? user.permissions.length > 0
        : section === 'overview'
            ? user.permissions.length > 0
            : section === 'bookings'
                ? canAccessAdminBookingPath(req.path, user.role, user.permissions)
                : Boolean(permission && user.permissions.includes(permission));
    if (!allowed) {
        res.status(403).json({ message: 'You do not have permission to manage this area.' });
        return;
    }
    next();
};
const isPrismaError = (error, code) => typeof error === 'object' && error !== null && 'code' in error && error.code === code;
const slugify = (value) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const normalizePhoneNumber = (value) => typeof value === 'string'
    ? value.trim().replace(/[()\s.-]/g, '')
    : '';
const isValidPhoneNumber = (value) => /^\+?\d{7,15}$/.test(value);
const isValidCourseStartDate = (value) => {
    if (typeof value !== 'string')
        return false;
    const [datePart, timePart] = value.split('T');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(datePart))
        return false;
    const date = new Date(`${datePart}T00:00:00.000Z`);
    if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== datePart)
        return false;
    if (timePart === undefined)
        return true;
    const time = /^(\d{2}):(\d{2})$/.exec(timePart);
    return Boolean(time && Number(time[1]) < 24 && Number(time[2]) < 60);
};
const courseStartDate = (value) => value.includes('T')
    ? new Date(`${value}:00+03:00`)
    : new Date(`${value}T00:00:00.000Z`);
const courseDateKey = (value) => {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Africa/Dar_es_Salaam',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).formatToParts(value);
    const part = (type) => parts.find((item) => item.type === type)?.value ?? '';
    return `${part('year')}-${part('month')}-${part('day')}`;
};
const coursePublicationDate = (value, endOfDay = false) => new Date(`${value}T${endOfDay ? '23:59:59.999' : '00:00:00.000'}Z`);
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
const parseCourseCentres = (value) => {
    if (value === undefined)
        return undefined;
    if (Array.isArray(value))
        return value.every((centre) => typeof centre === 'string') ? value : null;
    if (typeof value !== 'string')
        return null;
    try {
        const centres = JSON.parse(value);
        return Array.isArray(centres) && centres.every((centre) => typeof centre === 'string') ? centres : null;
    }
    catch {
        return null;
    }
};
const configuredClientOrigins = (process.env.CLIENT_URL ?? 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
    .map((origin) => {
    let parsedOrigin;
    try {
        parsedOrigin = new URL(origin);
    }
    catch {
        throw new Error('CLIENT_URL must contain one or more valid frontend origins.');
    }
    if (!['http:', 'https:'].includes(parsedOrigin.protocol) ||
        parsedOrigin.pathname !== '/' || parsedOrigin.search || parsedOrigin.hash) {
        throw new Error('CLIENT_URL entries must be frontend origins without paths, queries, or fragments.');
    }
    if (process.env.NODE_ENV === 'production' &&
        (parsedOrigin.protocol !== 'https:' || ['localhost', '127.0.0.1'].includes(parsedOrigin.hostname))) {
        throw new Error('Production CLIENT_URL entries must use HTTPS and cannot point to localhost.');
    }
    return parsedOrigin.origin;
});
if (configuredClientOrigins.length === 0) {
    throw new Error('CLIENT_URL must contain at least one frontend origin.');
}
app.use((0, cors_1.default)({
    origin: (origin, callback) => callback(null, !origin || configuredClientOrigins.includes(origin)),
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'X-CSRF-Token'],
    credentials: true,
    maxAge: 600
}));
app.use((0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            frameSrc: ["'self'", 'https://www.youtube-nocookie.com', 'https://www.veta.go.tz']
        }
    }
}));
app.use((0, morgan_1.default)(process.env.NODE_ENV === 'production' ? 'tiny' : 'dev'));
app.use('/uploads/news', (_req, res, next) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    next();
}, express_1.default.static(newsUploadDirectory, { dotfiles: 'deny', index: false }));
app.use('/uploads/courses', (_req, res, next) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    next();
}, express_1.default.static(courseUploadDirectory, { dotfiles: 'deny', index: false }));
app.use('/uploads/organization', (_req, res, next) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    next();
}, express_1.default.static(organizationUploadDirectory, { dotfiles: 'deny', index: false }));
app.use('/uploads/partners', (_req, res, next) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    next();
}, express_1.default.static(partnerUploadDirectory, { dotfiles: 'deny', index: false }));
app.use('/uploads/publications', (_req, res, next) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    next();
}, express_1.default.static(publicationUploadDirectory, { dotfiles: 'deny', index: false }));
app.use(express_1.default.json({ limit: '256kb', strict: true }));
app.use('/api', (_req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    next();
});
app.use('/api/auth', (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => ['/csrf', '/session'].includes(req.path),
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
app.use('/api', csrfProtection);
app.get('/api/auth/csrf', csrfTokenHandler);
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
app.get('/api/courses', async (req, res) => {
    const now = new Date();
    const includeAllShortCourses = req.query.includeAllShortCourses === 'true';
    const withinPublicationWindow = {
        AND: [
            { OR: [{ publishedFrom: null }, { publishedFrom: { lte: now } }] },
            { OR: [{ publishedUntil: null }, { publishedUntil: { gte: now } }] }
        ]
    };
    const courses = await prisma.course.findMany({
        where: includeAllShortCourses
            ? { OR: [{ courseType: 'Short Course' }, { courseType: { not: 'Short Course' } }] }
            : { OR: [{ courseType: { not: 'Short Course' } }, withinPublicationWindow] },
        include: {
            centres: { include: { centre: true } },
            categoryRecord: { select: { code: true } }
        },
        orderBy: { createdAt: 'desc' }
    });
    res.json({
        data: courses.map((course) => ({
            id: String(course.id),
            name: course.name,
            slug: course.slug,
            nameSw: course.nameSw,
            level: course.level,
            levelSw: course.levelSw,
            duration: course.duration,
            durationSw: course.durationSw,
            courseType: course.courseType,
            category: course.categoryRecord.code,
            startDate: course.startDate?.toISOString() ?? null,
            endDate: course.endDate?.toISOString() ?? null,
            publishedFrom: course.publishedFrom?.toISOString() ?? null,
            publishedUntil: course.publishedUntil?.toISOString() ?? null,
            fee: course.fee,
            imageUrl: course.imageUrl,
            centre: course.centres[0]?.centre.name,
            centreSw: course.centres[0]?.centre.nameSw,
            summary: course.description ?? 'Practical training aligned to workplace demand.',
            summarySw: course.descriptionSw
        }))
    });
});
app.get('/api/courses/:slug', async (req, res) => {
    const slug = req.params.slug;
    if (typeof slug !== 'string' || !slug.trim()) {
        res.status(400).json({ message: 'A valid course slug is required.' });
        return;
    }
    const course = await prisma.course.findUnique({
        where: { slug },
        include: {
            centres: { include: { centre: true } },
            media: { orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }] },
            categoryRecord: { select: { code: true } }
        }
    });
    const now = new Date();
    if (!course || (course.courseType === 'Short Course' &&
        ((course.publishedFrom && course.publishedFrom > now) ||
            (course.publishedUntil && course.publishedUntil < now)))) {
        res.status(404).json({ message: 'Course not found.' });
        return;
    }
    res.json({
        course: {
            id: String(course.id),
            name: course.name,
            nameSw: course.nameSw,
            slug: course.slug,
            level: course.level,
            levelSw: course.levelSw,
            duration: course.duration,
            durationSw: course.durationSw,
            courseType: course.courseType,
            category: course.categoryRecord.code,
            startDate: course.startDate?.toISOString() ?? null,
            endDate: course.endDate?.toISOString() ?? null,
            publishedFrom: course.publishedFrom?.toISOString() ?? null,
            publishedUntil: course.publishedUntil?.toISOString() ?? null,
            fee: course.fee,
            imageUrl: course.imageUrl,
            media: course.media.map((item) => ({
                id: String(item.id),
                type: item.type,
                url: item.url
            })),
            summary: course.description ?? '',
            summarySw: course.descriptionSw ?? '',
            centres: course.centres.map(({ centre }) => centre.name)
        }
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
            nameSw: centre.nameSw,
            district: centre.district.name,
            districtSw: centre.district.nameSw,
            region: centre.district.region.name,
            regionSw: centre.district.region.nameSw,
            type: centre.type,
            typeSw: centre.typeSw,
            focus: centre.focus,
            focusSw: centre.focusSw
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
            titleSw: article.titleSw,
            date: article.createdAt.toISOString(),
            category: article.category,
            categorySw: article.categorySw,
            summary: article.summary ?? article.body,
            summarySw: article.summarySw,
            body: article.body,
            bodySw: article.bodySw,
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
            titleSw: article.titleSw,
            date: article.createdAt.toISOString(),
            category: article.category,
            categorySw: article.categorySw,
            summary: article.summary ?? '',
            summarySw: article.summarySw,
            body: article.body,
            bodySw: article.bodySw,
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
    const publications = await prisma.publication.findMany({
        include: { course: { select: { id: true, name: true, nameSw: true, slug: true } } },
        orderBy: { createdAt: 'desc' }
    });
    res.json({
        data: publications.map((publication) => ({
            id: String(publication.id),
            title: publication.title,
            titleSw: publication.titleSw,
            fileUrl: publication.fileUrl,
            course: publication.course ? {
                id: String(publication.course.id),
                name: publication.course.name,
                nameSw: publication.course.nameSw,
                slug: publication.course.slug
            } : null,
            createdAt: publication.createdAt.toISOString()
        }))
    });
});
app.get('/api/organization', async (_req, res) => {
    const members = await prisma.organizationMember.findMany({
        where: { isPublished: true },
        include: { manager: { select: { id: true, isPublished: true } } },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }, { id: 'asc' }]
    });
    res.json({
        data: members.map((member) => ({
            id: String(member.id),
            name: member.name,
            nameSw: member.nameSw,
            position: member.position,
            positionSw: member.positionSw,
            biography: member.biography,
            biographySw: member.biographySw,
            qualifications: member.qualifications,
            qualificationsSw: member.qualificationsSw,
            responsibilities: member.responsibilities,
            responsibilitiesSw: member.responsibilitiesSw,
            imageUrl: member.imageUrl,
            managerId: member.manager?.isPublished ? String(member.manager.id) : null,
            sortOrder: member.sortOrder
        }))
    });
});
app.get('/api/partners', async (_req, res) => {
    const partners = await prisma.partner.findMany({
        where: { isPublished: true },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }, { id: 'asc' }]
    });
    res.json({
        data: partners.map((partner) => ({
            id: String(partner.id),
            name: partner.name,
            nameSw: partner.nameSw,
            description: partner.description,
            descriptionSw: partner.descriptionSw,
            logoUrl: partner.logoUrl,
            websiteUrl: partner.websiteUrl
        }))
    });
});
app.get('/api/site-settings', async (_req, res) => {
    const settings = await prisma.siteSetting.findMany({
        where: {
            AND: [
                {
                    OR: [
                        { key: { startsWith: 'site.' } },
                        { key: { startsWith: 'home.' } },
                        { key: { startsWith: 'about.' } },
                        { key: { startsWith: 'admissions.' } },
                        { key: { startsWith: 'legal.' } },
                        { key: { startsWith: 'publicInfo.' } }
                    ]
                },
                { key: { not: 'home.advertisement' } }
            ]
        },
        orderBy: { key: 'asc' }
    });
    res.json({
        data: Object.fromEntries(settings.map(({ key, value }) => [key, value])),
        translations: Object.fromEntries(settings.map(({ key, valueSw }) => [key, valueSw ?? '']))
    });
});
app.post('/api/site-stats/visitor', async (req, res) => {
    const { visitorId } = req.body;
    if (typeof visitorId !== 'string' ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(visitorId)) {
        res.status(400).json({ message: 'A valid anonymous visitor token is required.' });
        return;
    }
    const dateParts = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Africa/Dar_es_Salaam',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).formatToParts(new Date());
    const dateValues = Object.fromEntries(dateParts.map(({ type, value }) => [type, value]));
    const dateKey = `${dateValues.year}-${dateValues.month}-${dateValues.day}`;
    const visitorDate = new Date(`${dateKey}T00:00:00.000Z`);
    const visitorHash = (0, node_crypto_1.createHash)('sha256')
        .update(`${dateKey}:${visitorId}`)
        .digest('hex');
    try {
        await prisma.$transaction(async (transaction) => {
            await transaction.websiteDailyVisitor.create({ data: { visitorDate, visitorHash } });
            await transaction.websiteDailyVisitorCount.upsert({
                where: { visitorDate },
                create: { visitorDate, count: 1 },
                update: { count: { increment: 1 } }
            });
        });
    }
    catch (error) {
        if (!isPrismaError(error, 'P2002'))
            throw error;
    }
    const visitorTotals = await prisma.websiteDailyVisitorCount.aggregate({ _sum: { count: true } });
    const visitorCount = visitorTotals._sum.count ?? 0;
    res.json({ visitorCount });
});
app.get('/api/site-stats', async (_req, res) => {
    const [visitorTotals, shortCourses, longCourses, enrolledStudents, staff] = await Promise.all([
        prisma.websiteDailyVisitorCount.aggregate({ _sum: { count: true } }),
        prisma.course.count({ where: { courseType: 'Short Course' } }),
        prisma.course.count({ where: { courseType: { not: 'Short Course' } } }),
        prisma.courseInterest.findMany({
            where: {
                userId: { not: null },
                status: { notIn: ['application_declined', 'superseded'] },
                courseRecord: { isNot: null }
            },
            distinct: ['userId'],
            select: { userId: true }
        }),
        prisma.organizationMember.count({ where: { isPublished: true } })
    ]);
    const visitorCount = visitorTotals._sum.count ?? 0;
    const data = [
        { key: 'shortCourses', value: shortCourses, label: 'Short Courses' },
        { key: 'longCourses', value: longCourses, label: 'Long Courses' },
        { key: 'students', value: enrolledStudents.length, label: 'Students' },
        { key: 'staff', value: staff, label: 'Staff' },
        { key: 'visitors', value: visitorCount, label: 'Website visitors' }
    ];
    res.json({
        data
    });
});
app.post('/api/auth/register', (_req, res) => {
    const { name, email, phone, password } = _req.body;
    const normalizedPhone = normalizePhoneNumber(phone);
    if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 160 ||
        typeof email !== 'string' || email.trim().length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
        !isValidPhoneNumber(normalizedPhone) ||
        typeof password !== 'string' || password.length < 8 || Buffer.byteLength(password, 'utf8') > 72) {
        res.status(400).json({ message: 'Enter your name, a valid email address, a phone number with 7 to 15 digits, and a password between 8 and 72 bytes.' });
        return;
    }
    const nameParts = name.trim().split(/\s+/);
    void (async () => {
        try {
            const user = await prisma.user.create({
                data: {
                    email: email.trim().toLowerCase(),
                    firstName: nameParts[0],
                    lastName: nameParts.slice(1).join(' ') || nameParts[0],
                    phone: normalizedPhone,
                    passwordHash: await bcryptjs_1.default.hash(password, bcryptRounds)
                },
                include: userWithRoles
            });
            setSessionCookie(res, user);
            res.status(201).json({ user: sanitizeUser(user) });
        }
        catch (error) {
            if (isPrismaError(error, 'P2002')) {
                res.status(409).json({ message: 'An account with this email already exists.' });
                return;
            }
            console.error('Account registration failed:', error);
            res.status(500).json({ message: 'Unable to create your account right now.' });
        }
    })();
});
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    if (typeof email !== 'string' || email.trim().length > 254 ||
        typeof password !== 'string' || !password || Buffer.byteLength(password, 'utf8') > 72) {
        res.status(400).json({ message: 'Email and password are required.' });
        return;
    }
    const user = await prisma.user.findUnique({
        where: { email: email.trim().toLowerCase() },
        include: userWithRoles
    });
    if (!user || !(await bcryptjs_1.default.compare(password, user.passwordHash))) {
        res.status(401).json({ message: 'Invalid email or password.' });
        return;
    }
    if (!user.isActive) {
        if (user.paymentProofRejectionCount >= 3) {
            clearAuthCookies(res);
            res.status(403).json({ message: 'Your account has been blocked after three rejected payment screenshots. Contact the centre for assistance.' });
            return;
        }
        res.status(401).json({ message: 'Invalid email or password.' });
        return;
    }
    setSessionCookie(res, user);
    res.json({ user: sanitizeUser(user) });
});
app.get('/api/auth/session', optionalAuthMiddleware, (req, res) => {
    const user = req.user;
    res.json({
        user: user ? {
            id: String(user.id),
            name: user.name,
            email: user.email,
            role: user.role,
            permissions: user.permissions
        } : null
    });
});
app.post('/api/auth/logout', (_req, res) => {
    clearAuthCookies(res);
    res.json({ message: 'Signed out.' });
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
app.post('/api/bookings', (_req, res) => {
    res.status(410).json({ message: 'Course applications now start from a course page. Sign in or register to request a place and track your application.' });
});
app.get('/api/course-interests', authMiddleware, async (req, res) => {
    const interests = await prisma.courseInterest.findMany({
        where: { userId: req.user.id },
        orderBy: { createdAt: 'desc' },
        include: {
            courseRecord: { select: { name: true, slug: true, courseType: true } },
            user: { select: { firstName: true, lastName: true, email: true, phone: true, phoneVerifiedAt: true, paymentProofRejectionCount: true } }
        }
    });
    res.json({
        data: interests.map((interest) => ({
            id: String(interest.id),
            course: interest.courseRecord?.name ?? interest.course ?? '',
            courseSlug: interest.courseRecord?.slug ?? '',
            courseType: interest.courseRecord?.courseType ?? interest.courseType ?? 'Long Course',
            status: interest.status,
            controlNumber: interest.controlNumber,
            paymentProofAvailable: Boolean(interest.paymentProofPath),
            paymentProofUploadedAt: interest.paymentProofUploadedAt?.toISOString() ?? null,
            paymentProofRejectionCount: interest.user?.paymentProofRejectionCount ?? 0,
            formFeeTransactionReference: interest.formFeeTransactionReference ?? '',
            formFeeVerifiedAmount: interest.formFeeVerifiedAmount,
            proofReviewedAt: interest.proofReviewedAt?.toISOString() ?? null,
            proofFeedback: interest.proofFeedback ?? '',
            applicationSubmittedAt: interest.applicationSubmittedAt?.toISOString() ?? null,
            applicationFeedback: interest.applicationFeedback ?? '',
            fullName: interest.applicationSubmittedAt
                ? interest.fullName
                : interest.user
                    ? `${interest.user.firstName} ${interest.user.lastName}`.trim()
                    : interest.fullName ?? '',
            email: interest.user?.email ?? interest.email ?? '',
            phone: interest.user?.phone ?? interest.phone ?? '',
            phoneVerifiedAt: interest.user?.phoneVerifiedAt?.toISOString() ?? null,
            dateOfBirth: interest.dateOfBirth?.toISOString().slice(0, 10) ?? '',
            gender: interest.gender ?? '',
            nationality: interest.nationality ?? '',
            address: interest.address ?? '',
            educationLevel: interest.educationLevel ?? '',
            emergencyContactName: interest.emergencyContactName ?? '',
            emergencyContactPhone: interest.emergencyContactPhone ?? '',
            message: interest.message ?? '',
            confirmedStartDate: interest.confirmedStartDate?.toISOString() ?? null,
            createdAt: interest.createdAt.toISOString(),
            courseChoiceEditableUntil: new Date(interest.createdAt.getTime() + 72 * 60 * 60 * 1000).toISOString(),
            updatedAt: interest.updatedAt.toISOString()
        }))
    });
});
app.get('/api/notifications', authMiddleware, async (req, res) => {
    const where = { userId: req.user.id, readAt: null };
    const [unreadCount, notifications] = await Promise.all([
        prisma.learnerNotification.count({ where }),
        prisma.learnerNotification.findMany({
            where,
            orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
            take: 25,
            include: {
                courseInterest: {
                    select: {
                        course: true,
                        courseRecord: { select: { name: true } }
                    }
                }
            }
        })
    ]);
    res.json({
        unreadCount,
        data: notifications.map((notification) => ({
            id: String(notification.id),
            type: notification.type,
            course: notification.courseInterest.courseRecord?.name ?? notification.courseInterest.course ?? '',
            createdAt: notification.createdAt.toISOString()
        }))
    });
});
app.patch('/api/notifications/read', authMiddleware, async (req, res) => {
    const result = await prisma.learnerNotification.updateMany({
        where: { userId: req.user.id, readAt: null },
        data: { readAt: new Date() }
    });
    res.json({ message: 'Notifications marked as read.', updatedCount: result.count });
});
app.post(['/api/bookings/requests', '/api/course-interests'], (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 8,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) => {
        res.status(429).json({ message: 'Too many course booking requests. Please try again later.' });
    }
}), optionalAuthMiddleware, requireCourseRequestAccess, async (req, res) => {
    const { courseSlug, fullName, email, phone, message } = req.body;
    if (typeof courseSlug !== 'string' || !courseSlug.trim() || courseSlug.length > 200) {
        res.status(400).json({ message: 'Choose a valid course to request.' });
        return;
    }
    const campaignAttribution = parseCampaignAttribution(req.body?.campaign);
    if (!campaignAttribution.success) {
        res.status(400).json({ message: 'Campaign attribution is invalid.' });
        return;
    }
    const course = await prisma.course.findUnique({
        where: { slug: courseSlug.trim() },
        select: { id: true, name: true, courseType: true, publishedFrom: true, publishedUntil: true }
    });
    const now = new Date();
    if (!course || (course.publishedFrom && course.publishedFrom > now) ||
        (course.publishedUntil && course.publishedUntil < now)) {
        res.status(404).json({ message: 'The selected course could not be found.' });
        return;
    }
    const normalizedPhone = normalizePhoneNumber(phone);
    const isGuest = !req.user;
    if (isGuest) {
        const normalizedName = typeof fullName === 'string' ? fullName.trim() : '';
        const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
        const normalizedMessage = typeof message === 'string' ? message.trim() : '';
        if (normalizedName.length < 2 || normalizedName.length > 160 ||
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) || normalizedEmail.length > 254 ||
            !isValidPhoneNumber(normalizedPhone) || normalizedMessage.length > 2000) {
            res.status(400).json({ message: 'Enter your name, a valid email address, and a valid phone number.' });
            return;
        }
    }
    else {
        const learner = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: { phone: true }
        });
        if (!learner?.phone) {
            res.status(409).json({ message: 'Add a phone number to your account before requesting a course. Contact the centre if you need help updating an existing account.' });
            return;
        }
        const existingInterest = await prisma.courseInterest.findFirst({
            where: {
                userId: req.user.id,
                status: { notIn: ['application_declined', 'superseded'] }
            },
            select: { id: true }
        });
        if (existingInterest) {
            res.status(409).json({ message: 'You already have an active course request. Check it or change your choice from your learner dashboard.' });
            return;
        }
    }
    let lead;
    try {
        lead = await prisma.courseInterest.create({
            data: {
                ...(req.user ? { userId: req.user.id } : {}),
                courseId: course.id,
                ...(isGuest ? {
                    fullName: fullName.trim(),
                    email: email.trim().toLowerCase(),
                    phone: normalizedPhone,
                    message: message.trim()
                } : {}),
                course: course.name,
                courseType: course.courseType,
                ...(campaignAttribution.data ?? {}),
                centrePreference: 'VETA Kipawa ICT Centre'
            }
        });
    }
    catch (error) {
        if (isPrismaError(error, 'P2002')) {
            res.status(409).json({ message: 'You already have an active course request. Check it or change your choice from your learner dashboard.' });
            return;
        }
        throw error;
    }
    res.status(201).json({ message: isGuest
            ? 'Your interest has been sent to the centre. We will contact you with the next intake details.'
            : 'Your course request has been received. Track it from your learner dashboard.', booking: { id: String(lead.id), status: lead.status } });
});
app.patch('/api/course-interests/:id/course', authMiddleware, requireCourseRequestAccess, async (req, res) => {
    const id = Number(req.params.id);
    const { courseSlug } = req.body;
    if (!Number.isSafeInteger(id) || id <= 0 ||
        typeof courseSlug !== 'string' || !courseSlug.trim() || courseSlug.length > 200) {
        res.status(400).json({ message: 'Choose a valid course.' });
        return;
    }
    const interest = await prisma.courseInterest.findFirst({
        where: { id, userId: req.user.id }
    });
    if (!interest) {
        res.status(404).json({ message: 'Course request not found.' });
        return;
    }
    const editableUntil = new Date(interest.createdAt.getTime() + 72 * 60 * 60 * 1000);
    const editableStatus = ['new', 'contacted'].includes(interest.status);
    if (!editableStatus || interest.controlNumber || interest.paymentProofPath ||
        interest.formFeePaidAt || Date.now() >= editableUntil.getTime()) {
        res.status(409).json({ message: 'Your course choice is locked because payment processing has started, a control number has been issued, or three days have passed.' });
        return;
    }
    const course = await prisma.course.findUnique({
        where: { slug: courseSlug.trim() },
        select: { id: true, name: true, courseType: true, publishedFrom: true, publishedUntil: true }
    });
    const now = new Date();
    if (!course || (course.publishedFrom && course.publishedFrom > now) ||
        (course.publishedUntil && course.publishedUntil < now)) {
        res.status(404).json({ message: 'The selected course could not be found.' });
        return;
    }
    if (course.id === interest.courseId || (!interest.courseId && course.name === interest.course)) {
        res.status(400).json({ message: 'Choose a different course to update your request.' });
        return;
    }
    const result = await prisma.courseInterest.updateMany({
        where: {
            id,
            userId: req.user.id,
            status: { in: ['new', 'contacted'] },
            controlNumber: null,
            paymentProofPath: null,
            formFeePaidAt: null,
            createdAt: { gt: new Date(Date.now() - 72 * 60 * 60 * 1000) }
        },
        data: {
            courseId: course.id
        }
    });
    if (result.count !== 1) {
        res.status(409).json({ message: 'Your course choice could not be changed. It may have been locked while you were editing; refresh your dashboard.' });
        return;
    }
    res.json({ message: 'Your course choice has been updated.', course: course.name, courseType: course.courseType });
});
app.post('/api/course-interests/:id/payment-proof', authMiddleware, requireCourseRequestAccess, (req, res, next) => {
    paymentProofUpload(req, res, (error) => {
        if (error)
            next(error);
        else
            next();
    });
}, async (req, res) => {
    const id = Number(req.params.id);
    const proof = req.file;
    if (!Number.isSafeInteger(id) || id <= 0 || !proof) {
        if (proof)
            await (0, promises_1.unlink)(proof.path);
        res.status(400).json({ message: 'Choose a payment screenshot to upload.' });
        return;
    }
    if (!await paymentProofMatchesMimeType(proof)) {
        await (0, promises_1.unlink)(proof.path);
        res.status(400).json({ message: 'The uploaded file content does not match a valid JPEG, PNG, or WebP payment screenshot.' });
        return;
    }
    const interest = await prisma.courseInterest.findFirst({
        where: { id, userId: req.user.id }
    });
    if (!interest || !['control_number_issued', 'payment_rejected'].includes(interest.status)) {
        await (0, promises_1.unlink)(proof.path);
        res.status(409).json({ message: 'A payment screenshot can only be uploaded after the centre issues a control number.' });
        return;
    }
    const result = await prisma.courseInterest.updateMany({
        where: { id, userId: req.user.id, status: interest.status },
        data: {
            status: 'payment_submitted',
            paymentProofPath: proof.filename,
            paymentProofUploadedAt: new Date(),
            proofReviewedAt: null,
            proofFeedback: null
        }
    });
    if (result.count !== 1) {
        await (0, promises_1.unlink)(proof.path);
        res.status(409).json({ message: 'This request changed while the screenshot was uploading. Refresh the dashboard and try again.' });
        return;
    }
    if (interest.paymentProofPath) {
        const previousProof = node_path_1.default.join(paymentProofUploadDirectory, node_path_1.default.basename(interest.paymentProofPath));
        await (0, promises_1.unlink)(previousProof).catch((error) => {
            if (typeof error !== 'object' || error === null || !('code' in error) || error.code !== 'ENOENT')
                throw error;
        });
    }
    res.status(201).json({ message: 'Your payment screenshot was submitted for verification.' });
});
app.post('/api/course-interests/:id/application', authMiddleware, requireCourseRequestAccess, async (req, res) => {
    const id = Number(req.params.id);
    const { fullName, dateOfBirth, gender, nationality, address, educationLevel, emergencyContactName, emergencyContactPhone } = req.body;
    const validGender = gender === undefined || gender === '' ||
        ['Female', 'Male', 'Other', 'Prefer not to say'].includes(gender);
    if (!Number.isSafeInteger(id) || id <= 0 ||
        typeof fullName !== 'string' || fullName.trim().length < 2 || fullName.trim().length > 160 ||
        typeof dateOfBirth !== 'string' || !isValidCourseStartDate(dateOfBirth) || dateOfBirth > new Date().toISOString().slice(0, 10) ||
        !validGender ||
        (nationality !== undefined && (typeof nationality !== 'string' || nationality.length > 100)) ||
        typeof address !== 'string' || address.trim().length < 2 || address.trim().length > 500 ||
        typeof educationLevel !== 'string' || !educationLevel.trim() || educationLevel.length > 120 ||
        (emergencyContactName !== undefined && (typeof emergencyContactName !== 'string' || emergencyContactName.length > 160)) ||
        (emergencyContactPhone !== undefined && (typeof emergencyContactPhone !== 'string' || emergencyContactPhone.length > 40))) {
        res.status(400).json({ message: 'Enter your name, date of birth, location, and education level using valid details.' });
        return;
    }
    const interest = await prisma.courseInterest.findFirst({
        where: { id, userId: req.user.id }
    });
    if (!interest || !['form_fee_verified', 'application_needs_changes'].includes(interest.status)) {
        res.status(409).json({ message: 'The full application form is available after staff verify your form fee.' });
        return;
    }
    const result = await prisma.courseInterest.updateMany({
        where: { id, userId: req.user.id, status: interest.status },
        data: {
            fullName: fullName.trim(),
            dateOfBirth: new Date(`${dateOfBirth}T00:00:00.000Z`),
            gender: typeof gender === 'string' ? gender.trim() || null : null,
            nationality: typeof nationality === 'string' ? nationality.trim() || null : null,
            address: address.trim(),
            educationLevel: educationLevel.trim(),
            emergencyContactName: typeof emergencyContactName === 'string' ? emergencyContactName.trim() || null : null,
            emergencyContactPhone: typeof emergencyContactPhone === 'string' ? emergencyContactPhone.trim() || null : null,
            status: 'application_submitted',
            applicationSubmittedAt: new Date(),
            applicationFeedback: null
        }
    });
    if (result.count !== 1) {
        res.status(409).json({ message: 'This application changed while you were submitting it. Refresh the dashboard and try again.' });
        return;
    }
    res.status(201).json({ message: 'Your course application has been sent to the centre for review.' });
});
app.get('/api/course-interests/:id/payment-proof', authMiddleware, async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id <= 0) {
        res.status(400).json({ message: 'Invalid course request.' });
        return;
    }
    const interest = await prisma.courseInterest.findUnique({
        where: { id },
        select: { userId: true, paymentProofPath: true }
    });
    if (!interest) {
        res.status(404).json({ message: 'Payment screenshot not found.' });
        return;
    }
    const canViewAllProofs = req.user.role === 'admin' ||
        req.user.permissions.includes('shortCourseEnquiries') ||
        req.user.permissions.includes('bookings');
    if (interest.userId !== req.user.id && !canViewAllProofs) {
        res.status(403).json({ message: 'You do not have permission to view this payment screenshot.' });
        return;
    }
    const filename = interest.paymentProofPath && node_path_1.default.basename(interest.paymentProofPath);
    if (!filename || !/^[\w-]+\.(jpg|png|webp)$/i.test(filename)) {
        res.status(404).json({ message: 'Payment screenshot is not available.' });
        return;
    }
    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.sendFile(node_path_1.default.join(paymentProofUploadDirectory, filename), (error) => {
        if (error && !res.headersSent)
            res.status(error.statusCode === 404 ? 404 : 500).json({ message: error.statusCode === 404 ? 'Payment screenshot is not available.' : 'Unable to load payment screenshot.' });
    });
});
app.post('/api/contact', (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) => {
        res.status(429).json({ message: 'Too many contact messages. Please try again later.' });
    }
}), async (req, res) => {
    const { name, email, category, message } = req.body;
    if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 160 ||
        typeof email !== 'string' || email.trim().length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
        typeof category !== 'string' || !category.trim() || category.trim().length > 80 ||
        typeof message !== 'string' || !message.trim() || message.trim().length > 5000) {
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
    const canViewAllBookings = authUser.role === 'admin' || authUser.permissions.includes('bookings');
    const bookings = await prisma.booking.findMany({
        where: canViewAllBookings ? undefined : { userId: authUser.id },
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
            status: booking.status,
            confirmedStartDate: booking.confirmedStartDate?.toISOString() ?? null,
            adminFeedback: booking.adminFeedback
        }))
    });
});
app.use('/api/admin', authMiddleware, requireAdmin);
app.get('/api/admin/overview', async (req, res) => {
    const canViewUsers = req.user.role === 'admin' || req.user.permissions.includes('users');
    const bookingAccess = getAdminBookingDataAccess(req.user.role, req.user.permissions);
    const canViewBookings = bookingAccess.legacyBookings;
    const canViewCourseBookings = bookingAccess.courseBookings;
    const [bookingCount, userCount, pendingCount, courseInterestCount, bookings] = await Promise.all([
        canViewBookings ? prisma.booking.count() : Promise.resolve(0),
        canViewUsers ? prisma.user.count() : Promise.resolve(0),
        canViewBookings ? prisma.booking.count({ where: { status: 'Pending' } }) : Promise.resolve(0),
        canViewCourseBookings ? prisma.courseInterest.count() : Promise.resolve(0),
        canViewBookings ? prisma.booking.findMany({ orderBy: { createdAt: 'desc' }, take: 5 }) : Promise.resolve([])
    ]);
    res.json({
        overview: [
            { label: 'Admissions', value: String(userCount), note: 'Registered applicants' },
            { label: 'Course bookings', value: String(bookingCount + courseInterestCount), note: 'Booking and registration requests' },
            { label: 'Staff review', value: String(pendingCount), note: 'Pending bookings' }
        ],
        bookings: bookings.map((booking) => ({
            id: String(booking.id),
            user_name: booking.userName,
            email: booking.email ?? '',
            course: booking.course,
            centre: booking.centre,
            start_date: booking.date.toISOString().slice(0, 10),
            status: booking.status,
            confirmedStartDate: booking.confirmedStartDate?.toISOString() ?? null,
            adminFeedback: booking.adminFeedback
        }))
    });
});
app.get('/api/admin/data', async (req, res) => {
    const canManage = (permission) => req.user.role === 'admin' || req.user.permissions.includes(permission);
    const bookingAccess = getAdminBookingDataAccess(req.user.role, req.user.permissions);
    const [users, roles, courses, databaseCourseCategories, publicationCourses, centres, articles, publications, bookings, courseBookings, settings, organizationMembers, partners] = await Promise.all([
        canManage('users') ? prisma.user.findMany({
            include: userWithRoles,
            orderBy: { createdAt: 'desc' }
        }) : Promise.resolve([]),
        canManage('users') ? prisma.role.findMany({ orderBy: { name: 'asc' } }) : Promise.resolve([]),
        canManage('courses') ? prisma.course.findMany({
            include: {
                centres: { include: { centre: true } },
                media: { orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }] },
                categoryRecord: { select: { code: true } }
            },
            orderBy: { createdAt: 'desc' }
        }) : Promise.resolve([]),
        canManage('courses') ? prisma.courseCategory.findMany({ orderBy: [{ sortOrder: 'asc' }, { code: 'asc' }] }) : Promise.resolve([]),
        canManage('publications') ? prisma.course.findMany({
            select: { id: true, name: true, nameSw: true },
            orderBy: { name: 'asc' }
        }) : Promise.resolve([]),
        canManage('courses') ? prisma.trainingCentre.findMany({
            include: { district: { include: { region: true } } },
            orderBy: { name: 'asc' }
        }) : Promise.resolve([]),
        canManage('news') ? prisma.newsArticle.findMany({ orderBy: { createdAt: 'desc' } }) : Promise.resolve([]),
        canManage('publications') ? prisma.publication.findMany({ orderBy: { createdAt: 'desc' } }) : Promise.resolve([]),
        bookingAccess.legacyBookings ? prisma.booking.findMany({ orderBy: { createdAt: 'desc' } }) : Promise.resolve([]),
        bookingAccess.courseBookings ? prisma.courseInterest.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                user: { select: { firstName: true, lastName: true, email: true, phone: true, phoneVerifiedAt: true, paymentProofRejectionCount: true } },
                courseRecord: { select: { name: true, courseType: true } }
            }
        }) : Promise.resolve([]),
        canManage('siteSettings') ? prisma.siteSetting.findMany({
            where: { key: { not: 'home.advertisement' } },
            orderBy: { key: 'asc' }
        }) : Promise.resolve([]),
        canManage('organizationStructure') ? prisma.organizationMember.findMany({
            orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }, { id: 'asc' }]
        }) : Promise.resolve([]),
        canManage('partners') ? prisma.partner.findMany({
            orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }, { id: 'asc' }]
        }) : Promise.resolve([])
    ]);
    res.json({
        roles: roles.filter((role) => canAssignRole(req.user, role)).map((role) => ({
            id: String(role.id),
            name: role.name,
            description: role.description ?? '',
            permissions: isAdminRole(role)
                ? adminPermissions
                : role.permissions.filter((permission) => adminPermissions.includes(permission))
        })),
        users: users.map((user) => ({
            ...sanitizeUser(user),
            firstName: user.firstName,
            lastName: user.lastName,
            phone: user.phone,
            phoneVerifiedAt: user.phoneVerifiedAt?.toISOString() ?? null,
            isActive: user.isActive,
            createdAt: user.createdAt.toISOString()
        })),
        courses: courses.map((course) => ({
            id: String(course.id),
            name: course.name,
            nameSw: course.nameSw,
            slug: course.slug,
            description: course.description ?? '',
            descriptionSw: course.descriptionSw ?? '',
            level: course.level,
            levelSw: course.levelSw ?? '',
            duration: course.duration,
            durationSw: course.durationSw ?? '',
            courseType: course.courseType,
            category: course.categoryRecord.code,
            startDate: course.startDate?.toISOString() ?? null,
            endDate: course.endDate?.toISOString() ?? null,
            publishedFrom: course.publishedFrom?.toISOString() ?? null,
            publishedUntil: course.publishedUntil?.toISOString() ?? null,
            fee: course.fee,
            imageUrl: course.imageUrl,
            media: course.media.map((item) => ({
                id: String(item.id),
                type: item.type,
                url: item.url
            })),
            centres: course.centres.map(({ centre }) => centre.name),
            centresSw: course.centres.map(({ centre }) => centre.nameSw ?? '')
        })),
        courseCategories: databaseCourseCategories.map((category) => category.code),
        publicationCourses: publicationCourses.map((course) => ({
            id: String(course.id),
            name: course.name,
            nameSw: course.nameSw ?? ''
        })),
        centres: centres.map((centre) => ({
            id: String(centre.id),
            name: centre.name,
            nameSw: centre.nameSw ?? '',
            slug: centre.slug,
            type: centre.type,
            typeSw: centre.typeSw ?? '',
            focus: centre.focus,
            focusSw: centre.focusSw ?? '',
            district: centre.district.name,
            districtSw: centre.district.nameSw ?? '',
            region: centre.district.region.name,
            regionSw: centre.district.region.nameSw ?? ''
        })),
        news: articles.map((article) => ({
            id: String(article.id),
            title: article.title,
            titleSw: article.titleSw ?? '',
            slug: article.slug,
            category: article.category,
            categorySw: article.categorySw ?? '',
            summary: article.summary ?? '',
            summarySw: article.summarySw ?? '',
            body: article.body,
            bodySw: article.bodySw ?? '',
            imageUrl: article.imageUrl,
            videoUrl: article.videoUrl,
            youtubeUrl: article.youtubeUrl,
            published: article.published
        })),
        publications: publications.map((publication) => ({
            id: String(publication.id),
            title: publication.title,
            titleSw: publication.titleSw ?? '',
            fileUrl: publication.fileUrl,
            courseId: publication.courseId === null ? null : String(publication.courseId)
        })),
        bookings: bookings.map((booking) => ({
            id: String(booking.id),
            userId: booking.userId === null ? null : String(booking.userId),
            userName: booking.userName,
            email: booking.email,
            phone: booking.phone,
            dateOfBirth: booking.dateOfBirth?.toISOString() ?? null,
            gender: booking.gender,
            nationality: booking.nationality,
            address: booking.address,
            educationLevel: booking.educationLevel,
            course: booking.course,
            centre: booking.centre,
            date: booking.date.toISOString(),
            note: booking.note,
            status: booking.status,
            confirmedStartDate: booking.confirmedStartDate?.toISOString() ?? null,
            adminFeedback: booking.adminFeedback
        })),
        courseBookings: courseBookings.map((interest) => ({
            id: String(interest.id),
            userId: interest.userId === null ? null : String(interest.userId),
            fullName: interest.applicationSubmittedAt
                ? interest.fullName
                : interest.user
                    ? `${interest.user.firstName} ${interest.user.lastName}`.trim()
                    : interest.fullName ?? '',
            email: interest.user?.email ?? interest.email ?? '',
            phone: interest.user?.phone ?? interest.phone ?? '',
            phoneVerifiedAt: interest.user?.phoneVerifiedAt?.toISOString() ?? null,
            dateOfBirth: interest.dateOfBirth?.toISOString() ?? '',
            gender: interest.gender ?? '',
            nationality: interest.nationality ?? '',
            address: interest.address ?? '',
            educationLevel: interest.educationLevel ?? '',
            emergencyContactName: interest.emergencyContactName ?? '',
            emergencyContactPhone: interest.emergencyContactPhone ?? '',
            course: interest.courseRecord?.name ?? interest.course ?? '',
            courseType: interest.courseRecord?.courseType ?? interest.courseType ?? 'Long Course',
            campaignSource: interest.campaignSource ?? '',
            campaignMedium: interest.campaignMedium ?? '',
            campaignName: interest.campaignName ?? '',
            centrePreference: interest.centrePreference ?? '',
            message: interest.message ?? '',
            status: interest.status,
            controlNumber: interest.controlNumber ?? '',
            paymentProofAvailable: Boolean(interest.paymentProofPath),
            paymentProofUploadedAt: interest.paymentProofUploadedAt?.toISOString() ?? null,
            paymentProofRejectionCount: interest.user?.paymentProofRejectionCount ?? 0,
            formFeeTransactionReference: interest.formFeeTransactionReference ?? '',
            formFeeVerifiedAmount: interest.formFeeVerifiedAmount,
            proofFeedback: interest.proofFeedback ?? '',
            applicationSubmittedAt: interest.applicationSubmittedAt?.toISOString() ?? null,
            applicationFeedback: interest.applicationFeedback ?? '',
            contactedAt: interest.contactedAt?.toISOString() ?? null,
            formFeePaidAt: interest.formFeePaidAt?.toISOString() ?? null,
            courseFeePaidAt: interest.courseFeePaidAt?.toISOString() ?? null,
            confirmedStartDate: interest.confirmedStartDate?.toISOString() ?? null,
            createdAt: interest.createdAt.toISOString()
        })),
        settings: Object.fromEntries(settings.map(({ key, value }) => [key, value])),
        settingsSw: Object.fromEntries(settings.map(({ key, valueSw }) => [key, valueSw ?? ''])),
        organizationMembers: organizationMembers.map((member) => ({
            id: String(member.id),
            name: member.name,
            nameSw: member.nameSw ?? '',
            position: member.position,
            positionSw: member.positionSw ?? '',
            biography: member.biography,
            biographySw: member.biographySw ?? '',
            qualifications: member.qualifications ?? '',
            qualificationsSw: member.qualificationsSw ?? '',
            responsibilities: member.responsibilities ?? '',
            responsibilitiesSw: member.responsibilitiesSw ?? '',
            imageUrl: member.imageUrl,
            managerId: member.managerId === null ? '' : String(member.managerId),
            sortOrder: member.sortOrder,
            isPublished: member.isPublished
        })),
        partners: partners.map((partner) => ({
            id: String(partner.id),
            name: partner.name,
            nameSw: partner.nameSw ?? '',
            description: partner.description,
            descriptionSw: partner.descriptionSw ?? '',
            logoUrl: partner.logoUrl,
            websiteUrl: partner.websiteUrl ?? '',
            sortOrder: partner.sortOrder,
            isPublished: partner.isPublished
        }))
    });
});
const isValidRolePermissions = (permissions) => Array.isArray(permissions) &&
    permissions.every((permission) => typeof permission === 'string' && adminPermissions.includes(permission)) &&
    new Set(permissions).size === permissions.length;
app.post('/api/admin/roles', async (req, res) => {
    const { name, description, permissions } = req.body;
    const normalizedName = typeof name === 'string' ? name.trim() : '';
    if (normalizedName.length < 2 || normalizedName.length > 60 ||
        ['admin', 'user', 'applicant'].includes(normalizedName.toLowerCase()) ||
        (description !== undefined && (typeof description !== 'string' || description.length > 300)) ||
        !isValidRolePermissions(permissions)) {
        res.status(400).json({ message: 'Enter a unique role name, a description of up to 300 characters, and valid permissions.' });
        return;
    }
    const duplicate = await prisma.role.findFirst({ where: { name: { equals: normalizedName, mode: 'insensitive' } } });
    if (duplicate) {
        res.status(409).json({ message: 'A role with this name already exists.' });
        return;
    }
    try {
        const role = await prisma.role.create({
            data: {
                name: normalizedName,
                description: typeof description === 'string' ? description.trim() || null : null,
                permissions
            }
        });
        res.status(201).json({ role: { id: String(role.id), name: role.name, description: role.description ?? '', permissions: role.permissions } });
    }
    catch (error) {
        if (isPrismaError(error, 'P2002')) {
            res.status(409).json({ message: 'A role with this name already exists.' });
            return;
        }
        throw error;
    }
});
app.patch('/api/admin/roles/:id', async (req, res) => {
    const id = Number(req.params.id);
    const { name, description, permissions } = req.body;
    const normalizedName = typeof name === 'string' ? name.trim() : undefined;
    if (!Number.isSafeInteger(id) || id <= 0 ||
        (normalizedName !== undefined && (normalizedName.length < 2 || normalizedName.length > 60 || ['admin', 'user', 'applicant'].includes(normalizedName.toLowerCase()))) ||
        (description !== undefined && (typeof description !== 'string' || description.length > 300)) ||
        (permissions !== undefined && !isValidRolePermissions(permissions)) ||
        (normalizedName === undefined && description === undefined && permissions === undefined)) {
        res.status(400).json({ message: 'Provide valid role details to update.' });
        return;
    }
    const existing = await prisma.role.findUnique({ where: { id } });
    if (!existing) {
        res.status(404).json({ message: 'Role not found.' });
        return;
    }
    if (isAdminRole(existing) || existing.name.toLowerCase() === 'applicant') {
        res.status(400).json({ message: 'The Admin and applicant roles are reserved and cannot be changed.' });
        return;
    }
    if (normalizedName !== undefined) {
        const duplicate = await prisma.role.findFirst({
            where: { name: { equals: normalizedName, mode: 'insensitive' }, id: { not: id } }
        });
        if (duplicate) {
            res.status(409).json({ message: 'A role with this name already exists.' });
            return;
        }
    }
    try {
        const role = await prisma.role.update({
            where: { id },
            data: {
                ...(normalizedName !== undefined ? { name: normalizedName } : {}),
                ...(typeof description === 'string' ? { description: description.trim() || null } : {}),
                ...(permissions !== undefined ? { permissions } : {})
            }
        });
        res.json({ role: { id: String(role.id), name: role.name, description: role.description ?? '', permissions: role.permissions } });
    }
    catch (error) {
        if (isPrismaError(error, 'P2002')) {
            res.status(409).json({ message: 'A role with this name already exists.' });
            return;
        }
        throw error;
    }
});
app.delete('/api/admin/roles/:id', async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id <= 0) {
        res.status(400).json({ message: 'Invalid role ID.' });
        return;
    }
    const role = await prisma.role.findUnique({ where: { id } });
    if (!role) {
        res.status(404).json({ message: 'Role not found.' });
        return;
    }
    if (isAdminRole(role) || role.name.toLowerCase() === 'applicant') {
        res.status(400).json({ message: 'The Admin and applicant roles cannot be deleted.' });
        return;
    }
    const assignedUsers = await prisma.userRole.count({ where: { roleId: id } });
    if (assignedUsers > 0) {
        res.status(409).json({ message: 'Reassign users before deleting this role.' });
        return;
    }
    await prisma.role.delete({ where: { id } });
    res.json({ message: 'Role deleted.' });
});
app.post('/api/admin/users', async (req, res) => {
    const { name, email, password, role, roleId, phone } = req.body;
    const normalizedPhone = normalizePhoneNumber(phone);
    if (typeof name !== 'string' || !name.trim() ||
        typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
        typeof password !== 'string' || password.length < 8 ||
        !isValidPhoneNumber(normalizedPhone) ||
        (roleId === undefined && role !== 'user' && role !== 'admin') ||
        (roleId !== undefined && !(Number.isSafeInteger(Number(roleId)) && Number(roleId) > 0)) ||
        (phone !== undefined && typeof phone !== 'string')) {
        res.status(400).json({ message: 'Enter a name, valid email, phone number with 7 to 15 digits, password of at least 8 characters, and valid role.' });
        return;
    }
    const assignedRole = roleId !== undefined
        ? await prisma.role.findUnique({ where: { id: Number(roleId) } })
        : await prisma.role.findUnique({ where: { name: role === 'admin' ? 'admin' : 'applicant' } });
    if (!assignedRole) {
        res.status(400).json({ message: 'Select an existing role for this account.' });
        return;
    }
    if (!canAssignRole(req.user, assignedRole)) {
        res.status(403).json({ message: 'You cannot assign a role with permissions you do not have.' });
        return;
    }
    const nameParts = name.trim().split(/\s+/);
    try {
        const user = await prisma.user.create({
            data: {
                email: email.trim().toLowerCase(),
                firstName: nameParts[0],
                lastName: nameParts.slice(1).join(' ') || nameParts[0],
                phone: normalizedPhone,
                passwordHash: await bcryptjs_1.default.hash(password, bcryptRounds),
                roles: { create: { role: { connect: { id: assignedRole.id } } } }
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
    const { name, email, role, roleId, isActive, phone } = req.body;
    const normalizedPhone = phone === undefined ? undefined : normalizePhoneNumber(phone);
    if (!Number.isSafeInteger(id) || id <= 0 ||
        (name !== undefined && (typeof name !== 'string' || !name.trim())) ||
        (email !== undefined && (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))) ||
        (role !== undefined && role !== 'user' && role !== 'admin') ||
        (roleId !== undefined && !(Number.isSafeInteger(Number(roleId)) && Number(roleId) > 0)) ||
        (isActive !== undefined && typeof isActive !== 'boolean') ||
        (phone !== undefined && (typeof phone !== 'string' ||
            (phone.trim() !== '' && !isValidPhoneNumber(normalizedPhone)))) ||
        (name === undefined && email === undefined && role === undefined && roleId === undefined && isActive === undefined && phone === undefined)) {
        res.status(400).json({ message: 'Provide valid account details to update.' });
        return;
    }
    const actor = req.user;
    const current = await prisma.user.findUnique({ where: { id }, include: userWithRoles });
    if (!current) {
        res.status(404).json({ message: 'User not found.' });
        return;
    }
    if (getRole(current) === 'admin' && actor.role !== 'admin') {
        res.status(403).json({ message: 'Only a full-access administrator can manage an administrator account.' });
        return;
    }
    const requestedRole = roleId !== undefined
        ? await prisma.role.findUnique({ where: { id: Number(roleId) } })
        : role !== undefined
            ? await prisma.role.findUnique({ where: { name: role === 'admin' ? 'admin' : 'applicant' } })
            : null;
    if ((roleId !== undefined || role !== undefined) && !requestedRole) {
        res.status(400).json({ message: 'Select an existing role for this account.' });
        return;
    }
    if (requestedRole && !canAssignRole(actor, requestedRole)) {
        res.status(403).json({ message: 'You cannot assign a role with permissions you do not have.' });
        return;
    }
    const isCurrentAdmin = getRole(current) === 'admin';
    const isChangingRole = Boolean(requestedRole && requestedRole.id !== getAssignedRole(current)?.id);
    const willRemainAdmin = requestedRole ? isAdminRole(requestedRole) : isCurrentAdmin;
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
                    ...(typeof phone === 'string' ? {
                        phone: normalizedPhone || null,
                        ...(normalizedPhone !== current.phone ? { phoneVerifiedAt: null } : {})
                    } : {}),
                    ...(typeof isActive === 'boolean' ? { isActive } : {})
                }
            });
            if (isChangingRole) {
                await transaction.userRole.deleteMany({ where: { userId: id } });
                await transaction.userRole.create({
                    data: {
                        user: { connect: { id } },
                        role: { connect: { id: requestedRole.id } }
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
    if (getRole(user) === 'admin' && actor.role !== 'admin') {
        res.status(403).json({ message: 'Only a full-access administrator can remove an administrator account.' });
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
app.post('/api/admin/courses', uploadCourseImage, async (req, res) => {
    const { name, nameSw, level, levelSw, duration, durationSw, description, descriptionSw, courseType, category, startDate, endDate, publishedFrom, publishedUntil, fee, imageUrl } = req.body;
    const courseImage = getUploadedCourseImage(req);
    const courseMediaFiles = getUploadedCourseMedia(req);
    const centreNames = parseCourseCentres(req.body.centres);
    const normalizedStartDate = startDate === undefined ? undefined : startDate === '' || startDate === null ? null : startDate;
    const normalizedEndDate = endDate === undefined ? undefined : endDate === '' || endDate === null ? null : endDate;
    const normalizedPublishedFrom = publishedFrom === undefined || publishedFrom === '' || publishedFrom === null ? null : publishedFrom;
    const normalizedPublishedUntil = publishedUntil === undefined || publishedUntil === '' || publishedUntil === null ? null : publishedUntil;
    const normalizedFee = fee === undefined ? undefined : fee === '' || fee === null ? null : typeof fee === 'string' ? Number(fee) : fee;
    const normalizedImageUrl = courseImage ? `/uploads/courses/${courseImage.filename}` : imageUrl === '' ? null : imageUrl;
    const validStartDate = normalizedStartDate === undefined || normalizedStartDate === null || isValidCourseStartDate(normalizedStartDate);
    const validEndDate = normalizedEndDate === undefined || normalizedEndDate === null || isValidCourseStartDate(normalizedEndDate);
    const validPublicationWindow = (normalizedPublishedFrom === null || isValidCourseStartDate(normalizedPublishedFrom)) &&
        (normalizedPublishedUntil === null || isValidCourseStartDate(normalizedPublishedUntil)) &&
        (normalizedPublishedFrom === null || normalizedPublishedUntil === null || normalizedPublishedUntil >= normalizedPublishedFrom);
    const validImageUrl = courseImage || normalizedImageUrl === undefined || normalizedImageUrl === null || isValidCourseImageUrl(normalizedImageUrl);
    if (typeof name !== 'string' || !name.trim() ||
        typeof level !== 'string' || !level.trim() ||
        typeof duration !== 'string' || !duration.trim() ||
        (description !== undefined && typeof description !== 'string') ||
        [nameSw, levelSw, durationSw, descriptionSw].some((value) => value !== undefined && typeof value !== 'string') ||
        (courseType !== undefined && courseType !== 'Long Course' && courseType !== 'Short Course') ||
        (category !== undefined && (typeof category !== 'string' || !category.trim())) ||
        !validStartDate ||
        !validEndDate ||
        (typeof normalizedStartDate === 'string' && typeof normalizedEndDate === 'string' && normalizedEndDate.slice(0, 10) < normalizedStartDate.slice(0, 10)) ||
        !validPublicationWindow ||
        (courseType === 'Short Course' && (!normalizedPublishedFrom || !normalizedPublishedUntil || !normalizedStartDate)) ||
        (normalizedFee !== undefined && normalizedFee !== null && (!Number.isSafeInteger(normalizedFee) || Number(normalizedFee) < 0)) ||
        !validImageUrl ||
        centreNames === null) {
        await removeUploadedCourseImage(req);
        res.status(400).json({ message: 'Enter valid course details. Short courses need training start dates and public listing dates; optional end dates cannot be before the start date.' });
        return;
    }
    const slug = slugify(name);
    if (!slug) {
        await removeUploadedCourseImage(req);
        res.status(400).json({ message: 'Course name must contain letters or numbers.' });
        return;
    }
    try {
        const course = await prisma.course.create({
            data: {
                name: name.trim(),
                nameSw: typeof nameSw === 'string' ? nameSw.trim() || null : null,
                slug,
                level: level.trim(),
                levelSw: typeof levelSw === 'string' ? levelSw.trim() || null : null,
                duration: duration.trim(),
                durationSw: typeof durationSw === 'string' ? durationSw.trim() || null : null,
                description: typeof description === 'string' ? description.trim() : null,
                descriptionSw: typeof descriptionSw === 'string' ? descriptionSw.trim() || null : null,
                courseType: courseType === 'Short Course' ? 'Short Course' : 'Long Course',
                category: typeof category === 'string'
                    ? category
                    : getCourseCategoryForDisplay(courseType === 'Short Course' ? 'Short Course' : 'Long Course', undefined),
                startDate: typeof normalizedStartDate === 'string' ? courseStartDate(normalizedStartDate) : null,
                endDate: typeof normalizedEndDate === 'string' ? new Date(`${normalizedEndDate}T00:00:00.000Z`) : null,
                publishedFrom: normalizedPublishedFrom ? coursePublicationDate(normalizedPublishedFrom) : null,
                publishedUntil: normalizedPublishedUntil ? coursePublicationDate(normalizedPublishedUntil, true) : null,
                fee: normalizedFee ?? null,
                imageUrl: typeof normalizedImageUrl === 'string' && normalizedImageUrl.trim() ? normalizedImageUrl.trim() : null,
                media: courseMediaFiles.length ? {
                    create: courseMediaFiles.map((file, index) => ({
                        type: courseVideoExtensions[file.mimetype] ? 'video' : 'image',
                        url: `/uploads/courses/${file.filename}`,
                        sortOrder: index
                    }))
                } : undefined,
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
        await removeUploadedCourseImage(req);
        if (isPrismaError(error, 'P2002')) {
            res.status(409).json({ message: 'A course with this name already exists.' });
            return;
        }
        if (isPrismaError(error, 'P2025')) {
            res.status(400).json({ message: 'One or more selected training centres were not found.' });
            return;
        }
        if (isPrismaError(error, 'P2003')) {
            res.status(400).json({ message: 'The selected course category does not exist.' });
            return;
        }
        throw error;
    }
});
app.patch('/api/admin/courses/:id', uploadCourseImage, async (req, res) => {
    const id = Number(req.params.id);
    const { name, nameSw, level, levelSw, duration, durationSw, description, descriptionSw, courseType, category, startDate, endDate, publishedFrom, publishedUntil, fee, imageUrl, centres } = req.body;
    const courseImage = getUploadedCourseImage(req);
    const courseMediaFiles = getUploadedCourseMedia(req);
    const centreNames = parseCourseCentres(centres);
    const normalizedStartDate = startDate === undefined ? undefined : startDate === '' || startDate === null ? null : startDate;
    const normalizedEndDate = endDate === undefined ? undefined : endDate === '' || endDate === null ? null : endDate;
    const normalizedPublishedFrom = publishedFrom === undefined ? undefined : publishedFrom === '' || publishedFrom === null ? null : publishedFrom;
    const normalizedPublishedUntil = publishedUntil === undefined ? undefined : publishedUntil === '' || publishedUntil === null ? null : publishedUntil;
    const normalizedFee = fee === undefined ? undefined : fee === '' || fee === null ? null : typeof fee === 'string' ? Number(fee) : fee;
    const clearCoverImage = req.body.removeCoverImage === true || req.body.removeCoverImage === 'true';
    const validClearCoverImage = req.body.removeCoverImage === undefined || req.body.removeCoverImage === true ||
        req.body.removeCoverImage === false || req.body.removeCoverImage === 'true' || req.body.removeCoverImage === 'false';
    const validStartDate = normalizedStartDate === undefined || normalizedStartDate === null || isValidCourseStartDate(normalizedStartDate);
    const validEndDate = normalizedEndDate === undefined || normalizedEndDate === null || isValidCourseStartDate(normalizedEndDate);
    const validPublishedFrom = normalizedPublishedFrom === undefined || normalizedPublishedFrom === null || isValidCourseStartDate(normalizedPublishedFrom);
    const validPublishedUntil = normalizedPublishedUntil === undefined || normalizedPublishedUntil === null || isValidCourseStartDate(normalizedPublishedUntil);
    const validImageUrl = courseImage || imageUrl === undefined || imageUrl === null || imageUrl === '' || isValidCourseImageUrl(imageUrl);
    if (!Number.isSafeInteger(id) || id <= 0 ||
        (name !== undefined && (typeof name !== 'string' || !name.trim())) ||
        (level !== undefined && (typeof level !== 'string' || !level.trim())) ||
        (duration !== undefined && (typeof duration !== 'string' || !duration.trim())) ||
        (description !== undefined && typeof description !== 'string') ||
        [nameSw, levelSw, durationSw, descriptionSw].some((value) => value !== undefined && typeof value !== 'string') ||
        (courseType !== undefined && courseType !== 'Long Course' && courseType !== 'Short Course') ||
        (category !== undefined && (typeof category !== 'string' || !category.trim())) ||
        !validStartDate ||
        !validEndDate ||
        (typeof normalizedStartDate === 'string' && typeof normalizedEndDate === 'string' && normalizedEndDate.slice(0, 10) < normalizedStartDate.slice(0, 10)) ||
        !validPublishedFrom || !validPublishedUntil ||
        (typeof normalizedPublishedFrom === 'string' && typeof normalizedPublishedUntil === 'string' && normalizedPublishedUntil < normalizedPublishedFrom) ||
        (normalizedFee !== undefined && normalizedFee !== null && (!Number.isSafeInteger(normalizedFee) || Number(normalizedFee) < 0)) ||
        !validImageUrl ||
        centreNames === null ||
        !validClearCoverImage ||
        (name === undefined && nameSw === undefined && level === undefined && levelSw === undefined && duration === undefined &&
            durationSw === undefined && description === undefined && descriptionSw === undefined && courseType === undefined &&
            startDate === undefined && fee === undefined && imageUrl === undefined && centreNames === undefined &&
            endDate === undefined && category === undefined &&
            publishedFrom === undefined && publishedUntil === undefined &&
            !courseImage && !courseMediaFiles.length && !clearCoverImage)) {
        await removeUploadedCourseImage(req);
        res.status(400).json({ message: 'Provide valid course details to update.' });
        return;
    }
    try {
        const existingCourse = await prisma.course.findUnique({ where: { id } });
        if (!existingCourse) {
            await removeUploadedCourseImage(req);
            res.status(404).json({ message: 'Course not found.' });
            return;
        }
        const effectivePublishedFrom = normalizedPublishedFrom === undefined
            ? existingCourse.publishedFrom?.toISOString().slice(0, 10) ?? null
            : normalizedPublishedFrom;
        const effectivePublishedUntil = normalizedPublishedUntil === undefined
            ? existingCourse.publishedUntil?.toISOString().slice(0, 10) ?? null
            : normalizedPublishedUntil;
        const effectiveCourseType = courseType ?? existingCourse.courseType;
        const effectiveStartDate = normalizedStartDate === undefined
            ? existingCourse.startDate ? courseDateKey(existingCourse.startDate) : null
            : normalizedStartDate?.slice(0, 10) ?? null;
        const effectiveEndDate = normalizedEndDate === undefined
            ? existingCourse.endDate ? courseDateKey(existingCourse.endDate) : null
            : normalizedEndDate?.slice(0, 10) ?? null;
        if ((effectiveCourseType === 'Short Course' && (!effectivePublishedFrom || !effectivePublishedUntil || !effectiveStartDate)) ||
            (effectiveStartDate && effectiveEndDate && effectiveEndDate < effectiveStartDate) ||
            (effectivePublishedFrom && effectivePublishedUntil && effectivePublishedUntil < effectivePublishedFrom)) {
            await removeUploadedCourseImage(req);
            res.status(400).json({ message: 'Short courses need a training start date and public listing dates; the optional end date cannot be before the start date.' });
            return;
        }
        const course = await prisma.$transaction(async (transaction) => {
            let centreLinks;
            const currentMediaCount = courseMediaFiles.length
                ? await transaction.courseMedia.count({ where: { courseId: id } })
                : 0;
            if (Array.isArray(centreNames)) {
                const selectedCentres = await transaction.trainingCentre.findMany({
                    where: { name: { in: centreNames } },
                    select: { id: true }
                });
                if (selectedCentres.length !== new Set(centreNames).size) {
                    throw new Error('One or more selected training centres were not found.');
                }
                centreLinks = selectedCentres.map(({ id: centreId }) => ({ centreId }));
            }
            return transaction.course.update({
                where: { id },
                data: {
                    ...(typeof name === 'string' ? { name: name.trim(), slug: slugify(name) } : {}),
                    ...(typeof nameSw === 'string' ? { nameSw: nameSw.trim() || null } : {}),
                    ...(typeof level === 'string' ? { level: level.trim() } : {}),
                    ...(typeof levelSw === 'string' ? { levelSw: levelSw.trim() || null } : {}),
                    ...(typeof duration === 'string' ? { duration: duration.trim() } : {}),
                    ...(typeof durationSw === 'string' ? { durationSw: durationSw.trim() || null } : {}),
                    ...(typeof description === 'string' ? { description: description.trim() } : {}),
                    ...(typeof descriptionSw === 'string' ? { descriptionSw: descriptionSw.trim() || null } : {}),
                    ...(courseType === 'Long Course' || courseType === 'Short Course' ? { courseType } : {}),
                    ...(typeof category === 'string'
                        ? { category }
                        : { category: getCourseCategoryForDisplay(effectiveCourseType, existingCourse.category) }),
                    ...(normalizedStartDate === null ? { startDate: null } : typeof normalizedStartDate === 'string' ? { startDate: courseStartDate(normalizedStartDate) } : {}),
                    ...(normalizedEndDate === null ? { endDate: null } : typeof normalizedEndDate === 'string' ? { endDate: new Date(`${normalizedEndDate}T00:00:00.000Z`) } : {}),
                    ...(normalizedPublishedFrom === null ? { publishedFrom: null } : typeof normalizedPublishedFrom === 'string' ? { publishedFrom: coursePublicationDate(normalizedPublishedFrom) } : {}),
                    ...(normalizedPublishedUntil === null ? { publishedUntil: null } : typeof normalizedPublishedUntil === 'string' ? { publishedUntil: coursePublicationDate(normalizedPublishedUntil, true) } : {}),
                    ...(normalizedFee === null ? { fee: null } : normalizedFee !== undefined ? { fee: normalizedFee } : {}),
                    ...(courseImage
                        ? { imageUrl: `/uploads/courses/${courseImage.filename}` }
                        : clearCoverImage
                            ? { imageUrl: null }
                            : typeof imageUrl === 'string' && imageUrl.trim()
                                ? { imageUrl: imageUrl.trim() }
                                : imageUrl === null
                                    ? { imageUrl: null }
                                    : {}),
                    ...(courseMediaFiles.length ? {
                        media: {
                            create: courseMediaFiles.map((file, index) => ({
                                type: courseVideoExtensions[file.mimetype] ? 'video' : 'image',
                                url: `/uploads/courses/${file.filename}`,
                                sortOrder: currentMediaCount + index
                            }))
                        }
                    } : {}),
                    ...(centreLinks !== undefined
                        ? { centres: { deleteMany: {}, create: centreLinks.map(({ centreId }) => ({ centreId })) } }
                        : {})
                }
            });
        });
        if (courseImage || clearCoverImage || (typeof imageUrl === 'string' && imageUrl.trim())) {
            try {
                await removeCourseImage(existingCourse.imageUrl);
            }
            catch (error) {
                console.error('Unable to remove replaced course image:', error);
            }
        }
        res.json({ id: String(course.id) });
    }
    catch (error) {
        await removeUploadedCourseImage(req);
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
        if (isPrismaError(error, 'P2003')) {
            res.status(400).json({ message: 'The selected course category does not exist.' });
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
    const course = await prisma.course.findUnique({ where: { id } });
    if (!course) {
        res.status(404).json({ message: 'Course not found.' });
        return;
    }
    const courseMedia = await prisma.courseMedia.findMany({ where: { courseId: id } });
    try {
        await prisma.course.delete({ where: { id } });
    }
    catch (error) {
        if (isPrismaError(error, 'P2025')) {
            res.status(404).json({ message: 'Course not found.' });
            return;
        }
        throw error;
    }
    try {
        await removeCourseImage(course.imageUrl);
    }
    catch (error) {
        console.error('Unable to remove deleted course image:', error);
    }
    await Promise.all(courseMedia.map(async (item) => {
        try {
            await removeCourseImage(item.url);
        }
        catch (error) {
            console.error('Unable to remove deleted course media file:', error);
        }
    }));
    if (!res.headersSent)
        res.json({ message: 'Course deleted.' });
});
app.delete('/api/admin/courses/:id/media/:mediaId', async (req, res) => {
    const courseId = Number(req.params.id);
    const mediaId = Number(req.params.mediaId);
    if (!Number.isSafeInteger(courseId) || courseId <= 0 || !Number.isSafeInteger(mediaId) || mediaId <= 0) {
        res.status(400).json({ message: 'Invalid course media ID.' });
        return;
    }
    const media = await prisma.courseMedia.findFirst({ where: { id: mediaId, courseId } });
    if (!media) {
        res.status(404).json({ message: 'Course media not found.' });
        return;
    }
    await prisma.courseMedia.delete({ where: { id: mediaId } });
    try {
        await removeCourseImage(media.url);
    }
    catch (error) {
        console.error('Unable to remove deleted course media file:', error);
    }
    res.json({ message: 'Course media deleted.' });
});
app.post('/api/admin/centres', async (req, res) => {
    const { name, nameSw, region, regionSw, district, districtSw, type, typeSw, focus, focusSw } = req.body;
    if (typeof name !== 'string' || !name.trim() ||
        typeof region !== 'string' || !region.trim() ||
        typeof district !== 'string' || !district.trim() ||
        typeof type !== 'string' || !type.trim() ||
        typeof focus !== 'string' || !focus.trim() ||
        [nameSw, regionSw, districtSw, typeSw, focusSw].some((value) => value !== undefined && typeof value !== 'string')) {
        res.status(400).json({ message: 'Enter a name, region, district, type, and focus for the centre.' });
        return;
    }
    try {
        const centre = await prisma.$transaction(async (transaction) => {
            const savedRegion = await transaction.region.upsert({
                where: { name: region.trim() },
                update: typeof regionSw === 'string' ? { nameSw: regionSw.trim() || null } : {},
                create: { name: region.trim(), nameSw: typeof regionSw === 'string' ? regionSw.trim() || null : null }
            });
            const savedDistrict = await transaction.district.findFirst({
                where: { name: district.trim(), regionId: savedRegion.id }
            }) ?? await transaction.district.create({
                data: { name: district.trim(), nameSw: typeof districtSw === 'string' ? districtSw.trim() || null : null, regionId: savedRegion.id }
            });
            if (savedDistrict && typeof districtSw === 'string') {
                await transaction.district.update({
                    where: { id: savedDistrict.id },
                    data: { nameSw: districtSw.trim() || null }
                });
            }
            return transaction.trainingCentre.create({
                data: {
                    name: name.trim(),
                    nameSw: typeof nameSw === 'string' ? nameSw.trim() || null : null,
                    slug: slugify(name),
                    type: type.trim(),
                    typeSw: typeof typeSw === 'string' ? typeSw.trim() || null : null,
                    focus: focus.trim(),
                    focusSw: typeof focusSw === 'string' ? focusSw.trim() || null : null,
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
    const { name, nameSw, region, regionSw, district, districtSw, type, typeSw, focus, focusSw } = req.body;
    if (!Number.isSafeInteger(id) || id <= 0 ||
        (name !== undefined && (typeof name !== 'string' || !name.trim())) ||
        (region !== undefined && (typeof region !== 'string' || !region.trim())) ||
        (district !== undefined && (typeof district !== 'string' || !district.trim())) ||
        (type !== undefined && (typeof type !== 'string' || !type.trim())) ||
        (focus !== undefined && (typeof focus !== 'string' || !focus.trim())) ||
        [nameSw, regionSw, districtSw, typeSw, focusSw].some((value) => value !== undefined && typeof value !== 'string') ||
        [name, nameSw, region, regionSw, district, districtSw, type, typeSw, focus, focusSw].every((value) => value === undefined)) {
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
            const nextRegionSw = typeof regionSw === 'string'
                ? regionSw.trim() || null
                : nextRegion === current.district.region.name ? current.district.region.nameSw : null;
            const nextDistrictSw = typeof districtSw === 'string'
                ? districtSw.trim() || null
                : nextDistrict === current.district.name ? current.district.nameSw : null;
            const nextDistrictId = region !== undefined || district !== undefined
                ? await transaction.region.upsert({
                    where: { name: nextRegion },
                    update: typeof regionSw === 'string' ? { nameSw: regionSw.trim() || null } : {},
                    create: { name: nextRegion, nameSw: nextRegionSw }
                }).then(async (savedRegion) => {
                    const savedDistrict = await transaction.district.findFirst({
                        where: { name: nextDistrict, regionId: savedRegion.id }
                    }) ?? await transaction.district.create({
                        data: { name: nextDistrict, nameSw: nextDistrictSw, regionId: savedRegion.id }
                    });
                    if (typeof districtSw === 'string') {
                        await transaction.district.update({
                            where: { id: savedDistrict.id },
                            data: { nameSw: districtSw.trim() || null }
                        });
                    }
                    return savedDistrict.id;
                })
                : undefined;
            if (regionSw !== undefined && region === undefined) {
                await transaction.region.update({
                    where: { id: current.district.region.id },
                    data: { nameSw: regionSw.trim() || null }
                });
            }
            if (districtSw !== undefined && district === undefined) {
                await transaction.district.update({
                    where: { id: current.district.id },
                    data: { nameSw: districtSw.trim() || null }
                });
            }
            return transaction.trainingCentre.update({
                where: { id },
                data: {
                    ...(typeof name === 'string' ? { name: name.trim(), slug: slugify(name) } : {}),
                    ...(typeof nameSw === 'string' ? { nameSw: nameSw.trim() || null } : {}),
                    ...(typeof type === 'string' ? { type: type.trim() } : {}),
                    ...(typeof typeSw === 'string' ? { typeSw: typeSw.trim() || null } : {}),
                    ...(typeof focus === 'string' ? { focus: focus.trim() } : {}),
                    ...(typeof focusSw === 'string' ? { focusSw: focusSw.trim() || null } : {}),
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
    const { title, titleSw, summary, summarySw, body, bodySw, published, youtubeUrl } = req.body;
    const image = getUploadedNewsFile(req, 'image');
    const video = getUploadedNewsFile(req, 'video');
    const youtubeEmbedUrl = getYouTubeEmbedUrl(youtubeUrl);
    const isPublished = published === undefined || published === true || published === 'true';
    const validPublished = published === undefined || published === true || published === false ||
        published === 'true' || published === 'false';
    if (typeof title !== 'string' || !title.trim() ||
        typeof body !== 'string' || !body.trim() ||
        (summary !== undefined && typeof summary !== 'string') ||
        [titleSw, summarySw, bodySw].some((value) => value !== undefined && typeof value !== 'string') ||
        youtubeEmbedUrl === null ||
        (video && youtubeEmbedUrl) ||
        !validPublished) {
        await removeUploadedNewsFiles(req);
        res.status(400).json({
            message: youtubeEmbedUrl === null
                ? 'Enter a valid YouTube video link.'
                : video && youtubeEmbedUrl
                    ? 'Choose either an uploaded video or a YouTube link.'
                    : 'Enter a title and article body.'
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
                titleSw: typeof titleSw === 'string' ? titleSw.trim() || null : null,
                slug,
                summary: typeof summary === 'string' && summary.trim() ? summary.trim() : null,
                summarySw: typeof summarySw === 'string' ? summarySw.trim() || null : null,
                body: body.trim(),
                bodySw: typeof bodySw === 'string' ? bodySw.trim() || null : null,
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
    const { title, titleSw, category, categorySw, summary, summarySw, body, bodySw, published, youtubeUrl } = req.body;
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
        [titleSw, categorySw, summarySw, bodySw].some((value) => value !== undefined && typeof value !== 'string') ||
        (youtubeUrl !== undefined && typeof youtubeUrl !== 'string') ||
        youtubeEmbedUrl === null ||
        (req.body.removeVideo !== undefined && req.body.removeVideo !== true && req.body.removeVideo !== false &&
            req.body.removeVideo !== 'true' && req.body.removeVideo !== 'false') ||
        (video && youtubeEmbedUrl) ||
        !validPublished ||
        (req.body.removeImage !== undefined && req.body.removeImage !== true && req.body.removeImage !== false &&
            req.body.removeImage !== 'true' && req.body.removeImage !== 'false') ||
        [title, titleSw, category, categorySw, summary, summarySw, body, bodySw, published, youtubeUrl, image, video, removeImage ? true : undefined, removeVideo ? true : undefined].every((value) => value === undefined)) {
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
                ...(typeof titleSw === 'string' ? { titleSw: titleSw.trim() || null } : {}),
                ...(typeof category === 'string' ? { category: category.trim() } : {}),
                ...(typeof categorySw === 'string' ? { categorySw: categorySw.trim() || null } : {}),
                ...(typeof summary === 'string' ? { summary: summary.trim() || null } : {}),
                ...(typeof summarySw === 'string' ? { summarySw: summarySw.trim() || null } : {}),
                ...(typeof body === 'string' ? { body: body.trim() } : {}),
                ...(typeof bodySw === 'string' ? { bodySw: bodySw.trim() || null } : {}),
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
app.post('/api/admin/publications', uploadPublicationPdf, async (req, res) => {
    const { title, titleSw, fileUrl, courseId } = req.body;
    const parsedCourseId = parsePublicationCourseId(courseId);
    const uploadedPdf = getUploadedPublicationPdf(req);
    if (uploadedPdf && !(await isValidPdfSignature(uploadedPdf))) {
        await removeUploadedPublicationPdf(req);
        res.status(400).json({ message: 'The uploaded file is not a valid PDF.' });
        return;
    }
    const resolvedFileUrl = uploadedPdf ? `/uploads/publications/${uploadedPdf.filename}` : fileUrl;
    if (typeof title !== 'string' || !title.trim() ||
        (titleSw !== undefined && typeof titleSw !== 'string') ||
        !isValidPublicationFileUrl(resolvedFileUrl)) {
        await removeUploadedPublicationPdf(req);
        res.status(400).json({ message: 'Enter a publication title and upload a PDF or provide a valid PDF URL.' });
        return;
    }
    if (!parsedCourseId.valid) {
        await removeUploadedPublicationPdf(req);
        res.status(400).json({ message: 'Choose a valid course for this publication.' });
        return;
    }
    try {
        if (parsedCourseId.courseId !== null &&
            !await prisma.course.findUnique({ where: { id: parsedCourseId.courseId }, select: { id: true } })) {
            await removeUploadedPublicationPdf(req);
            res.status(400).json({ message: 'Choose a valid course for this publication.' });
            return;
        }
        const publication = await prisma.publication.create({
            data: {
                title: title.trim(),
                titleSw: typeof titleSw === 'string' ? titleSw.trim() || null : null,
                fileUrl: resolvedFileUrl.trim(),
                courseId: parsedCourseId.courseId
            }
        });
        res.status(201).json({ id: String(publication.id) });
    }
    catch (error) {
        await removeUploadedPublicationPdf(req);
        throw error;
    }
});
app.patch('/api/admin/publications/:id', uploadPublicationPdf, async (req, res) => {
    const id = Number(req.params.id);
    const { title, titleSw, fileUrl, courseId } = req.body;
    const parsedCourseId = parsePublicationCourseId(courseId);
    const uploadedPdf = getUploadedPublicationPdf(req);
    if (!Number.isSafeInteger(id) || id <= 0 ||
        (title !== undefined && (typeof title !== 'string' || !title.trim())) ||
        (titleSw !== undefined && typeof titleSw !== 'string') ||
        (fileUrl !== undefined && fileUrl !== '' && !isValidPublicationFileUrl(fileUrl)) ||
        (title === undefined && titleSw === undefined && (!fileUrl || fileUrl === '') && !uploadedPdf && courseId === undefined)) {
        await removeUploadedPublicationPdf(req);
        res.status(400).json({ message: 'Provide a valid publication title or replace its PDF file.' });
        return;
    }
    if (!parsedCourseId.valid) {
        await removeUploadedPublicationPdf(req);
        res.status(400).json({ message: 'Choose a valid course for this publication.' });
        return;
    }
    if (uploadedPdf && !(await isValidPdfSignature(uploadedPdf))) {
        await removeUploadedPublicationPdf(req);
        res.status(400).json({ message: 'The uploaded file is not a valid PDF.' });
        return;
    }
    try {
        if (parsedCourseId.courseId !== undefined && parsedCourseId.courseId !== null &&
            !await prisma.course.findUnique({ where: { id: parsedCourseId.courseId }, select: { id: true } })) {
            await removeUploadedPublicationPdf(req);
            res.status(400).json({ message: 'Choose a valid course for this publication.' });
            return;
        }
        const existing = await prisma.publication.findUnique({ where: { id } });
        if (!existing) {
            await removeUploadedPublicationPdf(req);
            res.status(404).json({ message: 'Publication not found.' });
            return;
        }
        const nextFileUrl = uploadedPdf
            ? `/uploads/publications/${uploadedPdf.filename}`
            : typeof fileUrl === 'string' && fileUrl.trim()
                ? fileUrl.trim()
                : undefined;
        const publication = await prisma.publication.update({
            where: { id },
            data: {
                ...(typeof title === 'string' ? { title: title.trim() } : {}),
                ...(typeof titleSw === 'string' ? { titleSw: titleSw.trim() || null } : {}),
                ...(nextFileUrl ? { fileUrl: nextFileUrl } : {}),
                ...(parsedCourseId.courseId !== undefined ? { courseId: parsedCourseId.courseId } : {})
            }
        });
        if (nextFileUrl && nextFileUrl !== existing.fileUrl) {
            try {
                await removePublicationPdf(existing.fileUrl);
            }
            catch (error) {
                console.error('Unable to remove replaced publication PDF:', error);
            }
        }
        res.json({ id: String(publication.id) });
    }
    catch (error) {
        await removeUploadedPublicationPdf(req);
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
        const publication = await prisma.publication.findUnique({ where: { id } });
        if (!publication) {
            res.status(404).json({ message: 'Publication not found.' });
            return;
        }
        await prisma.publication.delete({ where: { id } });
        try {
            await removePublicationPdf(publication.fileUrl);
        }
        catch (error) {
            console.error('Unable to remove deleted publication PDF:', error);
        }
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
    const { status, confirmedStartDate, adminFeedback } = req.body;
    const validStartDate = typeof confirmedStartDate === 'string' &&
        /^\d{4}-\d{2}-\d{2}$/.test(confirmedStartDate) &&
        !Number.isNaN(new Date(`${confirmedStartDate}T00:00:00.000Z`).getTime()) &&
        new Date(`${confirmedStartDate}T00:00:00.000Z`).toISOString().slice(0, 10) === confirmedStartDate;
    if (!Number.isSafeInteger(id) || id <= 0 ||
        (status !== 'Pending' && status !== 'Confirmed' && status !== 'Declined' && status !== 'Review')) {
        res.status(400).json({ message: 'Choose a valid booking status.' });
        return;
    }
    if ((status === 'Confirmed' && !validStartDate) ||
        (confirmedStartDate !== undefined && confirmedStartDate !== '' && !validStartDate)) {
        res.status(400).json({ message: 'Set a valid confirmed start date before accepting the booking.' });
        return;
    }
    if (status === 'Declined' && (typeof adminFeedback !== 'string' || !adminFeedback.trim())) {
        res.status(400).json({ message: 'Add feedback explaining why this booking was declined.' });
        return;
    }
    if (adminFeedback !== undefined && (typeof adminFeedback !== 'string' || adminFeedback.length > 2000)) {
        res.status(400).json({ message: 'Booking feedback must be 2000 characters or fewer.' });
        return;
    }
    try {
        const booking = await prisma.booking.update({
            where: { id },
            data: {
                status,
                confirmedStartDate: status === 'Confirmed' && validStartDate
                    ? new Date(`${confirmedStartDate}T00:00:00.000Z`)
                    : null,
                ...(adminFeedback !== undefined ? { adminFeedback: adminFeedback.trim() || null } : {})
            }
        });
        res.json({
            message: 'Booking updated.',
            booking: {
                id: String(booking.id),
                status: booking.status,
                confirmedStartDate: booking.confirmedStartDate?.toISOString() ?? null,
                adminFeedback: booking.adminFeedback
            }
        });
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
app.delete(['/api/admin/bookings/requests/:id', '/api/admin/course-interests/:id'], async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id <= 0) {
        res.status(400).json({ message: 'Invalid booking ID.' });
        return;
    }
    try {
        const interest = await prisma.courseInterest.delete({ where: { id } });
        if (interest.paymentProofPath) {
            const proofPath = node_path_1.default.join(paymentProofUploadDirectory, node_path_1.default.basename(interest.paymentProofPath));
            await (0, promises_1.unlink)(proofPath).catch((error) => {
                if (typeof error !== 'object' || error === null || !('code' in error) || error.code !== 'ENOENT')
                    throw error;
            });
        }
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
app.patch(['/api/admin/bookings/requests/:id', '/api/admin/course-interests/:id'], async (req, res) => {
    const id = Number(req.params.id);
    const { action, confirmedStartDate, controlNumber, feedback, paymentTransactionReference, verifiedAmount } = req.body;
    const validActions = [
        'contacted', 'verify_phone', 'issue_control_number', 'verify_form_fee', 'reject_form_fee',
        'verify_course_fee', 'request_application_changes', 'decline_application', 'send_start_date'
    ];
    if (!Number.isSafeInteger(id) || id <= 0 || !validActions.includes(action)) {
        res.status(400).json({ message: 'Choose a valid next step for this booking.' });
        return;
    }
    if (action === 'issue_control_number' &&
        (typeof controlNumber !== 'string' || !controlNumber.trim() || controlNumber.trim().length > 120)) {
        res.status(400).json({ message: 'Enter the control number provided by the payment system.' });
        return;
    }
    if (action === 'verify_form_fee' &&
        (typeof paymentTransactionReference !== 'string' ||
            paymentTransactionReference.trim().length < 3 ||
            paymentTransactionReference.trim().length > 120 ||
            !Number.isSafeInteger(verifiedAmount) ||
            verifiedAmount !== applicationFormFeeTzs)) {
        res.status(400).json({
            message: `Confirm the official transaction reference and exact TSh ${applicationFormFeeTzs.toLocaleString()} payment amount.`
        });
        return;
    }
    if (['reject_form_fee', 'request_application_changes', 'decline_application'].includes(action) &&
        (typeof feedback !== 'string' || feedback.trim().length < 10 || feedback.trim().length > 2000)) {
        res.status(400).json({ message: 'Enter a clear explanation for the learner using 10 to 2,000 characters.' });
        return;
    }
    if (action === 'send_start_date' &&
        (!isValidCourseStartDate(confirmedStartDate) ||
            confirmedStartDate < new Date().toISOString().slice(0, 10))) {
        res.status(400).json({ message: 'Enter a valid start date that is today or later.' });
        return;
    }
    const interest = await prisma.courseInterest.findUnique({
        where: { id },
        include: {
            user: { select: { phone: true, phoneVerifiedAt: true } },
            courseRecord: { select: { name: true, courseType: true } }
        }
    });
    if (!interest) {
        res.status(404).json({ message: 'Booking not found.' });
        return;
    }
    const expectedStatuses = {
        contacted: ['new'],
        verify_phone: ['new'],
        issue_control_number: ['new'],
        verify_form_fee: interest.userId ? ['payment_submitted'] : ['contacted'],
        reject_form_fee: ['payment_submitted'],
        verify_course_fee: ['form_fee_verified'],
        request_application_changes: ['application_submitted'],
        decline_application: ['application_submitted'],
        send_start_date: interest.userId ? ['application_submitted'] : ['course_fee_verified']
    }[action];
    if (!expectedStatuses.includes(interest.status)) {
        res.status(409).json({ message: 'Complete the previous follow-up step before moving this booking forward.' });
        return;
    }
    if (action === 'verify_phone') {
        if (!interest.userId || !interest.user?.phone) {
            res.status(409).json({ message: 'Add a phone number to the learner account before confirming it.' });
            return;
        }
        if (interest.user.phoneVerifiedAt) {
            res.status(409).json({ message: 'This phone number has already been confirmed.' });
            return;
        }
        const phoneVerifiedAt = new Date();
        const verified = await prisma.$transaction(async (transaction) => {
            const request = await transaction.courseInterest.updateMany({
                where: { id, status: 'new', controlNumber: null },
                data: { updatedAt: phoneVerifiedAt }
            });
            if (request.count !== 1)
                return false;
            const user = await transaction.user.updateMany({
                where: { id: interest.userId, phone: interest.user.phone, phoneVerifiedAt: null },
                data: { phoneVerifiedAt }
            });
            if (user.count !== 1)
                return false;
            await transaction.learnerNotification.create({
                data: {
                    userId: interest.userId,
                    courseInterestId: id,
                    type: 'phone_verified'
                }
            });
            return true;
        });
        if (!verified) {
            res.status(409).json({ message: 'The learner request or phone number changed. Refresh and confirm the current number again.' });
            return;
        }
        res.json({
            message: 'Phone number confirmed. You can now issue the payment control number.',
            phoneVerifiedAt: phoneVerifiedAt.toISOString(),
            booking: { id: String(interest.id), status: interest.status }
        });
        return;
    }
    if (action === 'issue_control_number' && interest.userId &&
        (!interest.user?.phone || !interest.user.phoneVerifiedAt)) {
        res.status(409).json({ message: 'Confirm the learner’s phone number before issuing a payment control number.' });
        return;
    }
    if (action === 'verify_form_fee' && interest.userId && !interest.paymentProofPath) {
        res.status(409).json({ message: 'The learner must upload a payment screenshot before the fee can be verified.' });
        return;
    }
    const actionData = {
        contacted: () => ({ status: 'contacted', contactedAt: new Date() }),
        issue_control_number: () => ({
            status: 'control_number_issued',
            controlNumber: controlNumber.trim(),
            contactedAt: new Date()
        }),
        verify_form_fee: () => ({
            status: 'form_fee_verified',
            formFeePaidAt: new Date(),
            proofReviewedAt: new Date(),
            proofFeedback: null,
            formFeeTransactionReference: paymentTransactionReference.trim().toUpperCase(),
            formFeeVerifiedAmount: verifiedAmount
        }),
        reject_form_fee: () => ({
            status: 'payment_rejected',
            proofReviewedAt: new Date(),
            proofFeedback: feedback.trim()
        }),
        verify_course_fee: () => ({ status: 'course_fee_verified', courseFeePaidAt: new Date() }),
        request_application_changes: () => ({
            status: 'application_needs_changes',
            applicationFeedback: feedback.trim()
        }),
        decline_application: () => ({
            status: 'application_declined',
            applicationFeedback: feedback.trim()
        }),
        send_start_date: () => ({
            status: 'start_date_sent',
            confirmedStartDate: coursePublicationDate(confirmedStartDate)
        })
    }[action];
    const data = actionData();
    let paymentProofRejectionCount = null;
    let accountBlocked = false;
    let result;
    try {
        result = await prisma.$transaction(async (transaction) => {
            const updateResult = await transaction.courseInterest.updateMany({
                where: action === 'issue_control_number' && interest.userId
                    ? {
                        id,
                        status: { in: expectedStatuses },
                        user: { is: { phone: { not: null }, phoneVerifiedAt: { not: null } } }
                    }
                    : { id, status: { in: expectedStatuses } },
                data
            });
            if (updateResult.count !== 1)
                return updateResult;
            if (interest.userId) {
                await transaction.learnerNotification.create({
                    data: {
                        userId: interest.userId,
                        courseInterestId: id,
                        type: action
                    }
                });
            }
            if (action === 'reject_form_fee' && interest.userId) {
                const user = await transaction.user.update({
                    where: { id: interest.userId },
                    data: { paymentProofRejectionCount: { increment: 1 } },
                    select: { paymentProofRejectionCount: true }
                });
                paymentProofRejectionCount = user.paymentProofRejectionCount;
                accountBlocked = paymentProofRejectionCount >= 3;
                if (accountBlocked) {
                    await transaction.user.update({
                        where: { id: interest.userId },
                        data: { isActive: false }
                    });
                }
            }
            return updateResult;
        });
    }
    catch (error) {
        if (action === 'verify_form_fee' && isPrismaError(error, 'P2002')) {
            res.status(409).json({ message: 'This payment transaction reference has already been used. Check the official payment record.' });
            return;
        }
        throw error;
    }
    if (result.count !== 1) {
        res.status(409).json({ message: 'This booking was updated by another administrator. Refresh and try again.' });
        return;
    }
    const updated = await prisma.courseInterest.findUniqueOrThrow({ where: { id } });
    res.json({
        message: 'Booking updated.',
        ...(paymentProofRejectionCount !== null ? { paymentProofRejectionCount, accountBlocked } : {}),
        booking: {
            id: String(updated.id),
            status: updated.status,
            contactedAt: updated.contactedAt?.toISOString() ?? null,
            formFeePaidAt: updated.formFeePaidAt?.toISOString() ?? null,
            courseFeePaidAt: updated.courseFeePaidAt?.toISOString() ?? null,
            confirmedStartDate: updated.confirmedStartDate?.toISOString() ?? null
        }
    });
});
const organizationTextFields = [
    'name', 'nameSw', 'position', 'positionSw', 'biography', 'biographySw',
    'qualifications', 'qualificationsSw', 'responsibilities', 'responsibilitiesSw'
];
const organizationTextLimits = {
    name: 120,
    nameSw: 120,
    position: 160,
    positionSw: 160,
    biography: 10000,
    biographySw: 10000,
    qualifications: 5000,
    qualificationsSw: 5000,
    responsibilities: 5000,
    responsibilitiesSw: 5000
};
const validateOrganizationFields = (body, partial) => {
    for (const field of organizationTextFields) {
        const value = body[field];
        if (partial && value === undefined)
            continue;
        if (typeof value !== 'string' || value.length > organizationTextLimits[field] ||
            (['name', 'position'].includes(field) && !value.trim())) {
            return false;
        }
    }
    const sortOrder = body.sortOrder === undefined && partial ? undefined : Number(body.sortOrder);
    if (sortOrder !== undefined && (!Number.isSafeInteger(sortOrder) || sortOrder < 0 || sortOrder > 10000))
        return false;
    if (body.isPublished !== undefined && body.isPublished !== true && body.isPublished !== false &&
        body.isPublished !== 'true' && body.isPublished !== 'false')
        return false;
    if (body.managerId !== undefined && body.managerId !== null &&
        body.managerId !== '' && !(Number.isSafeInteger(Number(body.managerId)) && Number(body.managerId) > 0))
        return false;
    if (body.clearImage !== undefined && body.clearImage !== true &&
        body.clearImage !== false && body.clearImage !== 'true' && body.clearImage !== 'false')
        return false;
    return true;
};
const organizationMemberFields = (body, includeRequired = false) => ({
    ...(includeRequired || body.name !== undefined ? { name: body.name.trim() } : {}),
    ...(body.nameSw !== undefined ? { nameSw: body.nameSw.trim() || null } : {}),
    ...(includeRequired || body.position !== undefined ? { position: body.position.trim() } : {}),
    ...(body.positionSw !== undefined ? { positionSw: body.positionSw.trim() || null } : {}),
    ...(body.biography !== undefined ? { biography: body.biography.trim() } : {}),
    ...(body.biographySw !== undefined ? { biographySw: body.biographySw.trim() || null } : {}),
    ...(body.qualifications !== undefined ? { qualifications: body.qualifications.trim() || null } : {}),
    ...(body.qualificationsSw !== undefined ? { qualificationsSw: body.qualificationsSw.trim() || null } : {}),
    ...(body.responsibilities !== undefined ? { responsibilities: body.responsibilities.trim() || null } : {}),
    ...(body.responsibilitiesSw !== undefined ? { responsibilitiesSw: body.responsibilitiesSw.trim() || null } : {}),
    ...(body.sortOrder !== undefined ? { sortOrder: Number(body.sortOrder) } : {}),
    ...(body.isPublished !== undefined ? { isPublished: body.isPublished === true || body.isPublished === 'true' } : {})
});
const requestedOrganizationManagerId = (body) => body.managerId === undefined
    ? undefined
    : body.managerId === '' || body.managerId === null ? null : Number(body.managerId);
app.post('/api/admin/organization-structure', uploadOrganizationImage, async (req, res) => {
    const body = req.body;
    if (!validateOrganizationFields(body, false)) {
        await removeUploadedOrganizationImage(req);
        res.status(400).json({ message: 'Enter a name and position and provide valid profile details.' });
        return;
    }
    const managerId = requestedOrganizationManagerId(body);
    if (managerId !== null && managerId !== undefined &&
        !await prisma.organizationMember.findUnique({ where: { id: managerId }, select: { id: true } })) {
        await removeUploadedOrganizationImage(req);
        res.status(400).json({ message: 'Select an existing manager or leave the position at the top level.' });
        return;
    }
    const imageUrl = req.file ? `/uploads/organization/${req.file.filename}` : null;
    try {
        const member = await prisma.organizationMember.create({
            data: {
                ...organizationMemberFields(body, true),
                managerId: managerId ?? null,
                imageUrl
            }
        });
        res.status(201).json({ id: String(member.id) });
    }
    catch (error) {
        await removeUploadedOrganizationImage(req);
        throw error;
    }
});
app.patch('/api/admin/organization-structure/:id', uploadOrganizationImage, async (req, res) => {
    const id = Number(req.params.id);
    const body = req.body;
    if (!Number.isSafeInteger(id) || id <= 0 || !validateOrganizationFields(body, true) ||
        (organizationTextFields.every((field) => body[field] === undefined) &&
            body.sortOrder === undefined && body.isPublished === undefined &&
            body.managerId === undefined && body.clearImage === undefined && !req.file)) {
        await removeUploadedOrganizationImage(req);
        res.status(400).json({ message: 'Provide valid profile details to update.' });
        return;
    }
    const current = await prisma.organizationMember.findUnique({ where: { id } });
    if (!current) {
        await removeUploadedOrganizationImage(req);
        res.status(404).json({ message: 'Organization profile not found.' });
        return;
    }
    const managerId = requestedOrganizationManagerId(body);
    if (managerId !== undefined) {
        if (managerId === id) {
            await removeUploadedOrganizationImage(req);
            res.status(400).json({ message: 'A person cannot report to themselves.' });
            return;
        }
        let ancestorId = managerId;
        const visited = new Set([id]);
        while (ancestorId !== null) {
            if (visited.has(ancestorId)) {
                await removeUploadedOrganizationImage(req);
                res.status(400).json({ message: 'This reporting change would create an organization cycle.' });
                return;
            }
            visited.add(ancestorId);
            const ancestor = await prisma.organizationMember.findUnique({
                where: { id: ancestorId },
                select: { id: true, managerId: true }
            });
            if (!ancestor) {
                await removeUploadedOrganizationImage(req);
                res.status(400).json({ message: 'Select an existing manager or leave the position at the top level.' });
                return;
            }
            ancestorId = ancestor.managerId;
        }
    }
    const shouldClearImage = body.clearImage === true || body.clearImage === 'true';
    const imageUrl = req.file
        ? `/uploads/organization/${req.file.filename}`
        : shouldClearImage ? null : undefined;
    try {
        await prisma.organizationMember.update({
            where: { id },
            data: {
                ...organizationMemberFields(body),
                ...(managerId !== undefined ? { managerId } : {}),
                ...(imageUrl !== undefined ? { imageUrl } : {})
            }
        });
    }
    catch (error) {
        await removeUploadedOrganizationImage(req);
        if (isPrismaError(error, 'P2025')) {
            res.status(404).json({ message: 'Organization profile not found.' });
            return;
        }
        throw error;
    }
    if (req.file || shouldClearImage) {
        try {
            await removeOrganizationImage(current.imageUrl);
        }
        catch (error) {
            console.error('Unable to remove replaced organization profile image:', error);
        }
    }
    res.json({ message: 'Team profile saved.' });
});
app.delete('/api/admin/organization-structure/:id', async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id <= 0) {
        res.status(400).json({ message: 'Invalid organization profile ID.' });
        return;
    }
    const member = await prisma.organizationMember.findUnique({
        where: { id },
        include: { _count: { select: { directReports: true } } }
    });
    if (!member) {
        res.status(404).json({ message: 'Organization profile not found.' });
        return;
    }
    if (member._count.directReports > 0) {
        res.status(409).json({ message: 'Reassign or remove this person’s direct reports before deleting the profile.' });
        return;
    }
    await prisma.organizationMember.delete({ where: { id } });
    try {
        await removeOrganizationImage(member.imageUrl);
    }
    catch (error) {
        console.error('Unable to remove deleted organization profile image:', error);
    }
    res.json({ message: 'Organization profile deleted.' });
});
const partnerTextLimits = { name: 160, nameSw: 160, description: 2000, descriptionSw: 2000 };
const validatePartnerFields = (body, partial) => {
    for (const [field, limit] of Object.entries(partnerTextLimits)) {
        const value = body[field];
        if (partial && value === undefined)
            continue;
        if (typeof value !== 'string' || value.length > limit ||
            (field === 'name' && !value.trim())) {
            return false;
        }
    }
    if (body.websiteUrl !== undefined) {
        const websiteUrl = body.websiteUrl.trim();
        if (websiteUrl.length > 500 ||
            (websiteUrl !== '' && !/^https?:\/\/[^\s]+$/i.test(websiteUrl))) {
            return false;
        }
    }
    const sortOrder = body.sortOrder === undefined && partial ? undefined : Number(body.sortOrder);
    if (sortOrder !== undefined && (!Number.isSafeInteger(sortOrder) || sortOrder < 0 || sortOrder > 10000))
        return false;
    if (body.isPublished !== undefined && body.isPublished !== true && body.isPublished !== false &&
        body.isPublished !== 'true' && body.isPublished !== 'false')
        return false;
    if (body.clearLogo !== undefined && body.clearLogo !== true &&
        body.clearLogo !== false && body.clearLogo !== 'true' && body.clearLogo !== 'false')
        return false;
    return true;
};
const partnerFields = (body, includeRequired = false) => ({
    ...(includeRequired || body.name !== undefined ? { name: body.name.trim() } : {}),
    ...(body.nameSw !== undefined ? { nameSw: body.nameSw.trim() || null } : {}),
    ...(body.description !== undefined ? { description: body.description.trim() } : {}),
    ...(body.descriptionSw !== undefined ? { descriptionSw: body.descriptionSw.trim() || null } : {}),
    ...(body.websiteUrl !== undefined ? { websiteUrl: body.websiteUrl.trim() || null } : {}),
    ...(body.sortOrder !== undefined ? { sortOrder: Number(body.sortOrder) } : {}),
    ...(body.isPublished !== undefined ? { isPublished: body.isPublished === true || body.isPublished === 'true' } : {})
});
app.post('/api/admin/partners', uploadPartnerLogo, async (req, res) => {
    const body = req.body;
    if (!validatePartnerFields(body, false)) {
        await removeUploadedPartnerLogo(req);
        res.status(400).json({ message: 'Enter a partner name and valid partner details.' });
        return;
    }
    try {
        const partner = await prisma.partner.create({
            data: {
                ...partnerFields(body, true),
                logoUrl: req.file ? `/uploads/partners/${req.file.filename}` : null
            }
        });
        res.status(201).json({ id: String(partner.id) });
    }
    catch (error) {
        await removeUploadedPartnerLogo(req);
        throw error;
    }
});
app.patch('/api/admin/partners/:id', uploadPartnerLogo, async (req, res) => {
    const id = Number(req.params.id);
    const body = req.body;
    if (!Number.isSafeInteger(id) || id <= 0 || !validatePartnerFields(body, true) ||
        (Object.keys(partnerTextLimits).every((field) => body[field] === undefined) &&
            body.websiteUrl === undefined && body.sortOrder === undefined &&
            body.isPublished === undefined && body.clearLogo === undefined && !req.file)) {
        await removeUploadedPartnerLogo(req);
        res.status(400).json({ message: 'Provide valid partner details to update.' });
        return;
    }
    const current = await prisma.partner.findUnique({ where: { id } });
    if (!current) {
        await removeUploadedPartnerLogo(req);
        res.status(404).json({ message: 'Partner not found.' });
        return;
    }
    const shouldClearLogo = body.clearLogo === true || body.clearLogo === 'true';
    const logoUrl = req.file
        ? `/uploads/partners/${req.file.filename}`
        : shouldClearLogo ? null : undefined;
    try {
        await prisma.partner.update({
            where: { id },
            data: {
                ...partnerFields(body),
                ...(logoUrl !== undefined ? { logoUrl } : {})
            }
        });
    }
    catch (error) {
        await removeUploadedPartnerLogo(req);
        if (isPrismaError(error, 'P2025')) {
            res.status(404).json({ message: 'Partner not found.' });
            return;
        }
        throw error;
    }
    if (req.file || shouldClearLogo) {
        try {
            await removePartnerLogo(current.logoUrl);
        }
        catch (error) {
            console.error('Unable to remove replaced partner logo:', error);
        }
    }
    res.json({ message: 'Partner saved.' });
});
app.delete('/api/admin/partners/:id', async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id <= 0) {
        res.status(400).json({ message: 'Invalid partner ID.' });
        return;
    }
    const partner = await prisma.partner.findUnique({ where: { id } });
    if (!partner) {
        res.status(404).json({ message: 'Partner not found.' });
        return;
    }
    await prisma.partner.delete({ where: { id } });
    try {
        await removePartnerLogo(partner.logoUrl);
    }
    catch (error) {
        console.error('Unable to remove deleted partner logo:', error);
    }
    res.json({ message: 'Partner deleted.' });
});
app.put('/api/admin/site-settings/:key', async (req, res) => {
    const key = req.params.key;
    if (key === 'home.advertisement') {
        res.status(410).json({ message: 'Homepage advertisements are no longer supported.' });
        return;
    }
    const { value, valueSw } = req.body;
    if (!/^[a-zA-Z0-9._-]{1,100}$/.test(key) || typeof value !== 'string' || value.length > 10000 ||
        (valueSw !== undefined && (typeof valueSw !== 'string' || valueSw.length > 10000))) {
        res.status(400).json({ message: 'Enter a valid setting key and a value under 10,000 characters.' });
        return;
    }
    if ([
        'home.statsStaff',
        'home.statsStudents',
        'home.statsUndergraduate',
        'home.statsPostgraduate',
        'home.statsEmployees',
        'home.statsProgrammes'
    ].includes(key) &&
        !/^(0|[1-9]\d{0,8})$/.test(value)) {
        res.status(400).json({ message: 'Enter a whole-number homepage statistic between 0 and 999,999,999.' });
        return;
    }
    await prisma.siteSetting.upsert({
        where: { key },
        update: { value, ...(typeof valueSw === 'string' ? { valueSw } : {}) },
        create: { key, value, valueSw: typeof valueSw === 'string' ? valueSw : null }
    });
    res.json({ message: 'Site setting saved.' });
});
app.delete('/api/admin/site-settings/:key', async (req, res) => {
    const key = req.params.key;
    if (key === 'home.advertisement') {
        res.status(410).json({ message: 'Homepage advertisements are no longer supported.' });
        return;
    }
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
app.use(async (error, req, res, _next) => {
    try {
        await removeRequestUploads(req);
    }
    catch (cleanupError) {
        console.error('Unable to clean up rejected upload:', cleanupError);
    }
    if (error instanceof OrganizationImageUploadError) {
        res.status(400).json({ message: error.message });
        return;
    }
    if (error instanceof PartnerLogoUploadError) {
        res.status(400).json({ message: error.message });
        return;
    }
    if (error instanceof CourseMediaUploadError) {
        res.status(400).json({ message: error.message });
        return;
    }
    if (error instanceof PaymentProofUploadError) {
        res.status(400).json({ message: error.message });
        return;
    }
    if (error instanceof NewsMediaUploadError) {
        res.status(400).json({ message: error.message });
        return;
    }
    if (error instanceof PublicationPdfUploadError) {
        res.status(400).json({ message: error.message });
        return;
    }
    if (error instanceof multer_1.MulterError) {
        const status = error.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
        res.status(status).json({
            message: error.code === 'LIMIT_FILE_SIZE'
                ? 'Organization profile photos must be 10 MB or smaller. Partner logos, course, news, and payment images must be 5 MB or smaller; course and news videos must be 50 MB or smaller; publication PDFs must be 20 MB or smaller.'
                : 'The upload contains an unsupported file or exceeds the allowed number of files.'
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
