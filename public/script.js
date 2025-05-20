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
  // Apply creative background image from URL param if present
  const urlParams = new URLSearchParams(window.location.search);
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
});