import sharp from 'sharp'
import { describe, expect, it } from 'vitest'
import { softenTickerBadgeDarkBackground } from './tickerBadgeImage'

describe('ticker badge GIF background', () => {
  it('changes dark pixels to soft off-white while preserving colored artwork', async () => {
    const width = 4
    const height = 4
    const pixels = Buffer.alloc(width * height * 4)
    for (let index = 0; index < pixels.length; index += 4) {
      pixels[index + 3] = 255
    }
    const artworkPixel = (2 * width + 2) * 4
    pixels[artworkPixel] = 255
    pixels[artworkPixel + 3] = 255

    const sourceGif = await sharp(pixels, { raw: { width, height, channels: 4 } }).gif().toBuffer()
    const processedGif = await softenTickerBadgeDarkBackground(sourceGif)
    const processedImage = await sharp(processedGif, { animated: true })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true })
    const processedMetadata = await sharp(processedGif, { animated: true }).metadata()

    expect([...processedImage.data.subarray(0, 4)]).toEqual([242, 244, 247, 255])
    expect([...processedImage.data.subarray(artworkPixel, artworkPixel + 4)]).toEqual([255, 0, 0, 255])
    expect(processedMetadata.pages ?? 1).toBe(1)
  })

  it('rejects invalid GIF data', async () => {
    await expect(softenTickerBadgeDarkBackground(Buffer.from('not a GIF'))).rejects.toThrow(
      'The uploaded GIF could not be decoded.'
    )
  })
})
