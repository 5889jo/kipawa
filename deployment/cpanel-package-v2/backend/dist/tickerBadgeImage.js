"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TickerBadgeImageError = void 0;
exports.softenTickerBadgeDarkBackground = softenTickerBadgeDarkBackground;
const sharp_1 = __importDefault(require("sharp"));
const TICKER_BADGE_BACKGROUND = [242, 244, 247];
const MAX_TICKER_BADGE_DECODED_PIXELS = 25_000_000;
const DARK_PIXEL_THRESHOLD = 48;
class TickerBadgeImageError extends Error {
}
exports.TickerBadgeImageError = TickerBadgeImageError;
async function softenTickerBadgeDarkBackground(imageBuffer) {
    const options = { animated: true, limitInputPixels: MAX_TICKER_BADGE_DECODED_PIXELS };
    const image = (0, sharp_1.default)(imageBuffer, options);
    const metadata = await image.metadata().catch(() => {
        throw new TickerBadgeImageError('The uploaded GIF could not be decoded.');
    });
    if (metadata.format !== 'gif' || !metadata.width || !metadata.height) {
        throw new TickerBadgeImageError('The uploaded GIF could not be decoded.');
    }
    const pages = metadata.pages ?? 1;
    const pageHeight = metadata.pageHeight ?? metadata.height;
    const decodedPixels = metadata.width * pageHeight * pages;
    if (decodedPixels > MAX_TICKER_BADGE_DECODED_PIXELS) {
        throw new TickerBadgeImageError('The GIF dimensions or animation are too large to process.');
    }
    const decoded = await (0, sharp_1.default)(imageBuffer, options).ensureAlpha().raw().toBuffer({ resolveWithObject: true }).catch(() => {
        throw new TickerBadgeImageError('The uploaded GIF could not be decoded.');
    });
    const { data, info } = decoded;
    for (let index = 0; index < data.length; index += info.channels) {
        if (data[index + 3] !== 0 &&
            data[index] < DARK_PIXEL_THRESHOLD &&
            data[index + 1] < DARK_PIXEL_THRESHOLD &&
            data[index + 2] < DARK_PIXEL_THRESHOLD) {
            data[index] = TICKER_BADGE_BACKGROUND[0];
            data[index + 1] = TICKER_BADGE_BACKGROUND[1];
            data[index + 2] = TICKER_BADGE_BACKGROUND[2];
        }
    }
    return (0, sharp_1.default)(data, {
        raw: {
            width: info.width,
            height: info.height,
            channels: info.channels,
            pageHeight: info.pageHeight ?? pageHeight
        }
    })
        .gif({ loop: metadata.loop ?? 0, delay: metadata.delay, effort: 7 })
        .toBuffer();
}
