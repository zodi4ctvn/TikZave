(() => {
  // TikTok Video Downloader GIF89a Encoder — Created by Zodi4c (https://github.com/zodi4ctvn)
  // Build 256-color palette: 6x6x6 RGB cube (0..215) + 40 grayscale levels (216..255)
  const PALETTE = new Uint8Array(256 * 3);
  let p = 0;
  for (let r = 0; r < 6; r++) {
    for (let g = 0; g < 6; g++) {
      for (let b = 0; b < 6; b++) {
        PALETTE[p++] = r * 51;
        PALETTE[p++] = g * 51;
        PALETTE[p++] = b * 51;
      }
    }
  }
  for (let i = 0; i < 40; i++) {
    const v = Math.round((i / 39) * 255);
    PALETTE[p++] = v;
    PALETTE[p++] = v;
    PALETTE[p++] = v;
  }

  function quantizeRgba(rgba, pixelCount) {
    const indices = new Uint8Array(pixelCount);
    for (let i = 0, j = 0; i < pixelCount; i++, j += 4) {
      const r = rgba[j];
      const g = rgba[j + 1];
      const b = rgba[j + 2];
      const max = r > g ? (r > b ? r : b) : (g > b ? g : b);
      const min = r < g ? (r < b ? r : b) : (g < b ? g : b);
      if (max - min < 10) {
        const lum = Math.round(((r + g + b) / 765) * 39);
        indices[i] = 216 + lum;
      } else {
        const ri = Math.round(r / 51);
        const gi = Math.round(g / 51);
        const bi = Math.round(b / 51);
        indices[i] = ri * 36 + gi * 6 + bi;
      }
    }
    return indices;
  }

  function lzwEncode(indices, minCodeSize = 8) {
    const clearCode = 1 << minCodeSize;
    const eoiCode = clearCode + 1;
    const out = [];
    let bitBuf = 0;
    let bitCount = 0;

    const writeBits = (code, size) => {
      bitBuf |= code << bitCount;
      bitCount += size;
      while (bitCount >= 8) {
        out.push(bitBuf & 0xff);
        bitBuf >>= 8;
        bitCount -= 8;
      }
    };

    let codeSize = minCodeSize + 1;
    let nextCode = eoiCode + 1;
    let dict = new Map();

    const resetDict = () => {
      dict.clear();
      codeSize = minCodeSize + 1;
      nextCode = eoiCode + 1;
    };

    writeBits(clearCode, codeSize);

    let prefix = indices[0];
    for (let i = 1; i < indices.length; i++) {
      const k = indices[i];
      const key = (prefix << 8) | k;
      const hit = dict.get(key);
      if (hit !== undefined) {
        prefix = hit;
      } else {
        writeBits(prefix, codeSize);
        if (nextCode < 4096) {
          dict.set(key, nextCode++);
          if (nextCode > (1 << codeSize) && codeSize < 12) {
            codeSize++;
          }
        } else {
          writeBits(clearCode, codeSize);
          resetDict();
        }
        prefix = k;
      }
    }

    writeBits(prefix, codeSize);
    writeBits(eoiCode, codeSize);
    if (bitCount > 0) out.push(bitBuf & 0xff);

    // Pack into GIF sub-blocks (max 255 bytes each)
    const blocks = [minCodeSize];
    for (let i = 0; i < out.length; i += 255) {
      const len = Math.min(255, out.length - i);
      blocks.push(len);
      for (let j = 0; j < len; j++) blocks.push(out[i + j]);
    }
    blocks.push(0); // block terminator
    return new Uint8Array(blocks);
  }

  function encodeGif(frames, width, height, delayCs = 12) {
    const chunks = [];
    const pushBytes = (...arr) => chunks.push(new Uint8Array(arr));
    const u16 = (v) => [v & 0xff, (v >> 8) & 0xff];

    // Header: GIF89a
    pushBytes(0x47, 0x49, 0x46, 0x38, 0x39, 0x61);
    // Logical Screen Descriptor (Global Color Table, 256 colors)
    pushBytes(...u16(width), ...u16(height), 0xf7, 0x00, 0x00);
    // Global Color Table
    chunks.push(PALETTE);
    // Netscape 2.0 loop extension (infinite loop)
    pushBytes(
      0x21, 0xff, 0x0b,
      0x4e, 0x45, 0x54, 0x53, 0x43, 0x41, 0x50, 0x45, 0x32, 0x2e, 0x30,
      0x03, 0x01, 0x00, 0x00, 0x00
    );

    const pixelCount = width * height;
    for (const rgba of frames) {
      // Graphic Control Extension
      pushBytes(0x21, 0xf9, 0x04, 0x04, ...u16(delayCs), 0x00, 0x00);
      // Image Descriptor
      pushBytes(0x2c, 0x00, 0x00, 0x00, 0x00, ...u16(width), ...u16(height), 0x00);
      // LZW Image Data
      chunks.push(lzwEncode(quantizeRgba(rgba, pixelCount), 8));
    }

    // Trailer
    pushBytes(0x3b);
    return new Blob(chunks, { type: 'image/gif' });
  }

  async function fetchBlobSafe(url) {
    let parsed;
    try {
      parsed = new URL(url);
    } catch {
      throw new Error('Geçersiz medya adresi');
    }
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      throw new Error('Geçersiz medya protokolü');
    }
    let resp;
    try {
      resp = await fetch(parsed.href, { credentials: 'include' });
    } catch {
      resp = await fetch(parsed.href, { credentials: 'omit' });
    }
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    return resp.blob();
  }

  function sanitizeName(name) {
    return (name || 'tiktok_video')
      .replace(/[\\/:*?"<>|\r\n\t]+/g, '_')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 80) || 'tiktok_video';
  }

  function buildGifFilename(media, pattern = '{author}_{id}') {
    const author = sanitizeName(media?.author || 'tiktok');
    const id = sanitizeName(media?.id || String(Date.now()));
    const title = sanitizeName(media?.title || id);

    let base;
    switch (pattern) {
      case '{title}_{id}':
        base = `${title}_${id}`;
        break;
      case '{id}':
        base = `${id}`;
        break;
      case '{author}_{id}':
      default:
        base = `${author}_${id}`;
        break;
    }

    return `TikTok-Video-Downloader/${sanitizeName(base)}.gif`;
  }

  function waitForSeeked(video, timeoutMs = 8000) {
    return new Promise((resolve, reject) => {
      let settled = false;
      const cleanup = () => {
        video.onseeked = null;
        video.onerror = null;
        clearTimeout(timer);
      };
      const timer = setTimeout(() => {
        if (!settled) {
          settled = true;
          cleanup();
          reject(new Error('GIF karesi zaman aşımına uğradı'));
        }
      }, timeoutMs);

      video.onseeked = () => {
        if (!settled) {
          settled = true;
          cleanup();
          resolve();
        }
      };
      video.onerror = () => {
        if (!settled) {
          settled = true;
          cleanup();
          reject(new Error('Video karesi okunurken hata oluştu'));
        }
      };
    });
  }

  async function createFromMedia(media) {
    const maxW = 320;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    // Photo / Slideshow -> Animated GIF
    if (Array.isArray(media.images) && media.images.length > 0) {
      const bitmaps = [];
      try {
        for (const imgUrl of media.images.slice(0, 15)) {
          const blob = await fetchBlobSafe(imgUrl);
          bitmaps.push(await createImageBitmap(blob));
        }
        if (bitmaps.length === 0 || !bitmaps[0].width || !bitmaps[0].height) {
          throw new Error('Slayt görselleri çözümlenemedi.');
        }
        const w = maxW;
        const h = Math.max(120, Math.round((bitmaps[0].height / bitmaps[0].width) * w));
        canvas.width = w;
        canvas.height = h;

        const frames = [];
        for (const bmp of bitmaps) {
          ctx.drawImage(bmp, 0, 0, w, h);
          frames.push(ctx.getImageData(0, 0, w, h).data);
        }
        return encodeGif(frames, w, h, 110); // 1.1s per slide
      } finally {
        for (const bmp of bitmaps) {
          try {
            bmp.close();
          } catch {
            // ignore close error
          }
        }
      }
    }

    // Video -> Animated GIF (up to 4.5s @ ~8fps)
    const videoUrl = media.sdUrl || media.hdUrl;
    if (!videoUrl) throw new Error('GIF için video akışı bulunamadı.');

    const videoBlob = await fetchBlobSafe(videoUrl);
    const objUrl = URL.createObjectURL(videoBlob);
    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';
    video.src = objUrl;

    try {
      await new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          video.onloadedmetadata = null;
          video.onerror = null;
          reject(new Error('Video meta verisi zaman aşımına uğradı'));
        }, 12000);
        video.onloadedmetadata = () => {
          clearTimeout(timer);
          resolve();
        };
        video.onerror = () => {
          clearTimeout(timer);
          reject(new Error('Video GIF için yüklenemedi'));
        };
      });

      if (!video.videoWidth || !video.videoHeight) {
        throw new Error('Video görüntü boyutları okunamadı (kodek desteklenmiyor olabilir).');
      }

      const w = maxW;
      const h = Math.max(120, Math.round((video.videoHeight / video.videoWidth) * w));
      canvas.width = w;
      canvas.height = h;

      const duration = Math.min(video.duration || 4, 4.5);
      const fps = 8;
      const totalFrames = Math.max(4, Math.floor(duration * fps));
      const step = duration / totalFrames;
      const frames = [];

      for (let i = 0; i < totalFrames; i++) {
        const seekPromise = waitForSeeked(video, 8000);
        video.currentTime = i * step;
        await seekPromise;
        ctx.drawImage(video, 0, 0, w, h);
        frames.push(ctx.getImageData(0, 0, w, h).data);
      }

      return encodeGif(frames, w, h, Math.round(100 / fps));
    } finally {
      URL.revokeObjectURL(objUrl);
      video.remove();
    }
  }

  window.TikTokDownloaderGif = { encodeGif, createFromMedia, buildGifFilename };
})();
