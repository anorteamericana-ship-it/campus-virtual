/** English LAB LIVE v2 · server-side content resolution boundary. */
function ELV2_createContentResolver(sourceAdapter) {
  if (!sourceAdapter || typeof sourceAdapter.getByRef !== 'function') {
    throw new Error('ELV2_CONTENT_SOURCE_INVALID');
  }

  return Object.freeze({
    resolve: function (contentRef, gameId, context) {
      if (typeof contentRef !== 'string' || !contentRef.trim() || contentRef.length > 160) {
        throw new Error('ELV2_CONTENT_REF_INVALID');
      }
      var resolved = sourceAdapter.getByRef(contentRef.trim(), gameId, context || {});
      if (!resolved || typeof resolved !== 'object' || !resolved.content) {
        throw new Error('ELV2_CONTENT_NOT_COMPATIBLE');
      }
      return Object.freeze({
        content_ref: contentRef.trim(),
        content_version: resolved.content_version || '',
        content: JSON.parse(JSON.stringify(resolved.content))
      });
    }
  });
}

function ELV2_createInMemoryContentSource(fixtures) {
  var source = fixtures || {};
  return Object.freeze({
    getByRef: function (contentRef, gameId) {
      var entry = source[contentRef];
      if (!entry) return null;
      if (entry.game_id && entry.game_id !== gameId) return null;
      return JSON.parse(JSON.stringify(entry));
    }
  });
}
