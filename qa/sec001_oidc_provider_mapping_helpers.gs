// SEC-001 · OIDC provider + identity mapping helpers
// SOURCE ONLY · NO doPost route · NO session issuance · NO sheet creation/writes.
// Intended for a future Apps Script QA integration after a DEV tenant exists.

var _SEC001_AUTH_IDENTITIES_SHEET_ = 'AUTH_IDENTIDADES';
var _SEC001_AUTH_PROVIDER_ = 'auth0';

function _sec001AuthFailure_() {
  return { ok: false, error: 'credenciales_invalidas' };
}

function _sec001Auth0Domain_() {
  var raw = String(PropertiesService.getScriptProperties().getProperty('SEC001_AUTH0_DOMAIN') || '').trim().toLowerCase();
  raw = raw.replace(/^https?:\/\//, '').replace(/\/+$/, '');
  if (!raw || raw.length > 253 || !/^[a-z0-9.-]+$/.test(raw) || raw.indexOf('..') >= 0) return '';
  return raw;
}

function _sec001VerifyAuth0UserInfo_(providerProof) {
  var proof = String(providerProof || '').trim();
  var domain = _sec001Auth0Domain_();
  if (!domain || proof.length < 20 || proof.length > 8192) return _sec001AuthFailure_();

  try {
    var response = UrlFetchApp.fetch('https://' + domain + '/userinfo', {
      method: 'get',
      headers: { Authorization: 'Bearer ' + proof },
      muteHttpExceptions: true,
      followRedirects: false
    });
    if (response.getResponseCode() !== 200) return _sec001AuthFailure_();
    var profile = JSON.parse(response.getContentText() || '{}');
    var sub = String(profile && profile.sub || '');
    if (!sub || sub.length > 512) return _sec001AuthFailure_();
    return { ok: true, provider: _SEC001_AUTH_PROVIDER_, sub: sub };
  } catch (_) {
    return _sec001AuthFailure_();
  }
}

function _sec001HeaderIndex_(headers) {
  var out = {};
  for (var i = 0; i < headers.length; i++) out[String(headers[i] || '').trim().toUpperCase()] = i;
  return out;
}

function _sec001NormalizeLocalKey_(keyType, value) {
  var type = String(keyType || '').trim().toUpperCase();
  var raw = String(value || '').trim();
  if (type === 'CEDULA') return raw.replace(/[-\s]/g, '');
  if (type === 'CODIGO') return raw.toUpperCase();
  if (type === 'AUTH_PRINCIPAL_ID') return raw;
  return '';
}

function _sec001FindIdentityMapping_(provider, providerSub) {
  var p = String(provider || '').trim().toLowerCase();
  var sub = String(providerSub || '');
  if (p !== _SEC001_AUTH_PROVIDER_ || !sub) return _sec001AuthFailure_();

  try {
    var ss = SpreadsheetApp.openById(SHEET_ID);
    var ws = ss.getSheetByName(_SEC001_AUTH_IDENTITIES_SHEET_);
    if (!ws || ws.getLastRow() < 2) return _sec001AuthFailure_();

    var values = ws.getDataRange().getValues();
    var h = _sec001HeaderIndex_(values[0] || []);
    var required = ['IDENTITY_ID','PROVIDER','PROVIDER_SUB','LOCAL_SOURCE','LOCAL_KEY_TYPE','LOCAL_KEY','MIGRATION_STATUS'];
    for (var r = 0; r < required.length; r++) if (h[required[r]] == null) return _sec001AuthFailure_();

    var match = null;
    var count = 0;
    for (var i = 1; i < values.length; i++) {
      var row = values[i];
      if (String(row[h.PROVIDER] || '').trim().toLowerCase() !== p) continue;
      if (String(row[h.PROVIDER_SUB] || '') !== sub) continue;
      count++;
      match = row;
    }
    if (count !== 1 || !match) return _sec001AuthFailure_();
    if (String(match[h.MIGRATION_STATUS] || '').trim().toUpperCase() !== 'MIGRATED') return _sec001AuthFailure_();

    var source = String(match[h.LOCAL_SOURCE] || '').trim().toUpperCase();
    var keyType = String(match[h.LOCAL_KEY_TYPE] || '').trim().toUpperCase();
    var key = _sec001NormalizeLocalKey_(keyType, match[h.LOCAL_KEY]);
    if (['USUARIOS','DATOS'].indexOf(source) < 0 || !key) return _sec001AuthFailure_();

    return {
      ok: true,
      identity_id: String(match[h.IDENTITY_ID] || '').trim(),
      local_source: source,
      local_key_type: keyType,
      local_key: key
    };
  } catch (_) {
    return _sec001AuthFailure_();
  }
}

function _sec001VerifyAndMapProviderProof_(providerProof) {
  var verified = _sec001VerifyAuth0UserInfo_(providerProof);
  if (!verified || verified.ok !== true) return _sec001AuthFailure_();
  var mapped = _sec001FindIdentityMapping_(verified.provider, verified.sub);
  if (!mapped || mapped.ok !== true) return _sec001AuthFailure_();
  return mapped;
}
