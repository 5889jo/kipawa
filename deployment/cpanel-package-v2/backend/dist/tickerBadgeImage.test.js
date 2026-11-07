"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sharp_1 = __importDefault(require("sharp"));
const vitest_1 = require("vitest");
const tickerBadgeImage_1 = require("./tickerBadgeImage");
(0, vitest_1.describe)('ticker badge GIF background', () => {
    (0, vitest_1.it)('changes dark pixels to soft off-white while preserving colored artwork', async () => {
        const width = 4;
        const height = 4;
        const pixels = Buffer.alloc(width * height * 4);
        for (let index = 0; index < pixels.length; index += 4) {
            pixels[index + 3] = 255;
        }
        const artworkPixel = (2 * width + 2) * 4;
        pixels[artworkPixel] = 255;
        pixels[artworkPixel + 3] = 255;
        const sourceGif = await (0, sharp_1.default)(pixels, { raw: { width, height, channels: 4 } }).gif().toBuffer();
        const processedGif = await (0, tickerBadgeImage_1.softenTickerBadgeDarkBackground)(sourceGif);
        const processedImage = await (0, sharp_1.default)(processedGif, { animated: true })
            .ensureAlpha()
            .raw()
            .toBuffer({ resolveWithObject: true });
        const processedMetadata = await (0, sharp_1.default)(processedGif, { animated: true }).metadata();
        (0, vitest_1.expect)([...processedImage.data.subarray(0, 4)]).toEqual([242, 244, 247, 255]);
        (0, vitest_1.expect)([...processedImage.data.subarray(artworkPixel, artworkPixel + 4)]).toEqual([255, 0, 0, 255]);
        (0, vitest_1.expect)(processedMetadata.pages ?? 1).toBe(1);
    });
    (0, vitest_1.it)('rejects invalid GIF data', async () => {
        await (0, vitest_1.expect)((0, tickerBadgeImage_1.softenTickerBadgeDarkBackground)(Buffer.from('not a GIF'))).rejects.toThrow('The uploaded GIF could not be decoded.');
    });
});
