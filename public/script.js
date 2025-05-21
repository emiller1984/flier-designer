$('#export-btn').click(() => {
  // Show the loading spinner overlay
  $('#loading-overlay').show();

  const includeCode = $('#accesscode-toggle').is(':checked');
  const currentCode = includeCode ? $('#passcode-input').val().trim() : '';

  if (includeCode && currentCode) {
    $('.access-code-section').show();
    $('.access-code-section .code').text(currentCode);
  } else {
    $('.access-code-section').hide();
  }

  const community = $('.logo').attr('src');
  const currentUrl = $('.community-url').attr('href');
  const qrCodeEl = $('.qr-code');
  const qrCodeUrl = qrCodeEl.is(':visible') ? qrCodeEl.attr('src') : '';

  const urlParams = new URLSearchParams(window.location.search);
  const creativeUrl = urlParams.get('creativeurl') || '';

  const link = document.createElement('a');
  link.href = `/generate-pdf?code=${encodeURIComponent(currentCode)}&community=${encodeURIComponent(community)}&url=${encodeURIComponent(currentUrl)}&qr=${encodeURIComponent(qrCodeUrl)}&creativeurl=${encodeURIComponent(creativeUrl)}`;
  link.download = 'flier.pdf';
  link.click();

  setTimeout(() => {
    $('#loading-overlay').hide();
  }, 5000);
});

$(document).ready(function () {
  const urlParams = new URLSearchParams(window.location.search);

  // Populate form fields from URL parameters if present
  const codeParam = urlParams.get('code');
  if (codeParam) {
    $('#passcode-input').val(codeParam);
    $('.code').text(codeParam);
  }

  const hasCode = urlParams.has('code');
  if (!hasCode || codeParam === '') {
    $('#accesscode-toggle').prop('checked', false);
    $('#accesscode-settings').hide();
    $('.access-code-section').hide();
  } else {
    $('#accesscode-toggle').prop('checked', true);
    $('#accesscode-settings').show();
    $('.access-code-section').show();
  }

  const communityParam = urlParams.get('community');
  if (communityParam) {
    $('#community-input').val(communityParam);
    $('.logo').attr('src', communityParam);
  }

  const urlParam = urlParams.get('url');
  if (urlParam) {
    $('#url-input').val(urlParam);
    const displayText = urlParam.replace(/^https?:\/\//i, '');
    $('.community-url').attr('href', urlParam).text(displayText);
  }

  const qrParam = urlParams.get('qr');
  if (qrParam) {
    $('#qr-input').val(qrParam);
    const encoded = encodeURIComponent(qrParam);
    const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?data=${encoded}&size=200x200`;
    $('.qr-code').attr('src', qrSrc).show();
    $('#qr-toggle').prop('checked', true);
    $('#qr-settings').show();
  } else {
    $('.qr-code').hide();
    $('#qr-toggle').prop('checked', false);
    $('#qr-settings').hide();
  }

  const creativeUrlParam = urlParams.get('creativeurl');
  if (creativeUrlParam) {
    $('#creative-input').val(creativeUrlParam);
    const fullCreativeUrl = /^https?:\/\//i.test(creativeUrlParam)
      ? creativeUrlParam
      : 'https://' + creativeUrlParam;
    $('#print-page').css('background-image', `url(${fullCreativeUrl})`);
  }

  // Handle "Apply Changes" button
  $('#apply-changes').click(function () {
    const code = $('#passcode-input').val().trim();
    const community = $('#community-input').val().trim();
    let customUrl = $('#url-input').val().trim();
    const qrUrl = $('#qr-input').val().trim();
    const showQr = $('#qr-toggle').is(':checked');
    const creativeUrl = $('#creative-input').val().trim();

    const includeCode = $('#accesscode-toggle').is(':checked');
    if (includeCode && code) {
      $('.code').text(code);
      $('.access-code-section').show();
    } else {
      $('.code').text('');
      $('.access-code-section').hide();
    }
    if (community) $('.logo').attr('src', community);
    if (customUrl) {
      if (!/^https?:\/\//i.test(customUrl)) {
        customUrl = 'http://' + customUrl;
      }
      $('.community-url').attr('href', customUrl).text(customUrl.replace(/^https?:\/\//i, ''));
    }

    if (showQr && qrUrl) {
      const encoded = encodeURIComponent(qrUrl);
      const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?data=${encoded}&size=200x200`;
      $('.qr-code').attr('src', qrSrc).show();
    } else {
      $('.qr-code').hide();
    }

    if (creativeUrl) {
      const fullCreative = /^https?:\/\//i.test(creativeUrl)
        ? creativeUrl
        : 'https://' + creativeUrl;
      $('#print-page').css('background-image', `url(${fullCreative})`);
    }

    // Update the URL
    const newParams = new URLSearchParams({
      community,
      url: customUrl,
      creativeurl: creativeUrl.replace(/^https?:\/\//i, '')
    });
    if (includeCode && code) newParams.set('code', code);

    if (showQr && qrUrl) newParams.set('qr', qrUrl);

    const newUrl = `${window.location.pathname}?${newParams.toString()}`;
    window.history.replaceState({}, '', newUrl);
  });

  // Toggle QR input visibility
  $('#qr-toggle').change(function () {
    if ($(this).is(':checked')) {
      $('#qr-settings').show();
    } else {
      $('#qr-settings').hide();
    }
  });

  $('#accesscode-toggle').change(function () {
    if ($(this).is(':checked')) {
      $('#accesscode-settings').show();
      $('.access-code-section').show();
    } else {
      $('#accesscode-settings').hide();
      $('.access-code-section').hide();
    }
  });

  // Dismiss loading overlay on click
  $('#loading-overlay').click(function () {
    $(this).hide();
  });

  // Copy Link
  $('#copy-link').click(function () {
    const code = $('.code').text().trim();
    const community = $('.logo').attr('src');
    const url = $('.community-url').attr('href');
    let qr = '';
    if ($('#qr-toggle').is(':checked')) {
      qr = $('#qr-input').val().trim();
    }
    const bgImage = $('#print-page').css('background-image');
    const creativeMatch = bgImage.match(/url\("?(.*?)"?\)/);
    const creativeurl = creativeMatch ? creativeMatch[1].replace(/^https?:\/\//i, '') : '';

    const base = window.location.origin + window.location.pathname;
    const params = new URLSearchParams({
      community,
      url,
      qr,
      creativeurl,
    });
    if ($('#accesscode-toggle').is(':checked') && code) {
      params.set('code', code);
    }

    const shareUrl = `${base}?${params.toString()}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      alert('Link copied to clipboard!');
    }).catch(() => {
      alert('Failed to copy link.');
    });
  });
});