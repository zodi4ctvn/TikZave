(() => {
  // TikTok Video Downloader ZIP Builder (STORE, CRC-32) — Created by Zodi4c (https://github.com/zodi4ctvn)
  const CRC_TABLE = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    CRC_TABLE[i] = c >>> 0;
  }

  function crc32(bytes) {
    let c = 0xffffffff;
    for (let i = 0; i < bytes.length; i++) {
      c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
    }
    return (c ^ 0xffffffff) >>> 0;
  }

  function encodeUtf8(str) {
    return new TextEncoder().encode(str);
  }

  function buildZip(entries) {
    const localParts = [];
    const centralParts = [];
    let offset = 0;

    for (const entry of entries) {
      const nameBytes = encodeUtf8(entry.name);
      const data = entry.data instanceof Uint8Array ? entry.data : new Uint8Array(entry.data);
      const crc = crc32(data);
      const size = data.length;

      const localHeader = new ArrayBuffer(30 + nameBytes.length);
      const lv = new DataView(localHeader);
      lv.setUint32(0, 0x04034b50, true);
      lv.setUint16(4, 20, true);
      lv.setUint16(6, 0x0800, true);
      lv.setUint16(8, 0, true);
      lv.setUint16(10, 0, true);
      lv.setUint16(12, 0, true);
      lv.setUint32(14, crc, true);
      lv.setUint32(18, size, true);
      lv.setUint32(22, size, true);
      lv.setUint16(26, nameBytes.length, true);
      lv.setUint16(28, 0, true);
      new Uint8Array(localHeader, 30).set(nameBytes);

      localParts.push(new Uint8Array(localHeader), data);

      const centralHeader = new ArrayBuffer(46 + nameBytes.length);
      const cv = new DataView(centralHeader);
      cv.setUint32(0, 0x02014b50, true);
      cv.setUint16(4, 20, true);
      cv.setUint16(6, 20, true);
      cv.setUint16(8, 0x0800, true);
      cv.setUint16(10, 0, true);
      cv.setUint16(12, 0, true);
      cv.setUint16(14, 0, true);
      cv.setUint32(16, crc, true);
      cv.setUint32(20, size, true);
      cv.setUint32(24, size, true);
      cv.setUint16(28, nameBytes.length, true);
      cv.setUint16(30, 0, true);
      cv.setUint16(32, 0, true);
      cv.setUint16(34, 0, true);
      cv.setUint16(36, 0, true);
      cv.setUint32(38, 0, true);
      cv.setUint32(42, offset, true);
      new Uint8Array(centralHeader, 46).set(nameBytes);

      centralParts.push(new Uint8Array(centralHeader));
      offset += 30 + nameBytes.length + size;
    }

    let centralSize = 0;
    for (const part of centralParts) centralSize += part.length;

    const eocd = new ArrayBuffer(22);
    const ev = new DataView(eocd);
    ev.setUint32(0, 0x06054b50, true);
    ev.setUint16(4, 0, true);
    ev.setUint16(6, 0, true);
    ev.setUint16(8, entries.length, true);
    ev.setUint16(10, entries.length, true);
    ev.setUint32(12, centralSize, true);
    ev.setUint32(16, offset, true);
    ev.setUint16(20, 0, true);

    return new Blob([...localParts, ...centralParts, new Uint8Array(eocd)], {
      type: 'application/zip'
    });
  }

  async function fetchBytesSafe(url) {
    let parsed;
    try {
      parsed = new URL(url);
    } catch {
      throw new Error('Invalid media URL');
    }
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      throw new Error('Invalid media protocol');
    }
    let resp;
    try {
      resp = await fetch(parsed.href, { credentials: 'include' });
    } catch {
      resp = await fetch(parsed.href, { credentials: 'omit' });
    }
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const buf = await resp.arrayBuffer();
    return { bytes: new Uint8Array(buf), contentType: (resp.headers.get('content-type') || '').toLowerCase() };
  }

  function sanitizeName(name) {
    return (name || 'tiktok_photos')
      .replace(/[\\/:*?"<>|\r\n\t\u0000-\u001f]+/g, '_')
      .replace(/^\.+|\.+$/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 80) || 'tiktok_photos';
  }

  function buildZipFilename(media, pattern = '{author}_{id}') {
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

    return `TikTok-Video-Downloader/${sanitizeName(base)}_photos.zip`;
  }

  async function createSlideshowZip(media) {
    const images = Array.isArray(media?.images) ? media.images : [];
    const livePhotos = Array.isArray(media?.livePhotos) ? media.livePhotos : [];
    if (images.length === 0 && livePhotos.length === 0) {
      throw new Error('No photos found to package');
    }

    const entries = [];
    for (let i = 0; i < images.length; i++) {
      const idx = String(i + 1).padStart(2, '0');
      const { bytes, contentType } = await fetchBytesSafe(images[i]);
      const ext = contentType.includes('webp') ? 'webp' : contentType.includes('png') ? 'png' : 'jpg';
      entries.push({ name: `photo_${idx}.${ext}`, data: bytes });
    }

    for (let i = 0; i < livePhotos.length; i++) {
      const idx = String(i + 1).padStart(2, '0');
      try {
        const { bytes } = await fetchBytesSafe(livePhotos[i]);
        if (bytes.length > 1024) {
          entries.push({ name: `live_photo_${idx}.mp4`, data: bytes });
        }
      } catch {
        // skip unreachable live clip
      }
    }

    if (entries.length === 0) {
      throw new Error('Failed to fetch photo files');
    }

    return buildZip(entries);
  }

  window.TikTokZipBuilder = { buildZip, createSlideshowZip, buildZipFilename };
})();
