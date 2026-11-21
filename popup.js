// TikTok Video Downloader Popup Controller — Created by Zodi4c (https://github.com/zodi4ctvn)
// License: Custom Non-Commercial Attribution License (see LICENSE)

const STRINGS = {
  tr: {
    subtitle: 'Filigransız TikTok İndirici',
    tabDownload: 'İndir',
    tabHistory: 'Geçmiş',
    tabSettings: 'Ayarlar',
    urlPlaceholder: 'TikTok video veya fotoğraf linkini yapıştırın...',
    pasteTitle: 'Panodan Yapıştır',
    fetchBtn: 'Getir',
    emptyHint: 'Bir TikTok videosu veya fotoğrafı açıkken eklentiyi açın ya da yukarıya bağlantı yapıştırın.',
    enterUrl: 'Lütfen bir TikTok bağlantısı girin.',
    fetching: 'Medya bilgileri alınıyor...',
    fetchError: 'Medya bilgisi alınamadı',
    clipboardDenied: 'Pano erişimi reddedildi, bağlantıyı elle yapıştırın.',
    noTitle: 'Başlık yok',
    dlHd: 'HD Filigransız İndir',
    dlSd: 'Standart MP4',
    dlMp3: 'Ses (MP3)',
    dlGif: 'GIF İndir',
    dlCover: 'Kapak (JPG)',
    dlPhotos: (n) => `Fotoğrafları İndir (${n} Foto)`,
    dlPhotosZip: (n) => `Fotoğrafları ZIP İndir (${n} Foto)`,
    dlSlidesBtn: (n) => `Slayt (${n} Foto)`,
    dlSlidesZipBtn: (n) => `Slayt ZIP (${n} Foto)`,
    dlLiveBtn: (n) => `Live Photo (${n} MP4)`,
    preparing: 'Hazırlanıyor...',
    gifCreating: 'GIF oluşturuluyor (birkaç saniye sürebilir)...',
    zipCreating: 'Fotoğraflar ZIP olarak paketleniyor...',
    statusMp3: 'Ses dosyası (MP3) hazırlanıyor...',
    statusImages: 'Fotoğraflar indiriliyor...',
    statusLive: 'Live Photo klipleri indiriliyor...',
    statusCover: 'Kapak görseli indiriliyor...',
    statusVideo: 'Uyumlu (H.264) video akışı aranıyor...',
    downloading: (f) => `İndiriliyor: ${f}`,
    downloadError: (m) => `İndirme hatası: ${m}`,
    gifError: (m) => `GIF hatası: ${m}`,
    zipError: (m) => `ZIP hatası: ${m}`,
    errorPrefix: (m) => `Hata: ${m}`,
    sourcePage: 'Sayfa',
    historyTitle: 'Son İndirilenler',
    clearHistory: 'Temizle',
    emptyHistory: 'Henüz indirme geçmişi yok.',
    deletedTag: 'Silindi ×',
    deletedSub: 'Silindi',
    deletedTitle: 'Dosya silinmiş veya taşınmış — listeden kaldırmak için tıkla',
    folderBtn: 'Klasör',
    retryBtn: 'Tekrar',
    injectTitle: "TikTok'ta İndir Butonları",
    injectDesc: 'Videoların ve fotoğrafların üzerinde hızlı indirme butonu göster',
    qualityTitle: 'Varsayılan Kalite',
    qualityDesc: 'Tek tıkla indirmede kullanılacak format',
    qHd: 'HD (Yüksek Bitrate)',
    qSd: 'Akıcı H.264 (Standart)',
    zipTitle: 'Fotoğrafları ZIP İndir',
    zipDesc: 'Slayt fotoğraflarını tek bir .zip dosyasında paketle',
    patternTitle: 'Dosya Adı Formatı',
    patternDesc: 'İndirilen dosyaların adlandırma şekli',
    pAuthor: '@kullanici_id',
    pTitle: 'baslik_id',
    pId: 'sadece_id',
    saveAsTitle: 'Farklı Kaydet Penceresi',
    saveAsDesc: 'Her indirmede kayıt yerini sor',
    kSuffix: 'B'
  },
  en: {
    subtitle: 'Watermark-Free TikTok Downloader',
    tabDownload: 'Download',
    tabHistory: 'History',
    tabSettings: 'Settings',
    urlPlaceholder: 'Paste a TikTok video or photo link...',
    pasteTitle: 'Paste from clipboard',
    fetchBtn: 'Fetch',
    emptyHint: 'Open the extension on a TikTok video/photo tab or paste a link above.',
    enterUrl: 'Please enter a TikTok link.',
    fetching: 'Fetching media info...',
    fetchError: 'Could not fetch media info',
    clipboardDenied: 'Clipboard access denied, please paste the link manually.',
    noTitle: 'No title',
    dlHd: 'Download HD No Watermark',
    dlSd: 'Standard MP4',
    dlMp3: 'Audio (MP3)',
    dlGif: 'Download GIF',
    dlCover: 'Cover (JPG)',
    dlPhotos: (n) => `Download Photos (${n})`,
    dlPhotosZip: (n) => `Download Photos ZIP (${n})`,
    dlSlidesBtn: (n) => `Photos (${n} JPG)`,
    dlSlidesZipBtn: (n) => `Photos ZIP (${n})`,
    dlLiveBtn: (n) => `Live Photos (${n} MP4)`,
    preparing: 'Preparing...',
    gifCreating: 'Creating GIF (may take a few seconds)...',
    zipCreating: 'Packaging photos into ZIP...',
    statusMp3: 'Preparing audio (MP3)...',
    statusImages: 'Downloading photos...',
    statusLive: 'Downloading Live Photo clips...',
    statusCover: 'Downloading cover image...',
    statusVideo: 'Finding compatible H.264 stream...',
    downloading: (f) => `Downloading: ${f}`,
    downloadError: (m) => `Download error: ${m}`,
    gifError: (m) => `GIF error: ${m}`,
    zipError: (m) => `ZIP error: ${m}`,
    errorPrefix: (m) => `Error: ${m}`,
    sourcePage: 'Page',
    historyTitle: 'Recent Downloads',
    clearHistory: 'Clear',
    emptyHistory: 'No download history yet.',
    deletedTag: 'Deleted ×',
    deletedSub: 'Deleted',
    deletedTitle: 'File was deleted or moved — click to remove from list',
    folderBtn: 'Folder',
    retryBtn: 'Retry',
    injectTitle: 'In-Page Download Buttons',
    injectDesc: 'Show quick download buttons on TikTok videos & photos',
    qualityTitle: 'Default Quality',
    qualityDesc: 'Format used for one-click downloads',
    qHd: 'HD (High Bitrate)',
    qSd: 'Smooth H.264 (Standard)',
    zipTitle: 'Download Photos as ZIP',
    zipDesc: 'Bundle slideshow photos into a single .zip file',
    patternTitle: 'Filename Pattern',
    patternDesc: 'Naming format for downloaded files',
    pAuthor: '@author_id',
    pTitle: 'title_id',
    pId: 'id_only',
    saveAsTitle: 'Save As Dialog',
    saveAsDesc: 'Ask where to save every download',
    kSuffix: 'K'
  }
};

const defaultLang = (navigator.language || '').toLowerCase().startsWith('tr') ? 'tr' : 'en';

const urlInput = document.getElementById('url-input');
const pasteBtn = document.getElementById('paste-btn');
const fetchBtn = document.getElementById('fetch-btn');
const statusBox = document.getElementById('status-box');
const previewCard = document.getElementById('preview-card');
const emptyHint = document.getElementById('empty-hint');
const integrityBanner = document.getElementById('integrity-banner');

const langTrBtn = document.getElementById('lang-tr');
const langEnBtn = document.getElementById('lang-en');

const previewCover = document.getElementById('preview-cover');
const previewDuration = document.getElementById('preview-duration');
const previewAuthor = document.getElementById('preview-author');
const previewSource = document.getElementById('preview-source');
const previewTitle = document.getElementById('preview-title');
const previewStats = document.getElementById('preview-stats');

const dlHdBtn = document.getElementById('dl-hd');
const dlHdLabel = document.getElementById('dl-hd-label');
const dlHdTag = document.getElementById('dl-hd-tag');
const dlSdBtn = document.getElementById('dl-sd');
const dlMp3Btn = document.getElementById('dl-mp3');
const dlGifBtn = document.getElementById('dl-gif');
const dlImagesBtn = document.getElementById('dl-images');
const dlLiveBtn = document.getElementById('dl-live');
const dlCoverBtn = document.getElementById('dl-cover');

const historyList = document.getElementById('history-list');
const clearHistoryBtn = document.getElementById('clear-history-btn');

const optInject = document.getElementById('opt-inject');
const optQuality = document.getElementById('opt-quality');
const optZip = document.getElementById('opt-zip');
const optPattern = document.getElementById('opt-pattern');
const optSaveAs = document.getElementById('opt-saveas');

let currentMedia = null;
let activeTabId = null;
let integrityOk = true;
let currentLang = defaultLang;

const INTEGRITY_REPO_URL = 'https://github.com/zodi4ctvn';

function T() {
  return STRINGS[currentLang === 'tr' ? 'tr' : 'en'];
}

function applyLanguage() {
  const s = T();
  document.documentElement.lang = currentLang;
  langTrBtn.classList.toggle('active', currentLang === 'tr');
  langEnBtn.classList.toggle('active', currentLang === 'en');

  document.getElementById('brand-subtitle').textContent = s.subtitle;
  document.getElementById('tab-btn-download').textContent = s.tabDownload;
  document.getElementById('tab-btn-history').textContent = s.tabHistory;
  document.getElementById('tab-btn-settings').textContent = s.tabSettings;

  urlInput.placeholder = s.urlPlaceholder;
  pasteBtn.title = s.pasteTitle;
  fetchBtn.textContent = s.fetchBtn;
  document.getElementById('empty-hint-text').textContent = s.emptyHint;

  dlSdBtn.textContent = s.dlSd;
  dlMp3Btn.textContent = s.dlMp3;
  dlGifBtn.textContent = s.dlGif;
  dlCoverBtn.textContent = s.dlCover;

  document.getElementById('history-title').textContent = s.historyTitle;
  clearHistoryBtn.textContent = s.clearHistory;

  document.getElementById('lbl-inject-title').textContent = s.injectTitle;
  document.getElementById('lbl-inject-desc').textContent = s.injectDesc;
  document.getElementById('lbl-quality-title').textContent = s.qualityTitle;
  document.getElementById('lbl-quality-desc').textContent = s.qualityDesc;
  document.getElementById('opt-q-hd').textContent = s.qHd;
  document.getElementById('opt-q-sd').textContent = s.qSd;
  document.getElementById('lbl-zip-title').textContent = s.zipTitle;
  document.getElementById('lbl-zip-desc').textContent = s.zipDesc;
  document.getElementById('lbl-pattern-title').textContent = s.patternTitle;
  document.getElementById('lbl-pattern-desc').textContent = s.patternDesc;
  document.getElementById('opt-p-author').textContent = s.pAuthor;
  document.getElementById('opt-p-title').textContent = s.pTitle;
  document.getElementById('opt-p-id').textContent = s.pId;
  document.getElementById('lbl-saveas-title').textContent = s.saveAsTitle;
  document.getElementById('lbl-saveas-desc').textContent = s.saveAsDesc;

  if (currentMedia) {
    renderPreview(currentMedia);
  }
  if (document.getElementById('tab-history').classList.contains('active')) {
    renderHistory();
  }
}

function verifyBrandIntegrity() {
  try {
    const manifest = chrome.runtime.getManifest();
    const nameOk = typeof manifest?.name === 'string' && manifest.name.includes('TikTok Video Downloader');
    const authorOk = typeof manifest?.author === 'string' && manifest.author.includes('Zodi4c');
    const descOk = typeof manifest?.description === 'string' && manifest.description.includes('Zodi4c');
    const brandTitleEl = document.getElementById('brand-title');
    const footerEl = document.getElementById('brand-footer');
    const footerLink = footerEl ? footerEl.querySelector('a') : null;
    const brandDomOk =
      Boolean(brandTitleEl && brandTitleEl.textContent.includes('TikTok Video Downloader')) &&
      Boolean(footerEl && footerEl.textContent.includes('Zodi4c')) &&
      Boolean(footerLink && footerLink.href.toLowerCase().includes('github.com/zodi4ctvn'));

    if (!nameOk || !authorOk || !descOk || !brandDomOk) {
      integrityOk = false;
      renderIntegrityError();
      return false;
    }
    return true;
  } catch {
    integrityOk = false;
    renderIntegrityError();
    return false;
  }
}

function renderIntegrityError() {
  console.error(
    `[TikTok Video Downloader Integrity Error] Original "TikTok Video Downloader" name / "Zodi4c" author attribution was modified. Restore it: ${INTEGRITY_REPO_URL}`
  );
  if (integrityBanner) {
    integrityBanner.textContent = '';

    const title = document.createElement('strong');
    title.textContent = 'Atıf Doğrulama Hatası / Attribution Integrity Failed';

    const trLine = document.createElement('p');
    trLine.textContent =
      '[TR] Orijinal "TikTok Video Downloader" adı veya "Zodi4c" yazar bilgisi değiştirilmiş. Eklentiyi kullanmak için lütfen orijinal adı ve atfı geri yükleyin.';

    const enLine = document.createElement('p');
    enLine.textContent =
      '[EN] The original "TikTok Video Downloader" name or "Zodi4c" author credit was modified. Please restore the original name and attribution to continue.';

    const link = document.createElement('a');
    link.href = INTEGRITY_REPO_URL;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = INTEGRITY_REPO_URL;

    integrityBanner.appendChild(title);
    integrityBanner.appendChild(trLine);
    integrityBanner.appendChild(enLine);
    integrityBanner.appendChild(link);
    integrityBanner.classList.remove('hidden');
  }

  [
    urlInput,
    pasteBtn,
    fetchBtn,
    dlHdBtn,
    dlSdBtn,
    dlMp3Btn,
    dlGifBtn,
    dlImagesBtn,
    dlLiveBtn,
    dlCoverBtn,
    clearHistoryBtn,
    optInject,
    optQuality,
    optZip,
    optPattern,
    optSaveAs,
    langTrBtn,
    langEnBtn
  ].forEach((el) => {
    if (el) el.disabled = true;
  });
}

function formatCount(n) {
  if (!n) return '0';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + T().kSuffix;
  return String(n);
}

function formatDuration(sec) {
  if (!sec || sec <= 0) return '';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function showStatus(msg, type = 'info') {
  statusBox.textContent = msg;
  statusBox.className = `status-box ${type}`;
  statusBox.classList.remove('hidden');
}

function hideStatus() {
  statusBox.classList.add('hidden');
}

function getSourceLabel(source) {
  switch (source) {
    case 'tikwm':
      return 'TikWM API';
    case 'tiklydown':
      return 'TiklyDown API';
    default:
      return T().sourcePage;
  }
}

function getDownloadStatusMessage(format) {
  const s = T();
  switch (format) {
    case 'mp3':
      return s.statusMp3;
    case 'images':
      return s.statusImages;
    case 'live_photos':
      return s.statusLive;
    case 'cover':
      return s.statusCover;
    default:
      return s.statusVideo;
  }
}

// Tabs
document.querySelectorAll('.tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach((p) => p.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(`tab-${tab.dataset.tab}`).classList.add('active');
    if (tab.dataset.tab === 'history') {
      renderHistory();
    }
  });
});

async function fetchMedia(url) {
  if (!integrityOk) return;
  const s = T();
  const clean = (url || '').trim();
  if (!clean) {
    showStatus(s.enterUrl, 'error');
    return;
  }

  fetchBtn.disabled = true;
  fetchBtn.textContent = '...';
  showStatus(s.fetching, 'info');
  previewCard.classList.add('hidden');
  emptyHint.classList.add('hidden');

  try {
    const resp = await chrome.runtime.sendMessage({
      action: 'fetchMediaInfo',
      url: clean,
      tabId: activeTabId
    });

    if (!resp || !resp.success || !resp.media) {
      throw new Error(resp?.error || s.fetchError);
    }

    currentMedia = resp.media;
    renderPreview(currentMedia);
    hideStatus();
  } catch (err) {
    showStatus(s.errorPrefix(err.message), 'error');
    emptyHint.classList.remove('hidden');
  } finally {
    fetchBtn.disabled = false;
    fetchBtn.textContent = T().fetchBtn;
  }
}

function safeImageSrc(url, fallback) {
  if (typeof url === 'string' && /^https:\/\//i.test(url.trim())) {
    return url.trim();
  }
  return fallback;
}

function renderPreview(media) {
  const s = T();
  previewCover.src = safeImageSrc(media.cover || media.images?.[0], 'icons/icon128.png');
  const dur = formatDuration(media.duration);
  previewDuration.textContent = dur;
  previewDuration.style.display = dur ? 'block' : 'none';

  previewAuthor.textContent = `@${media.author || 'tiktok'}`;
  previewSource.textContent = getSourceLabel(media.source);
  previewTitle.textContent = media.title || s.noTitle;

  previewStats.textContent = '';
  const statItems = [
    `▶ ${formatCount(media.stats?.plays)}`,
    `♥ ${formatCount(media.stats?.likes)}`,
    `💬 ${formatCount(media.stats?.comments)}`
  ];
  for (const text of statItems) {
    const span = document.createElement('span');
    span.textContent = text;
    previewStats.appendChild(span);
  }

  const imagesCount = Array.isArray(media.images) ? media.images.length : 0;
  const liveCount = Array.isArray(media.livePhotos) ? media.livePhotos.length : 0;
  const isPhotoPost = Boolean(media.isPhotoPost || imagesCount > 0 || liveCount > 0);
  const useZip = Boolean(optZip.checked);

  if (isPhotoPost) {
    const totalCount = imagesCount || liveCount;
    dlHdLabel.textContent = useZip ? s.dlPhotosZip(totalCount) : s.dlPhotos(totalCount);
    dlHdTag.textContent = useZip ? 'ZIP' : 'JPG';
    dlHdBtn.disabled = totalCount === 0;
    dlSdBtn.classList.add('hidden');
    dlImagesBtn.classList.remove('hidden');
    dlImagesBtn.textContent = useZip ? s.dlSlidesBtn(imagesCount) : s.dlSlidesZipBtn(imagesCount);
    dlImagesBtn.disabled = imagesCount === 0;
  } else {
    dlHdLabel.textContent = s.dlHd;
    dlHdTag.textContent = 'MP4';
    dlHdBtn.disabled = !media.hdUrl && !media.sdUrl;
    dlSdBtn.classList.remove('hidden');
    dlSdBtn.disabled = !media.sdUrl && !media.hdUrl;
    dlImagesBtn.classList.add('hidden');
  }

  dlLiveBtn.classList.toggle('hidden', liveCount === 0);
  if (liveCount > 0) {
    dlLiveBtn.textContent = s.dlLiveBtn(liveCount);
    dlLiveBtn.disabled = false;
  }

  dlMp3Btn.disabled = !media.musicUrl;
  dlGifBtn.disabled = !media.sdUrl && !media.hdUrl && imagesCount === 0;
  dlCoverBtn.disabled = !media.cover && imagesCount === 0;

  previewCard.classList.remove('hidden');
}

async function downloadPhotosAsZip(btn) {
  if (!integrityOk || !currentMedia) return;
  const s = T();
  const origHtml = btn.innerHTML;
  btn.disabled = true;
  btn.textContent = s.preparing;
  showStatus(s.zipCreating, 'info');

  try {
    const { settings = {} } = await chrome.storage.local.get('settings');
    const pattern = settings.filenamePattern || '{author}_{id}';
    const saveAs = Boolean(settings.saveAs);

    const zipBlob = await window.TikTokZipBuilder.createSlideshowZip(currentMedia);
    const blobUrl = URL.createObjectURL(zipBlob);
    const fname = window.TikTokZipBuilder.buildZipFilename(currentMedia, pattern);
    const downloadId = await chrome.downloads.download({
      url: blobUrl,
      filename: fname,
      saveAs,
      conflictAction: 'uniquify'
    });
    setTimeout(() => URL.revokeObjectURL(blobUrl), 15000);

    await chrome.runtime.sendMessage({
      action: 'logZipHistory',
      media: currentMedia,
      filename: fname,
      downloadId
    });

    showStatus(s.downloading(fname), 'success');
  } catch (err) {
    showStatus(s.zipError(err.message), 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = origHtml;
  }
}

async function startDownload(format, btn) {
  if (!integrityOk || !currentMedia) return;
  const s = T();
  const origText = btn.innerHTML;
  btn.disabled = true;
  showStatus(getDownloadStatusMessage(format), 'info');

  try {
    const resp = await chrome.runtime.sendMessage({
      action: 'downloadFromUrl',
      media: currentMedia,
      format,
      tabId: activeTabId
    });

    if (!resp || !resp.success) {
      throw new Error(resp?.error || s.fetchError);
    }

    showStatus(
      resp.warning ? `${s.downloading(resp.filename)} — ⚠ ${resp.warning}` : s.downloading(resp.filename),
      resp.warning ? 'error' : 'success'
    );
  } catch (err) {
    showStatus(s.downloadError(err.message), 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = origText;
  }
}

fetchBtn.addEventListener('click', () => fetchMedia(urlInput.value));
urlInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') fetchMedia(urlInput.value);
});

pasteBtn.addEventListener('click', async () => {
  if (!integrityOk) return;
  try {
    const text = await navigator.clipboard.readText();
    if (text) {
      urlInput.value = text.trim();
      fetchMedia(urlInput.value);
    }
  } catch {
    showStatus(T().clipboardDenied, 'error');
  }
});

dlHdBtn.addEventListener('click', () => {
  if (!currentMedia) return;
  const isPhotoPost = Boolean(currentMedia.isPhotoPost || currentMedia.images?.length > 0 || currentMedia.livePhotos?.length > 0);
  if (isPhotoPost) {
    if (optZip.checked) {
      downloadPhotosAsZip(dlHdBtn);
    } else {
      startDownload('images', dlHdBtn);
    }
    return;
  }
  startDownload('hd', dlHdBtn);
});

dlSdBtn.addEventListener('click', () => startDownload('sd', dlSdBtn));
dlMp3Btn.addEventListener('click', () => startDownload('mp3', dlMp3Btn));
dlLiveBtn.addEventListener('click', () => startDownload('live_photos', dlLiveBtn));

dlImagesBtn.addEventListener('click', () => {
  if (optZip.checked) {
    startDownload('images', dlImagesBtn);
  } else {
    downloadPhotosAsZip(dlImagesBtn);
  }
});

dlGifBtn.addEventListener('click', async () => {
  if (!integrityOk || !currentMedia) return;
  const s = T();
  const orig = dlGifBtn.innerHTML;
  dlGifBtn.disabled = true;
  dlGifBtn.textContent = s.preparing;
  showStatus(s.gifCreating, 'info');
  try {
    const { settings = {} } = await chrome.storage.local.get('settings');
    const pattern = settings.filenamePattern || '{author}_{id}';
    const saveAs = Boolean(settings.saveAs);

    const gifBlob = await window.TikTokDownloaderGif.createFromMedia(currentMedia);
    const blobUrl = URL.createObjectURL(gifBlob);
    const fname = window.TikTokDownloaderGif.buildGifFilename(currentMedia, pattern);
    const downloadId = await chrome.downloads.download({
      url: blobUrl,
      filename: fname,
      saveAs,
      conflictAction: 'uniquify'
    });
    setTimeout(() => URL.revokeObjectURL(blobUrl), 15000);

    await chrome.runtime.sendMessage({
      action: 'logGifHistory',
      media: currentMedia,
      filename: fname,
      downloadId
    });

    showStatus(s.downloading(fname), 'success');
  } catch (err) {
    showStatus(s.gifError(err.message), 'error');
  } finally {
    dlGifBtn.disabled = false;
    dlGifBtn.innerHTML = orig;
  }
});

dlCoverBtn.addEventListener('click', () => startDownload('cover', dlCoverBtn));

// History
async function removeHistoryItem(target) {
  const { history = [] } = await chrome.storage.local.get('history');
  const next = history.filter(
    (h) => !(h.timestamp === target.timestamp && h.id === target.id && h.downloadId === target.downloadId)
  );
  await chrome.storage.local.set({ history: next });
  renderHistory();
}

async function renderHistory() {
  const s = T();
  let history = [];
  try {
    const resp = await chrome.runtime.sendMessage({ action: 'checkHistory' });
    if (resp && resp.success && Array.isArray(resp.history)) {
      history = resp.history;
    } else {
      const stored = await chrome.storage.local.get('history');
      history = stored.history || [];
    }
  } catch {
    const stored = await chrome.storage.local.get('history');
    history = stored.history || [];
  }

  historyList.textContent = '';

  if (history.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'empty-hint';
    empty.textContent = s.emptyHistory;
    historyList.appendChild(empty);
    return;
  }

  const locale = currentLang === 'tr' ? 'tr-TR' : 'en-US';
  for (const item of history) {
    const isDeleted = item.exists === false;
    const el = document.createElement('div');
    el.className = 'history-item' + (isDeleted ? ' is-deleted' : '');

    const thumb = document.createElement('img');
    thumb.className = 'history-thumb';
    thumb.src = safeImageSrc(item.cover, 'icons/icon48.png');

    const info = document.createElement('div');
    info.className = 'history-info';

    const title = document.createElement('div');
    title.className = 'history-title';
    title.textContent = item.title || `@${item.author}`;

    const sub = document.createElement('div');
    sub.className = 'history-sub';
    const dateStr = new Date(item.timestamp).toLocaleTimeString(locale, {
      hour: '2-digit',
      minute: '2-digit'
    });
    const baseSub = `@${item.author} • ${(item.format || 'hd').toUpperCase()} • ${dateStr}`;
    sub.textContent = isDeleted ? `${baseSub} • ${s.deletedSub}` : baseSub;

    info.appendChild(title);
    info.appendChild(sub);

    const makeDeletedBtn = () => {
      const delBtn = document.createElement('button');
      delBtn.className = 'history-btn deleted-tag';
      delBtn.textContent = s.deletedTag;
      delBtn.title = s.deletedTitle;
      delBtn.addEventListener('click', () => removeHistoryItem(item));
      return delBtn;
    };

    let actionBtn;
    if (isDeleted) {
      actionBtn = makeDeletedBtn();
    } else if (typeof item.downloadId === 'number') {
      actionBtn = document.createElement('button');
      actionBtn.className = 'history-btn';
      actionBtn.textContent = s.folderBtn;
      actionBtn.addEventListener('click', async () => {
        try {
          const resp = await chrome.runtime.sendMessage({
            action: 'showDownloadInFolder',
            downloadId: item.downloadId
          });
          if (!resp || !resp.success) {
            el.classList.add('is-deleted');
            sub.textContent = `${baseSub} • ${s.deletedSub}`;
            actionBtn.replaceWith(makeDeletedBtn());
          }
        } catch {
          // ignore
        }
      });
    } else {
      actionBtn = document.createElement('button');
      actionBtn.className = 'history-btn';
      actionBtn.textContent = s.retryBtn;
      actionBtn.addEventListener('click', () => {
        if (item.pageUrl) {
          urlInput.value = item.pageUrl;
          document.querySelector('.tab[data-tab="download"]').click();
          fetchMedia(item.pageUrl);
        }
      });
    }

    el.appendChild(thumb);
    el.appendChild(info);
    el.appendChild(actionBtn);
    historyList.appendChild(el);
  }
}

clearHistoryBtn.addEventListener('click', async () => {
  await chrome.storage.local.set({ history: [] });
  renderHistory();
});

// Settings
async function loadSettings() {
  const { settings = {} } = await chrome.storage.local.get('settings');
  optInject.checked = settings.injectButtons !== false;
  optQuality.value = settings.quality || 'hd';
  optZip.checked = Boolean(settings.photosAsZip);
  optPattern.value = settings.filenamePattern || '{author}_{id}';
  optSaveAs.checked = Boolean(settings.saveAs);
  currentLang = settings.lang === 'tr' || settings.lang === 'en' ? settings.lang : defaultLang;
  applyLanguage();
}

async function saveSettings() {
  const settings = {
    injectButtons: optInject.checked,
    quality: optQuality.value,
    photosAsZip: optZip.checked,
    filenamePattern: optPattern.value,
    saveAs: optSaveAs.checked,
    lang: currentLang
  };
  await chrome.storage.local.set({ settings });
  if (currentMedia) renderPreview(currentMedia);
}

[optInject, optQuality, optZip, optPattern, optSaveAs].forEach((el) => {
  el.addEventListener('change', saveSettings);
});

langTrBtn.addEventListener('click', () => {
  if (!integrityOk || currentLang === 'tr') return;
  currentLang = 'tr';
  applyLanguage();
  saveSettings();
});

langEnBtn.addEventListener('click', () => {
  if (!integrityOk || currentLang === 'en') return;
  currentLang = 'en';
  applyLanguage();
  saveSettings();
});

// Init
(async () => {
  if (!verifyBrandIntegrity()) return;
  await loadSettings();
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
      activeTabId = tab.id;
      if (tab.url && /tiktok\.com\/@.+\/(video|photo)\/\d+/i.test(tab.url)) {
        const cleanUrl = tab.url.split('?')[0];
        urlInput.value = cleanUrl;
        fetchMedia(cleanUrl);
      }
    }
  } catch {
    // ignore tab query errors
  }
})();
