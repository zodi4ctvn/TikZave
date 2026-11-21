// TikTok Video Downloader Background Service Worker — Created by Zodi4c (https://github.com/zodi4ctvn)
// License: Custom Non-Commercial Attribution License (see LICENSE)

const DEFAULT_SETTINGS = {
  quality: 'hd',
  injectButtons: true,
  saveAs: false,
  photosAsZip: false,
  lang: null,
  filenamePattern: '{author}_{id}'
};

const MAX_HISTORY = 50;

const INTEGRITY_REPO_URL = 'https://github.com/zodi4ctvn';
const INTEGRITY_ERROR_MSG =
  '[TR] TikTok Video Downloader marka/atıf doğrulaması başarısız! Orijinal "TikTok Video Downloader" adı ve "Zodi4c" yazar bilgisi korunmalıdır. ' +
  `Lütfen orijinal atfı geri yükleyin: ${INTEGRITY_REPO_URL} | ` +
  '[EN] TikTok Video Downloader brand/attribution integrity check failed! Please restore the original "TikTok Video Downloader" name and "Zodi4c" author credit: ' +
  INTEGRITY_REPO_URL;

function verifyBrandIntegrity() {
  try {
    const manifest = chrome.runtime.getManifest();
    const nameOk = typeof manifest?.name === 'string' && manifest.name.includes('TikTok Video Downloader');
    const authorOk = typeof manifest?.author === 'string' && manifest.author.includes('Zodi4c');
    const descOk = typeof manifest?.description === 'string' && manifest.description.includes('Zodi4c');
    if (!nameOk || !authorOk || !descOk) {
      console.error(INTEGRITY_ERROR_MSG);
      return false;
    }
    return true;
  } catch {
    console.error(INTEGRITY_ERROR_MSG);
    return false;
  }
}

function isAllowedTikTokUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return false;
  try {
    const parsed = new URL(rawUrl.trim());
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return false;
    const host = parsed.hostname.toLowerCase();
    return (
      host === 'tiktok.com' ||
      host === 'www.tiktok.com' ||
      host === 'vm.tiktok.com' ||
      host === 'vt.tiktok.com' ||
      host === 'm.tiktok.com'
    );
  } catch {
    return false;
  }
}

chrome.runtime.onInstalled.addListener(async () => {
  const existing = await chrome.storage.local.get(['settings', 'history']);
  if (!existing.settings) {
    await chrome.storage.local.set({ settings: DEFAULT_SETTINGS });
  }
  if (!existing.history) {
    await chrome.storage.local.set({ history: [] });
  }
});

async function getSettings() {
  const { settings } = await chrome.storage.local.get('settings');
  return { ...DEFAULT_SETTINGS, ...(settings || {}) };
}

function normalizeTikWmUrl(url) {
  if (!url || typeof url !== 'string') return '';
  if (url.startsWith('//')) return 'https:' + url;
  if (url.startsWith('/')) return 'https://www.tikwm.com' + url;
  return url;
}

function extractVideoId(url) {
  if (!url) return null;
  const match = url.match(/\/(?:video|photo|v)\/(\d+)/i);
  if (match) return match[1];
  const itemMatch = url.match(/[?&]item_id=(\d+)/i);
  return itemMatch ? itemMatch[1] : null;
}

function sanitizeFilename(name) {
  return (name || 'tiktok_video')
    .replace(/[\\/:*?"<>|\r\n\t\u0000-\u001f]+/g, '_')
    .replace(/^\.+|\.+$/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80) || 'tiktok_video';
}

function buildFilename(media, ext, pattern, suffix = '') {
  const author = sanitizeFilename(media.author || 'tiktok');
  const id = sanitizeFilename(media.id || String(Date.now()));
  const title = sanitizeFilename(media.title || id);

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

  const finalBase = sanitizeFilename(base + suffix);
  return `TikTok-Video-Downloader/${finalBase}.${ext}`;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchFromTikWm(videoUrl, attempt = 1) {
  const endpoint = `https://www.tikwm.com/api/?url=${encodeURIComponent(videoUrl)}&hd=1`;
  const resp = await fetch(endpoint, {
    method: 'GET',
    headers: { Accept: 'application/json' }
  });

  if (resp.status === 429 && attempt < 3) {
    await sleep(1250 * attempt);
    return fetchFromTikWm(videoUrl, attempt + 1);
  }

  if (!resp.ok) {
    throw new Error(`TikWM HTTP ${resp.status}`);
  }

  const json = await resp.json();
  if (json.code !== 0 || !json.data) {
    const msg = (json.msg || '').toLowerCase();
    if (attempt < 3 && (msg.includes('limit') || msg.includes('frequently') || msg.includes('wait'))) {
      await sleep(1250 * attempt);
      return fetchFromTikWm(videoUrl, attempt + 1);
    }
    throw new Error(json.msg || 'Video bilgisi alınamadı');
  }

  const d = json.data;
  const images = Array.isArray(d.images) ? d.images.map(normalizeTikWmUrl).filter(Boolean) : [];
  const isPhotoPost = images.length > 0;
  return {
    id: d.id || extractVideoId(videoUrl) || String(Date.now()),
    title: d.title || '',
    author: d.author?.unique_id || d.author?.nickname || 'tiktok',
    authorName: d.author?.nickname || d.author?.unique_id || 'TikTok User',
    avatar: normalizeTikWmUrl(d.author?.avatar),
    cover: normalizeTikWmUrl(d.origin_cover || d.cover || images[0]),
    duration: d.duration || 0,
    hdUrl: isPhotoPost ? '' : normalizeTikWmUrl(d.hdplay),
    sdUrl: isPhotoPost ? '' : normalizeTikWmUrl(d.play),
    wmUrl: isPhotoPost ? '' : normalizeTikWmUrl(d.wmplay),
    musicUrl: normalizeTikWmUrl(d.music || (isPhotoPost ? d.play : '')),
    musicTitle: d.music_info?.title || 'original-sound',
    images,
    livePhotos: [],
    isPhotoPost,
    stats: {
      plays: d.play_count || 0,
      likes: d.digg_count || 0,
      comments: d.comment_count || 0,
      shares: d.share_count || 0
    },
    pageUrl: videoUrl,
    source: 'tikwm'
  };
}

function streamMeta(b) {
  return `${b.CodecType || ''} ${b.GearName || ''} ${b.PlayAddr?.UrlKey || ''}`.toLowerCase();
}

function isHevcMeta(meta) {
  return meta.includes('bytevc1') || meta.includes('hevc') || meta.includes('h265') || meta.includes('hvc1');
}

function pickVideoStream(videoObj) {
  if (!videoObj) return { url: '', codec: 'unknown' };
  if (Array.isArray(videoObj.bitrateInfo) && videoObj.bitrateInfo.length > 0) {
    const withUrls = videoObj.bitrateInfo.filter((b) => b.PlayAddr?.UrlList?.length);
    const h264Streams = withUrls.filter((b) => {
      const meta = streamMeta(b);
      return (meta.includes('h264') || meta.includes('avc')) && !isHevcMeta(meta);
    });
    if (h264Streams.length > 0) {
      h264Streams.sort((a, b) => (b.Bitrate || 0) - (a.Bitrate || 0));
      return { url: h264Streams[0].PlayAddr.UrlList[0], codec: 'h264' };
    }
    const nonHevc = withUrls.filter((b) => !isHevcMeta(streamMeta(b)));
    if (nonHevc.length > 0) {
      nonHevc.sort((a, b) => (b.Bitrate || 0) - (a.Bitrate || 0));
      return { url: nonHevc[0].PlayAddr.UrlList[0], codec: 'unknown' };
    }
  }
  return { url: videoObj.playAddr || '', codec: 'unknown' };
}

async function fetchFromTiklyDown(videoUrl) {
  const endpoint = `https://api.tiklydown.eu.org/api/download?url=${encodeURIComponent(videoUrl)}`;
  const resp = await fetch(endpoint, { headers: { Accept: 'application/json' } });
  if (!resp.ok) throw new Error(`TiklyDown HTTP ${resp.status}`);
  const data = await resp.json();
  const noWm = data?.video?.noWatermark;
  if (!noWm && (!Array.isArray(data?.images) || data.images.length === 0)) {
    throw new Error('TiklyDown video bulunamadı');
  }
  const images = Array.isArray(data.images) ? data.images.map((i) => i.url || i).filter(Boolean) : [];
  const isPhotoPost = images.length > 0;
  return {
    id: String(data.id || extractVideoId(videoUrl) || Date.now()),
    title: data.title || '',
    author: data.author?.unique_id || data.author?.name || 'tiktok',
    authorName: data.author?.name || data.author?.unique_id || 'TikTok User',
    avatar: data.author?.avatar || '',
    cover: data.video?.cover || data.video?.originCover || images[0] || '',
    duration: data.video?.duration || 0,
    hdUrl: isPhotoPost ? '' : (noWm || ''),
    sdUrl: isPhotoPost ? '' : (noWm || ''),
    wmUrl: isPhotoPost ? '' : (data.video?.watermark || ''),
    musicUrl: data.music?.play_url || '',
    musicTitle: data.music?.title || 'original-sound',
    images,
    livePhotos: [],
    isPhotoPost,
    stats: {
      plays: data.stats?.playCount || 0,
      likes: data.stats?.likeCount || 0,
      comments: data.stats?.commentCount || 0,
      shares: data.stats?.shareCount || 0
    },
    pageUrl: videoUrl,
    source: 'tiklydown'
  };
}

async function fetchFromTikTokDirect(videoUrl, tabId) {
  if (!isAllowedTikTokUrl(videoUrl)) {
    throw new Error('Yalnızca geçerli TikTok bağlantıları desteklenir.');
  }

  const videoId = extractVideoId(videoUrl);

  // Try asking the active TikTok tab first (uses page cookies, fresh HTML fetch & active <video> src)
  if (tabId) {
    try {
      const tabResult = await chrome.tabs.sendMessage(tabId, {
        action: 'extractFromPage',
        videoId,
        url: videoUrl
      });
      if (tabResult && (tabResult.hdUrl || tabResult.sdUrl || (tabResult.images && tabResult.images.length))) {
        return { ...tabResult, pageUrl: videoUrl, source: tabResult.source || 'tiktok_page' };
      }
    } catch {
      // Tab might not have content script or closed; continue to direct fetch fallback
    }
  }

  if (!videoId) {
    throw new Error('Video ID çözümlenemedi');
  }

  let item = null;
  try {
    const htmlResp = await fetch(videoUrl, { credentials: 'include' });
    if (htmlResp.ok) {
      const html = await htmlResp.text();
      const match = html.match(/<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>([\s\S]*?)<\/script>/);
      if (match) {
        const parsed = JSON.parse(match[1]);
        const detail = parsed?.['__DEFAULT_SCOPE__']?.['webapp.video-detail']?.itemInfo?.itemStruct;
        if (detail && detail.id === videoId) item = detail;
      }
    }
  } catch {
    // ignore HTML fetch error
  }

  if (!item) {
    const resp = await fetch(`https://www.tiktok.com/api/item/detail/?itemId=${videoId}`, {
      credentials: 'include'
    });
    if (!resp.ok) {
      throw new Error(`TikTok API HTTP ${resp.status}`);
    }
    const data = await resp.json();
    item = data?.itemInfo?.itemStruct;
  }

  if (!item) {
    throw new Error('TikTok video verisi bulunamadı');
  }

  const picked = pickVideoStream(item.video);
  const images = Array.isArray(item.imagePost?.images)
    ? item.imagePost.images.map((img) => img?.imageURL?.urlList?.[0]).filter(Boolean)
    : [];
  const livePhotos = Array.isArray(item.imagePost?.images)
    ? item.imagePost.images
        .map((img) => {
          const v = img?.video || img?.livePhoto;
          if (!v) return '';
          if (typeof v === 'string') return v;
          if (v.urlList?.[0]) return v.urlList[0];
          const s = pickVideoStream(v);
          return s.url || '';
        })
        .filter(Boolean)
    : [];
  const isPhotoPost = images.length > 0 || livePhotos.length > 0;
  const videoUrlDirect = isPhotoPost ? '' : picked.url;

  if (!videoUrlDirect && !isPhotoPost) {
    throw new Error('Filigransız H.264 video akışı bulunamadı');
  }

  return {
    id: item.id || videoId,
    title: item.desc || '',
    author: item.author?.uniqueId || 'tiktok',
    authorName: item.author?.nickname || item.author?.uniqueId || 'TikTok User',
    avatar: item.author?.avatarThumb || '',
    cover: item.video?.originCover || item.video?.cover || images[0] || '',
    duration: item.video?.duration || 0,
    hdUrl: videoUrlDirect,
    sdUrl: videoUrlDirect,
    wmUrl: isPhotoPost ? '' : (item.video?.downloadAddr || ''),
    musicUrl: item.music?.playUrl || '',
    musicTitle: item.music?.title || 'original-sound',
    images,
    livePhotos,
    isPhotoPost,
    stats: {
      plays: item.stats?.playCount || 0,
      likes: item.stats?.diggCount || 0,
      comments: item.stats?.commentCount || 0,
      shares: item.stats?.shareCount || 0
    },
    pageUrl: videoUrl,
    codecHint: picked.codec,
    source: 'tiktok_direct'
  };
}

async function resolveTikTokMedia(url, tabId = null) {
  let cleanUrl = (url || '').trim();
  if (!cleanUrl) throw new Error('Geçerli bir TikTok bağlantısı girin.');
  if (!isAllowedTikTokUrl(cleanUrl)) {
    throw new Error('Yalnızca tiktok.com, vm.tiktok.com, vt.tiktok.com ve m.tiktok.com bağlantıları desteklenir.');
  }

  // Strip tracking query params from standard tiktok.com URLs
  if (/tiktok\.com\/@.+\/(video|photo)\/\d+/i.test(cleanUrl)) {
    cleanUrl = cleanUrl.split('?')[0];
  }

  let media = null;
  try {
    media = await fetchFromTikWm(cleanUrl);
  } catch (tikwmErr) {
    try {
      media = await fetchFromTiklyDown(cleanUrl);
    } catch (tiklyErr) {
      try {
        media = await fetchFromTikTokDirect(cleanUrl, tabId);
      } catch (directErr) {
        throw new Error(`${tikwmErr.message} | ${tiklyErr.message} | ${directErr.message}`);
      }
    }
  }

  // Enrich photo posts with Live Photo clips from page/session when available
  if (media && media.isPhotoPost && (!media.livePhotos || media.livePhotos.length === 0) && tabId) {
    try {
      const pageData = await chrome.tabs.sendMessage(tabId, {
        action: 'extractFromPage',
        videoId: media.id || extractVideoId(cleanUrl),
        url: cleanUrl
      });
      if (pageData && Array.isArray(pageData.livePhotos) && pageData.livePhotos.length > 0) {
        media.livePhotos = pageData.livePhotos;
      }
    } catch {
      // ignore enrichment error
    }
  }

  return media;
}

const PROBE_BYTES = 262144;

function isTikTokHost(url) {
  try {
    const h = new URL(url).hostname.toLowerCase();
    return /(^|\.)tiktok\.com$/.test(h) || h.includes('tiktokcdn') || h.includes('muscdn');
  } catch {
    return false;
  }
}

async function readRange(url, range) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    const resp = await fetch(url, {
      headers: { Range: range },
      signal: controller.signal,
      credentials: isTikTokHost(url) ? 'include' : 'omit',
      redirect: 'follow'
    });
    if (!resp.ok) return null;
    const ctype = (resp.headers.get('content-type') || '').toLowerCase();
    if (ctype.includes('text/html') || ctype.includes('json')) return null;
    if (!resp.body) return new Uint8Array(await resp.arrayBuffer()).slice(0, PROBE_BYTES);

    const reader = resp.body.getReader();
    const chunks = [];
    let total = 0;
    while (total < PROBE_BYTES) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      total += value.length;
    }
    reader.cancel().catch(() => {});
    const out = new Uint8Array(Math.min(total, PROBE_BYTES));
    let offset = 0;
    for (const c of chunks) {
      const take = Math.min(c.length, out.length - offset);
      if (take <= 0) break;
      out.set(c.subarray(0, take), offset);
      offset += take;
    }
    return out;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
    controller.abort();
  }
}

function fourccAt(bytes, i) {
  return String.fromCharCode(bytes[i], bytes[i + 1], bytes[i + 2], bytes[i + 3]);
}

function detectCodecFromBytes(bytes) {
  if (!bytes || bytes.length < 32) return null;
  let sawAudio = false;
  for (let i = 0; i < bytes.length - 24; i++) {
    if (bytes[i] !== 0x73 || bytes[i + 1] !== 0x74 || bytes[i + 2] !== 0x73 || bytes[i + 3] !== 0x64) continue;
    const fmt = fourccAt(bytes, i + 16);
    if (fmt === 'avc1' || fmt === 'avc3') return 'h264';
    if (fmt === 'hvc1' || fmt === 'hev1' || fmt === 'dvh1' || fmt === 'dvhe') return 'hevc';
    if (fmt === 'av01') return 'av1';
    if (fmt === 'vp09') return 'vp9';
    if (fmt === 'mp4a') sawAudio = true;
  }
  return sawAudio ? 'audio_only_header' : null;
}

async function probeVideoCodec(url) {
  const head = await readRange(url, `bytes=0-${PROBE_BYTES - 1}`);
  if (!head) return 'unreachable';
  let codec = detectCodecFromBytes(head);
  if (codec === 'h264' || codec === 'hevc' || codec === 'av1' || codec === 'vp9') return codec;

  const tail = await readRange(url, `bytes=-${PROBE_BYTES}`);
  const tailCodec = detectCodecFromBytes(tail);
  if (tailCodec && tailCodec !== 'audio_only_header') return tailCodec;
  return codec === 'audio_only_header' || tailCodec === 'audio_only_header' ? 'audio_only' : 'unknown';
}

const CODEC_RANK = { h264: 0, unknown: 1, unreachable: 2, vp9: 3, av1: 4, hevc: 5, audio_only: 9 };

async function selectPlayableVideo(media, format, tabId) {
  const tried = new Set();
  let best = null;

  const consider = async (url, source, codecHint) => {
    if (!url || tried.has(url)) return null;
    tried.add(url);
    let codec = await probeVideoCodec(url);
    if ((codec === 'unreachable' || codec === 'unknown') && codecHint === 'h264') codec = 'h264';
    const candidate = { url, source, codec };
    if (!best || CODEC_RANK[codec] < CODEC_RANK[best.codec]) best = candidate;
    return codec === 'h264' ? candidate : null;
  };

  const primaryOrder = format === 'hd' ? [media.hdUrl, media.sdUrl] : [media.sdUrl, media.hdUrl];
  for (const url of primaryOrder) {
    const ok = await consider(url, media.source, media.codecHint);
    if (ok) return ok;
  }

  const pageUrl = media.pageUrl;
  if (pageUrl && isAllowedTikTokUrl(pageUrl)) {
    const alternatives = [
      () => fetchFromTikTokDirect(pageUrl, tabId),
      () => (media.source !== 'tikwm' ? fetchFromTikWm(pageUrl) : null),
      () => (media.source !== 'tiklydown' ? fetchFromTiklyDown(pageUrl) : null)
    ];
    for (const getAlt of alternatives) {
      try {
        const alt = await getAlt();
        if (!alt) continue;
        const order = format === 'hd' ? [alt.hdUrl, alt.sdUrl] : [alt.sdUrl, alt.hdUrl];
        for (const url of order) {
          const ok = await consider(url, alt.source, alt.codecHint);
          if (ok) return ok;
        }
      } catch {
        // try next source
      }
    }
  }

  return best;
}

async function addToHistory(entry) {
  const { history = [] } = await chrome.storage.local.get('history');
  const updated = [entry, ...history].slice(0, MAX_HISTORY);
  await chrome.storage.local.set({ history: updated });
}

function downloadFile(url, filename, saveAs) {
  return new Promise((resolve, reject) => {
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
        reject(new Error('Geçersiz indirme bağlantısı'));
        return;
      }
    } catch {
      reject(new Error('Geçersiz indirme bağlantısı'));
      return;
    }

    chrome.downloads.download(
      {
        url,
        filename,
        saveAs: Boolean(saveAs),
        conflictAction: 'uniquify'
      },
      (downloadId) => {
        if (chrome.runtime.lastError || !downloadId) {
          reject(new Error(chrome.runtime.lastError?.message || 'İndirme başlatılamadı'));
        } else {
          resolve(downloadId);
        }
      }
    );
  });
}

async function performDownload(media, format, tabId = null) {
  const settings = await getSettings();
  const chosenFormat = format || settings.quality || 'hd';
  const hasImages = Array.isArray(media.images) && media.images.length > 0;
  const hasLivePhotos = Array.isArray(media.livePhotos) && media.livePhotos.length > 0;
  const isPhotoPost = Boolean(media.isPhotoPost || hasImages || hasLivePhotos);

  if (chosenFormat === 'live_photos') {
    if (!hasLivePhotos) {
      throw new Error('Bu gönderide Live Photo klibi bulunamadı.');
    }
    const ids = [];
    for (let i = 0; i < media.livePhotos.length; i++) {
      const idx = String(i + 1).padStart(2, '0');
      const filename = buildFilename(media, 'mp4', settings.filenamePattern, `_live_${idx}`);
      const dlId = await downloadFile(media.livePhotos[i], filename, i === 0 ? settings.saveAs : false);
      ids.push(dlId);
    }
    await addToHistory({
      id: media.id,
      downloadId: ids[0],
      title: media.title || 'Live Photo',
      author: media.author,
      cover: media.cover || media.images?.[0] || '',
      format: 'live',
      filename: `${ids.length} live`,
      pageUrl: media.pageUrl,
      timestamp: Date.now()
    });
    return { success: true, downloadId: ids[0], count: ids.length, filename: `${ids.length} live` };
  }

  if (chosenFormat === 'images' || (isPhotoPost && (chosenFormat === 'hd' || chosenFormat === 'sd'))) {
    if (!hasImages && !hasLivePhotos) {
      throw new Error('Bu gönderide indirilecek fotoğraf bulunamadı.');
    }
    const ids = [];
    const images = media.images || [];
    for (let i = 0; i < images.length; i++) {
      const idx = String(i + 1).padStart(2, '0');
      const filename = buildFilename(media, 'jpg', settings.filenamePattern, `_photo_${idx}`);
      const dlId = await downloadFile(images[i], filename, i === 0 ? settings.saveAs : false);
      ids.push(dlId);
    }
    const livePhotos = media.livePhotos || [];
    for (let i = 0; i < livePhotos.length; i++) {
      const idx = String(i + 1).padStart(2, '0');
      const filename = buildFilename(media, 'mp4', settings.filenamePattern, `_live_${idx}`);
      try {
        const dlId = await downloadFile(livePhotos[i], filename, ids.length === 0 && i === 0 ? settings.saveAs : false);
        ids.push(dlId);
      } catch {
        // skip unreachable live clip
      }
    }
    await addToHistory({
      id: media.id,
      downloadId: ids[0] || null,
      title: media.title || 'Photo Slideshow',
      author: media.author,
      cover: media.cover || images[0] || '',
      format: 'images',
      filename: `${ids.length} files`,
      pageUrl: media.pageUrl,
      timestamp: Date.now()
    });
    return { success: true, downloadId: ids[0] || null, count: ids.length, filename: `${ids.length} files` };
  }

  let targetUrl = '';
  let ext = 'mp4';
  let suffix = '';
  let streamSource = media.source;
  let warning = null;

  if (chosenFormat === 'mp3') {
    targetUrl = media.musicUrl;
    ext = 'mp3';
    suffix = '_ses';
    if (!targetUrl) throw new Error('Bu videoda ses dosyası bulunamadı.');
  } else if (chosenFormat === 'cover') {
    targetUrl = media.cover;
    ext = 'jpg';
    suffix = '_kapak';
    if (!targetUrl) throw new Error('Kapak görseli bulunamadı.');
  } else {
    const picked = await selectPlayableVideo(media, chosenFormat === 'hd' ? 'hd' : 'sd', tabId);
    if (!picked || !picked.url) throw new Error('Video bağlantısı bulunamadı.');
    if (picked.codec === 'audio_only') {
      throw new Error('Kaynak yalnızca ses içeriyor, görüntülü akış bulunamadı. Biraz sonra tekrar deneyin.');
    }
    targetUrl = picked.url;
    streamSource = picked.source;
    if (picked.codec === 'hevc' || picked.codec === 'av1' || picked.codec === 'vp9') {
      warning =
        'Bu video yalnızca HEVC/H.265 olarak bulundu. Windows\'ta görüntü gelmezse VLC ile açın ' +
        'veya Microsoft Store\'dan "HEVC Video Uzantıları"nı yükleyin.';
    }
  }

  const filename = buildFilename(media, ext, settings.filenamePattern, suffix);
  const isDirectTikTokCdn =
    streamSource === 'tiktok_page' ||
    streamSource === 'tiktok_direct' ||
    streamSource === 'video_element';

  if (tabId && isDirectTikTokCdn && (ext === 'mp4' || ext === 'mp3')) {
    try {
      const blobRes = await chrome.tabs.sendMessage(tabId, {
        action: 'blobDownload',
        url: targetUrl,
        filename: filename.replace(/^TikTok-Video-Downloader\//, '')
      });
      if (blobRes?.success) {
        await addToHistory({
          id: media.id,
          downloadId: null,
          title: media.title || 'TikTok Videosu',
          author: media.author,
          cover: media.cover,
          format: chosenFormat,
          filename,
          pageUrl: media.pageUrl,
          timestamp: Date.now()
        });
        return { success: true, downloadId: null, filename, warning };
      }
    } catch {
      // fall through to chrome.downloads.download
    }
  }

  let downloadId;
  try {
    downloadId = await downloadFile(targetUrl, filename, settings.saveAs);
  } catch (err) {
    if (tabId && isDirectTikTokCdn) {
      const blobRes = await chrome.tabs.sendMessage(tabId, {
        action: 'blobDownload',
        url: targetUrl,
        filename: filename.replace(/^TikTok-Video-Downloader\//, '')
      });
      if (blobRes?.success) {
        await addToHistory({
          id: media.id,
          downloadId: null,
          title: media.title || 'TikTok Videosu',
          author: media.author,
          cover: media.cover,
          format: chosenFormat,
          filename,
          pageUrl: media.pageUrl,
          timestamp: Date.now()
        });
        return { success: true, downloadId: null, filename, warning };
      }
    }
    throw err;
  }

  await addToHistory({
    id: media.id,
    downloadId,
    title: media.title || 'TikTok Videosu',
    author: media.author,
    cover: media.cover,
    format: chosenFormat,
    filename,
    pageUrl: media.pageUrl,
    timestamp: Date.now()
  });

  return { success: true, downloadId, filename, warning };
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!verifyBrandIntegrity()) {
    sendResponse({ success: false, error: INTEGRITY_ERROR_MSG });
    return false;
  }

  const tabId = sender?.tab?.id || message.tabId || null;

  if (message.action === 'fetchMediaInfo') {
    resolveTikTokMedia(message.url, tabId)
      .then((media) => sendResponse({ success: true, media }))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true;
  }

  if (message.action === 'downloadFromUrl') {
    (async () => {
      try {
        const media = message.media || (await resolveTikTokMedia(message.url, tabId));
        const result = await performDownload(media, message.format, tabId);
        sendResponse({ ...result, media });
      } catch (err) {
        sendResponse({ success: false, error: err.message });
      }
    })();
    return true;
  }

  if (message.action === 'logGifHistory') {
    (async () => {
      try {
        const media = message.media || {};
        const settings = await getSettings();
        const filename = message.filename || buildFilename(media, 'gif', settings.filenamePattern);
        await addToHistory({
          id: media.id || String(Date.now()),
          downloadId: message.downloadId || null,
          title: media.title || 'TikTok GIF',
          author: media.author || 'tiktok',
          cover: media.cover || (Array.isArray(media.images) ? media.images[0] : ''),
          format: 'gif',
          filename,
          pageUrl: media.pageUrl || '',
          timestamp: Date.now()
        });
        sendResponse({ success: true, filename });
      } catch (err) {
        sendResponse({ success: false, error: err.message });
      }
    })();
    return true;
  }

  if (message.action === 'logZipHistory') {
    (async () => {
      try {
        const media = message.media || {};
        const settings = await getSettings();
        const filename = message.filename || buildFilename(media, 'zip', settings.filenamePattern, '_photos');
        await addToHistory({
          id: media.id || String(Date.now()),
          downloadId: message.downloadId || null,
          title: media.title || 'Photo Slideshow (ZIP)',
          author: media.author || 'tiktok',
          cover: media.cover || (Array.isArray(media.images) ? media.images[0] : ''),
          format: 'zip',
          filename,
          pageUrl: media.pageUrl || '',
          timestamp: Date.now()
        });
        sendResponse({ success: true, filename });
      } catch (err) {
        sendResponse({ success: false, error: err.message });
      }
    })();
    return true;
  }

  if (message.action === 'checkHistory') {
    (async () => {
      try {
        const { history = [] } = await chrome.storage.local.get('history');
        const checked = await Promise.all(
          history.map(async (item) => {
            if (typeof item.downloadId !== 'number') {
              return { ...item, exists: null };
            }
            try {
              const results = await chrome.downloads.search({ id: item.downloadId });
              const found = results && results[0];
              const exists = Boolean(found && found.exists !== false && found.state !== 'interrupted');
              return { ...item, exists };
            } catch {
              return { ...item, exists: false };
            }
          })
        );
        sendResponse({ success: true, history: checked });
      } catch (err) {
        sendResponse({ success: false, error: err.message });
      }
    })();
    return true;
  }

  if (message.action === 'showDownloadInFolder') {
    (async () => {
      try {
        if (typeof message.downloadId !== 'number') {
          sendResponse({ success: false, deleted: true });
          return;
        }
        const results = await chrome.downloads.search({ id: message.downloadId });
        const found = results && results[0];
        if (!found || found.exists === false || found.state === 'interrupted') {
          sendResponse({ success: false, deleted: true });
          return;
        }
        chrome.downloads.show(message.downloadId);
        sendResponse({ success: true });
      } catch {
        sendResponse({ success: false, deleted: true });
      }
    })();
    return true;
  }

  return false;
});
