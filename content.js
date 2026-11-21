// TikTok Video Downloader Content Script — Created by Zodi4c (https://github.com/zodi4ctvn)
// License: Custom Non-Commercial Attribution License (see LICENSE)

(() => {
  if (window.__ttvdInitialized) return;
  window.__ttvdInitialized = true;

  const INTEGRITY_REPO_URL = 'https://github.com/zodi4ctvn';
  const INTEGRITY_ERROR_MSG =
    '[TR] TikTok Video Downloader marka/atıf doğrulaması başarısız! Orijinal "TikTok Video Downloader" adı ve "Zodi4c" yazar bilgisi korunmalıdır. ' +
    `Geri yüklemek için: ${INTEGRITY_REPO_URL} | ` +
    '[EN] TikTok Video Downloader attribution integrity check failed! Restore the original "TikTok Video Downloader" name and "Zodi4c" author credit: ' +
    INTEGRITY_REPO_URL;

  let domObserver = null;
  let scanInterval = null;

  function teardownOnInvalidContext() {
    if (scanInterval) {
      clearInterval(scanInterval);
      scanInterval = null;
    }
    if (domObserver) {
      domObserver.disconnect();
      domObserver = null;
    }
  }

  function verifyBrandIntegrity() {
    if (typeof chrome === 'undefined' || !chrome.runtime?.id) {
      teardownOnInvalidContext();
      return false;
    }
    try {
      const manifest = chrome.runtime.getManifest();
      const nameOk = typeof manifest?.name === 'string' && manifest.name.includes('TikTok Video Downloader');
      const authorOk = typeof manifest?.author === 'string' && manifest.author.includes('Zodi4c');
      const descOk = typeof manifest?.description === 'string' && manifest.description.includes('Zodi4c');
      if (!nameOk || !authorOk || !descOk) {
        console.error(INTEGRITY_ERROR_MSG);
        const showBlockNotice = () => {
          if (!document.body || document.getElementById('ttvd-integrity-toast')) return;
          let container = document.getElementById('ttvd-toast-container');
          if (!container) {
            container = document.createElement('div');
            container.id = 'ttvd-toast-container';
            document.body.appendChild(container);
          }
          const toast = document.createElement('div');
          toast.id = 'ttvd-integrity-toast';
          toast.className = 'ttvd-toast error';
          toast.textContent = INTEGRITY_ERROR_MSG;
          container.appendChild(toast);
        };
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', showBlockNotice, { once: true });
        } else {
          showBlockNotice();
        }
        return false;
      }
      return true;
    } catch (err) {
      if (!chrome?.runtime?.id || String(err?.message || '').includes('Extension context invalidated')) {
        teardownOnInvalidContext();
        return false;
      }
      console.error(INTEGRITY_ERROR_MSG);
      return false;
    }
  }

  if (!verifyBrandIntegrity()) {
    return;
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

  function isAllowedMediaUrl(rawUrl) {
    if (!rawUrl || typeof rawUrl !== 'string') return false;
    try {
      const parsed = new URL(rawUrl.trim());
      if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return false;
      const host = parsed.hostname.toLowerCase();
      return (
        /(^|\.)tiktok\.com$/.test(host) ||
        host.includes('tiktokcdn') ||
        host.includes('muscdn') ||
        host.includes('ibyteimg') ||
        host.includes('byteimg') ||
        /(^|\.)tikwm\.com$/.test(host)
      );
    } catch {
      return false;
    }
  }

  const DOWNLOAD_SVG = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 3v12"/>
      <path d="M7 10l5 5 5-5"/>
      <path d="M5 20h14"/>
    </svg>
  `;

  const SMALL_DOWNLOAD_SVG = `
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 3v12"/>
      <path d="M7 10l5 5 5-5"/>
      <path d="M5 20h14"/>
    </svg>
  `;

  const CHEVRON_SVG = `
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M6 9l6 6 6-6"/>
    </svg>
  `;

  const CHECK_SVG = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
      <path d="M20 6L9 17l-5-5"/>
    </svg>
  `;

  const STRINGS = {
    tr: {
      download: 'İndir',
      downloadNoWm: 'Filigransız İndir',
      actionTip: 'Filigransız İndir (Sağ tık: Format seç)',
      moreTip: 'Format Seç (MP4 / Fotoğraf / ZIP / GIF / MP3)',
      menuHd: 'HD Kalite',
      menuSd: 'Akıcı (H.264)',
      menuPhotos: 'Fotoğraflar (JPG)',
      menuZip: 'Fotoğraflar (ZIP)',
      menuLive: 'Live Photo',
      menuGif: 'GIF Olarak İndir',
      menuMp3: 'Sadece Ses',
      menuCover: 'Kapak Fotoğrafı',
      statusGif: 'GIF oluşturuluyor (birkaç saniye sürebilir)...',
      statusZip: 'Fotoğraflar ZIP olarak paketleniyor...',
      statusMp3: 'Ses dosyası (MP3) hazırlanıyor...',
      statusImages: 'Fotoğraflar indiriliyor...',
      statusLive: 'Live Photo klipleri indiriliyor...',
      statusCover: 'Kapak fotoğrafı indiriliyor...',
      statusVideo: 'Uyumlu (H.264) video akışı aranıyor...',
      invalidUrl: 'Geçerli bir TikTok bağlantısı algılanamadı.',
      mediaErr: 'Medya bilgisi alınamadı',
      gifDone: 'GIF indirildi!',
      zipDone: 'Fotoğraflar ZIP olarak indirildi!',
      dlStarted: 'İndirme başlatıldı! (TikTok-Video-Downloader klasörü)',
      dlFailed: 'İndirme başarısız',
      errPrefix: (m) => `Hata: ${m}`
    },
    en: {
      download: 'Download',
      downloadNoWm: 'Download No WM',
      actionTip: 'Download No Watermark (Right-click: Pick format)',
      moreTip: 'Pick Format (MP4 / Photos / ZIP / GIF / MP3)',
      menuHd: 'HD Quality',
      menuSd: 'Smooth (H.264)',
      menuPhotos: 'Photos (JPG)',
      menuZip: 'Photos (ZIP)',
      menuLive: 'Live Photo',
      menuGif: 'Download as GIF',
      menuMp3: 'Audio Only',
      menuCover: 'Cover Image',
      statusGif: 'Creating GIF (may take a few seconds)...',
      statusZip: 'Packaging photos into ZIP...',
      statusMp3: 'Preparing audio (MP3)...',
      statusImages: 'Downloading photos...',
      statusLive: 'Downloading Live Photo clips...',
      statusCover: 'Downloading cover image...',
      statusVideo: 'Finding compatible H.264 stream...',
      invalidUrl: 'Could not detect a valid TikTok link.',
      mediaErr: 'Could not fetch media info',
      gifDone: 'GIF downloaded!',
      zipDone: 'Photos downloaded as ZIP!',
      dlStarted: 'Download started! (TikTok-Video-Downloader folder)',
      dlFailed: 'Download failed',
      errPrefix: (m) => `Error: ${m}`
    }
  };

  const defaultLang = (navigator.language || '').toLowerCase().startsWith('tr') ? 'tr' : 'en';
  let currentLang = defaultLang;
  let injectEnabled = true;
  let defaultQuality = 'hd';
  let photosAsZip = false;
  let filenamePattern = '{author}_{id}';
  let scanTimer = null;

  function T() {
    return STRINGS[currentLang === 'tr' ? 'tr' : 'en'];
  }

  async function loadSettings() {
    try {
      const { settings } = await chrome.storage.local.get('settings');
      injectEnabled = settings?.injectButtons !== false;
      defaultQuality = settings?.quality || 'hd';
      photosAsZip = Boolean(settings?.photosAsZip);
      filenamePattern = settings?.filenamePattern || '{author}_{id}';
      currentLang = settings?.lang === 'tr' || settings?.lang === 'en' ? settings.lang : defaultLang;
    } catch {
      injectEnabled = true;
      defaultQuality = 'hd';
      photosAsZip = false;
      filenamePattern = '{author}_{id}';
      currentLang = defaultLang;
    }
  }

  if (typeof chrome !== 'undefined' && chrome.storage?.onChanged) {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'local' && changes.settings) {
        const next = changes.settings.newValue || {};
        const prevLang = currentLang;
        injectEnabled = next.injectButtons !== false;
        defaultQuality = next.quality || 'hd';
        photosAsZip = Boolean(next.photosAsZip);
        filenamePattern = next.filenamePattern || '{author}_{id}';
        currentLang = next.lang === 'tr' || next.lang === 'en' ? next.lang : defaultLang;
        if (!injectEnabled) {
          removeAllButtons();
        } else if (prevLang !== currentLang) {
          removeAllButtons();
          scanAndInject();
        } else {
          scanAndInject();
        }
      }
    });
  }

  function showToast(message, type = 'info') {
    let container = document.getElementById('ttvd-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'ttvd-toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `ttvd-toast ${type}`;
    const dotColor = type === 'success' ? '#10b981' : type === 'error' ? '#fe2c55' : '#25f4ee';
    const dot = document.createElement('span');
    dot.style.cssText = `width:8px;height:8px;border-radius:50%;background:${dotColor};flex-shrink:0;`;
    const msgSpan = document.createElement('span');
    msgSpan.textContent = message;
    toast.appendChild(dot);
    toast.appendChild(msgSpan);
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.25s ease';
      setTimeout(() => toast.remove(), 260);
    }, type === 'error' ? 8000 : 3400);
  }

  function findVideoUrlForElement(root) {
    if (!root) return null;

    const isGridCard = root.matches?.(
      '[data-e2e="user-post-item"], [data-e2e="search_video-item"], [data-e2e="user-liked-item"], [data-e2e="favorites-item"], [data-e2e="collection-item"]'
    );

    if (isGridCard) {
      const cardLink =
        root.querySelector('a[href*="/video/"], a[href*="/photo/"]') ||
        root.closest('a[href*="/video/"], a[href*="/photo/"]');
      if (cardLink && cardLink.href) {
        return cardLink.href.split('?')[0];
      }
    }

    if (/\/@[^/]+\/(video|photo)\/\d+/.test(window.location.pathname)) {
      return window.location.href.split('?')[0];
    }

    const xgEl = root.querySelector('[id*="xgwrapper-"], [id^="video-"]') ||
      (root.id && /(\d{16,22})/.test(root.id) ? root : null);
    const xgMatch = xgEl?.id?.match(/(\d{16,22})/);
    if (xgMatch) {
      const vidId = xgMatch[1];
      const exactLink = root.querySelector(`a[href*="/${vidId}"]`);
      if (exactLink && exactLink.href) {
        return exactLink.href.split('?')[0];
      }
      const authorLink = root.querySelector('a[href^="/@"]');
      const authorMatch = authorLink?.getAttribute('href')?.match(/^\/(@[^/?#]+)/);
      const user = authorMatch ? authorMatch[1] : '@tiktok';
      return `https://www.tiktok.com/${user}/video/${vidId}`;
    }

    const link = root.querySelector('a[href*="/video/"], a[href*="/photo/"]');
    if (link && link.href) {
      return link.href.split('?')[0];
    }

    const selfAnchor = root.closest('a[href*="/video/"], a[href*="/photo/"]');
    if (selfAnchor && selfAnchor.href) {
      return selfAnchor.href.split('?')[0];
    }

    return null;
  }

  function createDropdown(onSelect) {
    const s = T();
    const menu = document.createElement('div');
    menu.className = 'ttvd-dropdown';
    const items = [
      { format: 'hd', label: s.menuHd, badge: 'MP4', cls: '' },
      { format: 'sd', label: s.menuSd, badge: 'MP4', cls: '' },
      { format: 'images', label: s.menuPhotos, badge: 'JPG', cls: '' },
      { format: 'zip', label: s.menuZip, badge: 'ZIP', cls: '' },
      { format: 'live_photos', label: s.menuLive, badge: 'LIVE', cls: 'pink' },
      { format: 'gif', label: s.menuGif, badge: 'GIF', cls: 'pink' },
      { format: 'mp3', label: s.menuMp3, badge: 'MP3', cls: 'pink' },
      { format: 'cover', label: s.menuCover, badge: 'JPG', cls: '' }
    ];

    for (const item of items) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'ttvd-dropdown-item';
      const labelSpan = document.createElement('span');
      labelSpan.textContent = item.label;
      const badgeSpan = document.createElement('span');
      badgeSpan.className = `ttvd-badge ${item.cls}`.trim();
      badgeSpan.textContent = item.badge;
      btn.appendChild(labelSpan);
      btn.appendChild(badgeSpan);
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        menu.classList.remove('ttvd-open');
        onSelect(item.format);
      });
      menu.appendChild(btn);
    }

    return menu;
  }

  function getStatusMessageForFormat(format) {
    const s = T();
    switch (format) {
      case 'gif':
        return s.statusGif;
      case 'zip':
        return s.statusZip;
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

  async function triggerDownload(urlResolver, format, btnEl, originalHtml) {
    if (!verifyBrandIntegrity()) {
      showToast(INTEGRITY_ERROR_MSG, 'error');
      return;
    }

    const s = T();
    const url = typeof urlResolver === 'function' ? urlResolver() : urlResolver;
    if (!url || !isAllowedTikTokUrl(url)) {
      showToast(s.invalidUrl, 'error');
      return;
    }

    const isPhotoUrl = /\/photo\/\d+/i.test(url);
    let chosenFormat = format || defaultQuality;
    if (!format && isPhotoUrl && photosAsZip) {
      chosenFormat = 'zip';
    }

    btnEl.classList.add('ttvd-loading');
    btnEl.innerHTML = '<div class="ttvd-spinner"></div>';
    const isGif = chosenFormat === 'gif';
    const isZip = chosenFormat === 'zip';
    showToast(getStatusMessageForFormat(chosenFormat), 'info');

    try {
      if (isGif) {
        const info = await chrome.runtime.sendMessage({ action: 'fetchMediaInfo', url });
        if (!info?.success || !info.media) {
          throw new Error(info?.error || s.mediaErr);
        }
        const gifBlob = await window.TikTokDownloaderGif.createFromMedia(info.media);
        const fullFilename = window.TikTokDownloaderGif.buildGifFilename(info.media, filenamePattern);
        const blobUrl = URL.createObjectURL(gifBlob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = fullFilename.replace(/^TikTok-Video-Downloader\//, '');
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);

        await chrome.runtime.sendMessage({
          action: 'logGifHistory',
          media: info.media,
          filename: fullFilename
        });

        btnEl.classList.remove('ttvd-loading');
        btnEl.classList.add('ttvd-done');
        btnEl.innerHTML = CHECK_SVG;
        showToast(s.gifDone, 'success');
        setTimeout(() => {
          btnEl.classList.remove('ttvd-done');
          btnEl.innerHTML = originalHtml;
        }, 2200);
        return;
      }

      if (isZip || (photosAsZip && chosenFormat === 'images')) {
        const info = await chrome.runtime.sendMessage({ action: 'fetchMediaInfo', url });
        if (!info?.success || !info.media) {
          throw new Error(info?.error || s.mediaErr);
        }
        const zipBlob = await window.TikTokZipBuilder.createSlideshowZip(info.media);
        const fullFilename = window.TikTokZipBuilder.buildZipFilename(info.media, filenamePattern);
        const blobUrl = URL.createObjectURL(zipBlob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = fullFilename.replace(/^TikTok-Video-Downloader\//, '');
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);

        await chrome.runtime.sendMessage({
          action: 'logZipHistory',
          media: info.media,
          filename: fullFilename
        });

        btnEl.classList.remove('ttvd-loading');
        btnEl.classList.add('ttvd-done');
        btnEl.innerHTML = CHECK_SVG;
        showToast(s.zipDone, 'success');
        setTimeout(() => {
          btnEl.classList.remove('ttvd-done');
          btnEl.innerHTML = originalHtml;
        }, 2200);
        return;
      }

      const resp = await chrome.runtime.sendMessage({
        action: 'downloadFromUrl',
        url,
        format: chosenFormat
      });

      if (resp && resp.success) {
        btnEl.classList.remove('ttvd-loading');
        btnEl.classList.add('ttvd-done');
        btnEl.innerHTML = CHECK_SVG;
        showToast(s.dlStarted, 'success');
        if (resp.warning) showToast(resp.warning, 'error');
        setTimeout(() => {
          btnEl.classList.remove('ttvd-done');
          btnEl.innerHTML = originalHtml;
        }, 2200);
      } else {
        throw new Error(resp?.error || s.dlFailed);
      }
    } catch (err) {
      btnEl.classList.remove('ttvd-loading');
      btnEl.innerHTML = originalHtml;
      showToast(s.errPrefix(err.message), 'error');
    }
  }

  function closeAllDropdowns(except = null) {
    document.querySelectorAll('.ttvd-dropdown.ttvd-open').forEach((el) => {
      if (el !== except) {
        el.classList.remove('ttvd-open');
      }
    });
    document.querySelectorAll('.ttvd-floating-wrap.ttvd-menu-open').forEach((w) => {
      if (!except || w !== except._anchorWrap) {
        w.classList.remove('ttvd-menu-open');
      }
    });
  }

  function openDropdownAt(dropdown, anchorEl, preferLeft = false, anchorWrap = null) {
    if (!dropdown.parentElement || dropdown.parentElement !== document.body) {
      document.body.appendChild(dropdown);
    }
    dropdown._anchorWrap = anchorWrap;
    dropdown.style.visibility = 'hidden';
    dropdown.classList.add('ttvd-open');

    const rect = anchorEl.getBoundingClientRect();
    const menuW = dropdown.offsetWidth || 190;
    const menuH = dropdown.offsetHeight || 240;
    const margin = 10;

    let left;
    let top;

    if (preferLeft) {
      left = rect.left - menuW - 10;
      if (left < margin) left = rect.right + 10;
      top = rect.bottom - menuH;
      if (top < margin) top = Math.min(rect.top, window.innerHeight - menuH - margin);
    } else {
      left = rect.right - menuW;
      if (left < margin) left = Math.max(margin, rect.left);
      if (left + menuW > window.innerWidth - margin) {
        left = window.innerWidth - menuW - margin;
      }
      top = rect.bottom + 6;
      if (top + menuH > window.innerHeight - margin) {
        top = rect.top - menuH - 6;
      }
    }

    top = Math.max(margin, Math.min(top, window.innerHeight - menuH - margin));
    left = Math.max(margin, Math.min(left, window.innerWidth - menuW - margin));

    dropdown.style.left = `${Math.round(left)}px`;
    dropdown.style.top = `${Math.round(top)}px`;
    dropdown.style.visibility = 'visible';
    if (anchorWrap) anchorWrap.classList.add('ttvd-menu-open');
  }

  function injectActionBarButton(actionBar, container) {
    if (actionBar.querySelector('.ttvd-action-wrap')) return;
    const s = T();

    const wrap = document.createElement('div');
    wrap.className = 'ttvd-action-wrap';

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ttvd-action-btn';
    btn.title = s.actionTip;
    btn.innerHTML = DOWNLOAD_SVG;

    const moreDot = document.createElement('button');
    moreDot.type = 'button';
    moreDot.className = 'ttvd-action-more';
    moreDot.title = s.moreTip;
    moreDot.innerHTML = CHEVRON_SVG;

    const label = document.createElement('span');
    label.className = 'ttvd-action-label';
    label.textContent = s.download;

    const dropdown = createDropdown((format) => {
      triggerDownload(() => findVideoUrlForElement(container), format, btn, DOWNLOAD_SVG);
    });

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      closeAllDropdowns();
      triggerDownload(() => findVideoUrlForElement(container), null, btn, DOWNLOAD_SVG);
    });

    const toggleMenu = (e) => {
      e.preventDefault();
      e.stopPropagation();
      const wasOpen = dropdown.classList.contains('ttvd-open');
      closeAllDropdowns(dropdown);
      if (wasOpen) {
        dropdown.classList.remove('ttvd-open');
      } else {
        openDropdownAt(dropdown, btn, true, null);
      }
    };

    moreDot.addEventListener('click', toggleMenu);
    btn.addEventListener('contextmenu', toggleMenu);

    const btnBox = document.createElement('div');
    btnBox.className = 'ttvd-action-btn-box';
    btnBox.appendChild(btn);
    btnBox.appendChild(moreDot);

    wrap.appendChild(btnBox);
    wrap.appendChild(label);
    actionBar.appendChild(wrap);
  }

  function injectFloatingButton(targetEl, container, compact = false, videoEl = null) {
    if (!targetEl || targetEl.querySelector(':scope > .ttvd-floating-wrap')) return;

    const computed = window.getComputedStyle(targetEl);
    if (computed.position === 'static') {
      targetEl.style.position = 'relative';
    }

    const wrap = document.createElement('div');
    wrap.className = `ttvd-floating-wrap${compact ? ' ttvd-compact' : ''}`;

    if (!compact && videoEl) {
      const tRect = targetEl.getBoundingClientRect();
      const vRect = videoEl.getBoundingClientRect();
      if (vRect.width > 50 && tRect.width > 50) {
        const topOffset = Math.max(14, Math.round(vRect.top - tRect.top + 14));
        const rightOffset = Math.max(14, Math.round(tRect.right - vRect.right + 14));
        wrap.style.top = `${topOffset}px`;
        wrap.style.right = `${rightOffset}px`;
      }
    }

    const s = T();
    const pillBtn = document.createElement('button');
    pillBtn.type = 'button';
    pillBtn.className = 'ttvd-pill-btn';
    const pillDefaultHtml = `${SMALL_DOWNLOAD_SVG}<span>${compact ? s.download : s.downloadNoWm}</span>`;
    pillBtn.innerHTML = pillDefaultHtml;

    const moreBtn = document.createElement('button');
    moreBtn.type = 'button';
    moreBtn.className = 'ttvd-more-btn';
    moreBtn.title = s.moreTip;
    moreBtn.innerHTML = CHEVRON_SVG;

    const dropdown = createDropdown((format) => {
      wrap.classList.remove('ttvd-menu-open');
      triggerDownload(() => findVideoUrlForElement(container), format, pillBtn, pillDefaultHtml);
    });

    pillBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      closeAllDropdowns();
      triggerDownload(() => findVideoUrlForElement(container), null, pillBtn, pillDefaultHtml);
    });

    moreBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const wasOpen = dropdown.classList.contains('ttvd-open');
      closeAllDropdowns(dropdown);
      if (wasOpen) {
        dropdown.classList.remove('ttvd-open');
        wrap.classList.remove('ttvd-menu-open');
      } else {
        openDropdownAt(dropdown, moreBtn, false, wrap);
      }
    });

    wrap.appendChild(pillBtn);
    wrap.appendChild(moreBtn);
    targetEl.appendChild(wrap);
  }

  function removeAllButtons() {
    document.querySelectorAll('.ttvd-action-wrap, .ttvd-floating-wrap, .ttvd-dropdown').forEach((el) => el.remove());
    document.querySelectorAll('[data-ttvd-scanned]').forEach((el) => {
      delete el.dataset.ttvdScanned;
    });
  }

  function scanAndInject() {
    if (!injectEnabled || !verifyBrandIntegrity()) return;

    const feedItems = document.querySelectorAll(
      '[data-e2e="recommend-list-item-container"]:not([data-ttvd-scanned="1"]), [data-e2e="browse-video"]:not([data-ttvd-scanned="1"]), [data-e2e="detail-video"]:not([data-ttvd-scanned="1"]), [data-e2e="detail-photo"]:not([data-ttvd-scanned="1"]), [data-e2e="browse-photo"]:not([data-ttvd-scanned="1"]), [data-e2e="photo-detail"]:not([data-ttvd-scanned="1"]), article:not([data-ttvd-scanned="1"])'
    );
    feedItems.forEach((item) => {
      const likeIcon = item.querySelector(
        '[data-e2e="like-icon"], [data-e2e="browse-like-icon"], [data-e2e="comment-icon"], [data-e2e="share-icon"]'
      );
      if (likeIcon) {
        let actionBar = likeIcon.closest('section');
        if (!actionBar) {
          let cur = likeIcon.closest('button')?.parentElement || likeIcon.parentElement;
          for (let i = 0; i < 6 && cur && cur !== item; i++) {
            if (cur.children.length >= 4 && cur.tagName !== 'ARTICLE') {
              actionBar = cur;
              break;
            }
            cur = cur.parentElement;
          }
        }
        if (actionBar) {
          item.dataset.ttvdScanned = '1';
          injectActionBarButton(actionBar, item);
          return;
        }
      }

      const mediaEl =
        item.querySelector('video') ||
        item.querySelector('.swiper, [class*="PhotoMode"], [class*="Swiper"], img[src*="tiktokcdn"], img[src*="ibyteimg"], img[src*="byteimg"]');
      if (mediaEl && mediaEl.getBoundingClientRect().width > 50) {
        item.dataset.ttvdScanned = '1';
        injectFloatingButton(item, item, false, mediaEl);
      }
    });

    const gridCards = document.querySelectorAll(
      '[data-e2e="user-post-item"]:not([data-ttvd-scanned="1"]), [data-e2e="search_video-item"]:not([data-ttvd-scanned="1"]), [data-e2e="user-liked-item"]:not([data-ttvd-scanned="1"]), [data-e2e="favorites-item"]:not([data-ttvd-scanned="1"]), [data-e2e="collection-item"]:not([data-ttvd-scanned="1"])'
    );
    gridCards.forEach((card) => {
      card.dataset.ttvdScanned = '1';
      injectFloatingButton(card, card, true);
    });
  }

  function scheduleScan() {
    if (!injectEnabled) return;
    if (scanTimer) clearTimeout(scanTimer);
    scanTimer = setTimeout(() => {
      scanTimer = null;
      scanAndInject();
    }, 250);
  }

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.ttvd-action-wrap, .ttvd-floating-wrap, .ttvd-dropdown')) {
      closeAllDropdowns();
    }
  });

  window.addEventListener('scroll', () => closeAllDropdowns(), { passive: true, capture: true });
  window.addEventListener('resize', () => closeAllDropdowns(), { passive: true });

  function pickVideoStream(videoObj) {
    if (!videoObj) return { url: '', codec: 'unknown' };
    const metaOf = (b) => `${b.CodecType || ''} ${b.GearName || ''} ${b.PlayAddr?.UrlKey || ''}`.toLowerCase();
    const isHevc = (m) => m.includes('bytevc1') || m.includes('hevc') || m.includes('h265') || m.includes('hvc1');
    if (Array.isArray(videoObj.bitrateInfo) && videoObj.bitrateInfo.length > 0) {
      const withUrls = videoObj.bitrateInfo.filter((b) => b.PlayAddr?.UrlList?.length);
      const h264Streams = withUrls.filter((b) => {
        const meta = metaOf(b);
        return (meta.includes('h264') || meta.includes('avc')) && !isHevc(meta);
      });
      if (h264Streams.length > 0) {
        h264Streams.sort((a, b) => (b.Bitrate || 0) - (a.Bitrate || 0));
        return { url: h264Streams[0].PlayAddr.UrlList[0], codec: 'h264' };
      }
      const nonHevc = withUrls.filter((b) => !isHevc(metaOf(b)));
      if (nonHevc.length > 0) {
        nonHevc.sort((a, b) => (b.Bitrate || 0) - (a.Bitrate || 0));
        return { url: nonHevc[0].PlayAddr.UrlList[0], codec: 'unknown' };
      }
    }
    return { url: videoObj.playAddr || '', codec: 'unknown' };
  }

  function parseUniversalJson(jsonText, videoId) {
    try {
      const data = JSON.parse(jsonText || '{}');
      const detail = data?.['__DEFAULT_SCOPE__']?.['webapp.video-detail']?.itemInfo?.itemStruct;
      if (detail && (!videoId || detail.id === videoId)) {
        return detail;
      }
    } catch {
      // ignore parse errors
    }
    return null;
  }

  function extractFromUniversalData(videoId) {
    const univScript = document.getElementById('__UNIVERSAL_DATA_FOR_REHYDRATION__');
    if (univScript) {
      const detail = parseUniversalJson(univScript.textContent, videoId);
      if (detail) return detail;
    }

    try {
      const sigiScript = document.getElementById('SIGI_STATE');
      if (sigiScript && videoId) {
        const data = JSON.parse(sigiScript.textContent || '{}');
        if (data?.ItemModule?.[videoId]) {
          return data.ItemModule[videoId];
        }
      }
    } catch {
      // ignore parse errors
    }

    return null;
  }

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (!verifyBrandIntegrity()) {
      sendResponse({ success: false, error: INTEGRITY_ERROR_MSG });
      return false;
    }

    if (message.action === 'extractFromPage') {
      (async () => {
        try {
          let item = extractFromUniversalData(message.videoId);

          // In SPA navigation (e.g. Saved Videos modal), initial SSR script is stale: fetch fresh HTML for exact TikTok URL
          if (!item && message.url && isAllowedTikTokUrl(message.url)) {
            try {
              const htmlResp = await fetch(message.url, { credentials: 'include' });
              if (htmlResp.ok) {
                const html = await htmlResp.text();
                const m = html.match(/<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>([\s\S]*?)<\/script>/);
                if (m) {
                  item = parseUniversalJson(m[1], message.videoId);
                }
              }
            } catch {
              // ignore fetch error
            }
          }

          if (!item && message.videoId) {
            const resp = await fetch(`/api/item/detail/?itemId=${encodeURIComponent(message.videoId)}`, {
              credentials: 'include'
            });
            if (resp.ok) {
              const json = await resp.json();
              const candidate = json?.itemInfo?.itemStruct || null;
              if (candidate && (!message.videoId || candidate.id === message.videoId)) {
                item = candidate;
              }
            }
          }

          if (!item) {
            // Last resort: check currently playing <video> element if it has a direct https src
            const activeVideo = Array.from(document.querySelectorAll('video')).find(
              (v) => !v.paused && (v.currentSrc || v.src || '').startsWith('https://')
            ) || Array.from(document.querySelectorAll('video')).find(
              (v) => (v.currentSrc || v.src || '').startsWith('https://')
            );

            if (activeVideo) {
              const directSrc = activeVideo.currentSrc || activeVideo.src;
              sendResponse({
                id: message.videoId || String(Date.now()),
                title: document.title || 'TikTok Videosu',
                author: 'tiktok',
                authorName: 'TikTok Kullanıcısı',
                avatar: '',
                cover: '',
                duration: Math.round(activeVideo.duration || 0),
                hdUrl: directSrc,
                sdUrl: directSrc,
                wmUrl: '',
                musicUrl: '',
                musicTitle: 'orijinal-ses',
                images: [],
                stats: { plays: 0, likes: 0, comments: 0, shares: 0 },
                source: 'video_element'
              });
              return;
            }

            sendResponse(null);
            return;
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
          const playUrl = isPhotoPost ? '' : picked.url;

          sendResponse({
            id: item.id || message.videoId,
            title: item.desc || '',
            author: item.author?.uniqueId || 'tiktok',
            authorName: item.author?.nickname || item.author?.uniqueId || 'TikTok User',
            avatar: item.author?.avatarThumb || '',
            cover: item.video?.originCover || item.video?.cover || images[0] || '',
            duration: item.video?.duration || 0,
            hdUrl: playUrl,
            sdUrl: playUrl,
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
            codecHint: picked.codec,
            source: 'tiktok_page'
          });
        } catch {
          sendResponse(null);
        }
      })();
      return true;
    }

    if (message.action === 'blobDownload') {
      (async () => {
        try {
          if (!isAllowedMediaUrl(message.url)) {
            throw new Error('İzin verilmeyen medya kaynağı');
          }
          let resp;
          try {
            resp = await fetch(message.url, { credentials: 'include' });
          } catch {
            // CDN may reject credentialed CORS; retry without cookies
            resp = await fetch(message.url, { credentials: 'omit' });
          }
          if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
          const ctype = (resp.headers.get('content-type') || '').toLowerCase();
          if (ctype.includes('text/html') || ctype.includes('application/json')) {
            throw new Error('Geçersiz medya yanıtı (HTML/JSON)');
          }
          const blob = await resp.blob();
          if (blob.size < 1024) {
            throw new Error('İndirilen dosya çok küçük veya bozuk');
          }
          const blobUrl = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = blobUrl;
          a.download = message.filename || 'tiktok_video.mp4';
          document.body.appendChild(a);
          a.click();
          a.remove();
          setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
          sendResponse({ success: true });
        } catch (err) {
          sendResponse({ success: false, error: err.message });
        }
      })();
      return true;
    }

    return false;
  });

  loadSettings().then(() => {
    scanAndInject();

    domObserver = new MutationObserver((mutations) => {
      if (!injectEnabled) return;
      if (!chrome?.runtime?.id) {
        teardownOnInvalidContext();
        return;
      }
      for (const m of mutations) {
        if (m.addedNodes && m.addedNodes.length > 0) {
          scheduleScan();
          break;
        }
      }
    });

    if (document.body) {
      domObserver.observe(document.body, { childList: true, subtree: true });
    }

    scanInterval = setInterval(() => {
      if (!chrome?.runtime?.id) {
        teardownOnInvalidContext();
        return;
      }
      if (injectEnabled) scanAndInject();
    }, 5000);
  });
})();
