$('#export-btn').click(() => {
  // Show the loading spinner overlay
  $('#loading-overlay').show();

  const currentCode = $('.code').text().trim();
  const logoSrc = $('.logo').attr('src');
  const communityMatch = logoSrc.match(/logo_(\d+)\.png/);
  const communityId = communityMatch ? communityMatch[1] : '';
  const currentUrl = $('.community-url').attr('href');
  const qrCodeEl = $('.qr-code');
  const qrCodeUrl = qrCodeEl.is(':visible') ? qrCodeEl.attr('src') : '';

  const urlParams = new URLSearchParams(window.location.search);
  const creativeUrl = urlParams.get('creativeurl') || '';

  const link = document.createElement('a');
  link.href = `/generate-pdf?code=${encodeURIComponent(currentCode)}&community=${encodeURIComponent(communityId)}&url=${encodeURIComponent(currentUrl)}&qr=${encodeURIComponent(qrCodeUrl)}&creativeurl=${encodeURIComponent(creativeUrl)}`;
  link.download = 'flier.pdf';
  link.click();

});

$(document).ready(function () {
  const urlParams = new URLSearchParams(window.location.search);

  // Access Code
  const codeParam = urlParams.get('code');
  if (codeParam) {
    $('.code').text(codeParam);
  }

  // Community Logo
  const communityParam = urlParams.get('community');
  if (communityParam) {
    $('.logo').attr('src', `https://psprods3ep.azureedge.net/cdn.perkspot.com/images/communities/logo_${communityParam}.png`);
  }

  // Link URL
  const urlParam = urlParams.get('url');
  if (urlParam) {
    const displayText = urlParam.replace(/^https?:\/\//i, '');
    $('.community-url').attr('href', urlParam).text(displayText);
  }

  // QR Code
  const qrParam = urlParams.get('qr');
  if (qrParam) {
    $('.qr-code').attr('src', qrParam).show();
  }

  // Background image override
  const creativeUrlParam = urlParams.get('creativeurl');
  if (creativeUrlParam) {
    const fullCreativeUrl = /^https?:\/\//i.test(creativeUrlParam)
      ? creativeUrlParam
      : 'https://' + creativeUrlParam;
    $('#print-page').css('background-image', `url(${fullCreativeUrl})`);
  }

  $('#edit-passcode').click(function () {
    $('#passcode-modal').show();
  });

  $('#cancel-passcode').click(function () {
    $('#passcode-modal').hide();
  });

  $('#submit-passcode').click(function () {
    const newCode = $('#passcode-input').val().trim();
    if (newCode) {
      $('.code').text(newCode);
    }
    $('#passcode-modal').hide();
  });

  $('#edit-community').click(function () {
    $('#community-modal').show();
  });

  $('#cancel-community').click(function () {
    $('#community-modal').hide();
  });

  $('#submit-community').click(function () {
    const communityId = $('#community-input').val().trim();
    if (communityId) {
      $('.logo').attr('src', `https://psprods3ep.azureedge.net/cdn.perkspot.com/images/communities/logo_${communityId}.png`);
    }
    $('#community-modal').hide();
  });

  $('#edit-url').click(function () {
    $('#url-modal').show();
  });

  $('#cancel-url').click(function () {
    $('#url-modal').hide();
  });

  $('#submit-url').click(function () {
    let newUrl = $('#url-input').val().trim();
    let displayText = newUrl;

    if (newUrl && !/^https?:\/\//i.test(newUrl)) {
      newUrl = 'http://' + newUrl;
    }

    if (newUrl) {
      $('.community-url').attr('href', newUrl).text(displayText);
    }

    $('#url-modal').hide();
  });

  $('#edit-qr').click(function () {
    $('#qr-modal').show();
  });

  $('#cancel-qr').click(function () {
    $('#qr-modal').hide();
  });

  $('#submit-qr').click(function () {
    const qrUrl = $('#qr-input').val().trim();
    const hideQr = $('#qr-hide').is(':checked');

    if (hideQr) {
      $('.qr-code').hide();
    } else if (qrUrl) {
      const encodedUrl = encodeURIComponent(qrUrl);
      $('.qr-code').attr('src', `https://api.qrserver.com/v1/create-qr-code/?data=${encodedUrl}&size=200x200`).show();
    }

    $('#qr-modal').hide();
  });
  // Allow user to manually dismiss the loading overlay if needed
  $('#loading-overlay').click(function () {
    $(this).hide();
  });

  // Copy Link handler for shareable flier URL
  $('#copy-link').click(function () {
    const code = $('.code').text().trim();
    const logoSrc = $('.logo').attr('src');
    const communityMatch = logoSrc.match(/logo_(\d+)\.png/);
    const community = communityMatch ? communityMatch[1] : '';
    const url = $('.community-url').attr('href');
    const qrCodeEl = $('.qr-code');
    const qr = qrCodeEl.is(':visible') ? qrCodeEl.attr('src') : '';
    const bgImage = $('#print-page').css('background-image');
    const creativeMatch = bgImage.match(/url\("?(.*?)"?\)/);
    const creativeurl = creativeMatch ? creativeMatch[1].replace(/^https?:\/\//i, '') : '';

    const base = window.location.origin + window.location.pathname;
    const params = new URLSearchParams({
      code,
      community,
      url,
      qr,
      creativeurl,
    });

    const shareUrl = `${base}?${params.toString()}`;

    // Copy to clipboard
    navigator.clipboard.writeText(shareUrl).then(() => {
      alert('Link copied to clipboard!');
    }).catch(() => {
      alert('Failed to copy link.');
    });
  });
  // Creative Image modal handlers
  $('#edit-creative').click(function () {
    $('#creative-modal').show();
  });

  $('#cancel-creative').click(function () {
    $('#creative-modal').hide();
  });

  $('#submit-creative').click(function () {
    const creativeUrl = $('#creative-input').val().trim();
    if (creativeUrl) {
      const fullUrl = /^https?:\/\//i.test(creativeUrl)
        ? creativeUrl
        : 'https://' + creativeUrl;
      $('#print-page').css('background-image', `url(${fullUrl})`);

      // Update URL param in-place for export consistency
      const currentParams = new URLSearchParams(window.location.search);
      currentParams.set('creativeurl', creativeUrl.replace(/^https?:\/\//i, ''));
      const newUrl = `${window.location.pathname}?${currentParams.toString()}`;
      window.history.replaceState({}, '', newUrl);
    }

    $('#creative-modal').hide();
  });
});