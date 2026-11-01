// F111 AUTOPASS5 · Strict static reader for the F96 lazy manifest.
// No eval/Function: audit untrusted or malformed route declarations fail-closed.
// Only literal arrays of relative file paths are supported; never execute app.jsx.
export function parseF96LazyMap(source) {
  if (typeof source !== 'string') throw new TypeError('F96_LAZY source must be text');
  const anchors = [...source.matchAll(/\bconst\s+F96_LAZY\s*=\s*\{/g)];
  if (anchors.length !== 1) throw new Error(`F96_LAZY must have one declaration, found ${anchors.length}`);
  const begin = anchors[0].index + anchors[0][0].length;
  const end = source.indexOf('\n};', begin);
  if (end < 0) throw new Error('F96_LAZY closing delimiter missing');
  const body = source.slice(begin, end);
  const map = Object.create(null);
  let at = 0;
  const skip = () => { while (at < body.length && /\s/.test(body[at])) at++; };
  while (true) {
    skip();
    if (at >= body.length) break;
    const key = /^([A-Za-z_$][\w$]*)\s*:\s*\[/.exec(body.slice(at));
    if (!key) throw new Error(`F96_LAZY unexpected token at offset ${at}`);
    at += key[0].length;
    const route = key[1];
    if (Object.hasOwn(map, route)) throw new Error(`F96_LAZY duplicate route: ${route}`);
    const assets = [];
    while (true) {
      skip();
      if (body[at] === ']') { at++; break; }
      const quote = body[at];
      if (quote !== "'" && quote !== '"') throw new Error(`F96_LAZY nonliteral asset in ${route}`);
      const start = ++at;
      while (at < body.length && body[at] !== quote) {
        if (body[at] === '\\' || body[at] === '\n' || body[at] === '\r') throw new Error(`F96_LAZY escaped or multiline asset in ${route}`);
        at++;
      }
      if (at >= body.length) throw new Error(`F96_LAZY unterminated string in ${route}`);
      const asset = body.slice(start, at++);
      if (!asset || /^(?:\/|[a-z]+:)/i.test(asset) || asset.split(/[?#]/,1)[0].split('/').includes('..')) throw new Error(`F96_LAZY invalid relative asset in ${route}`);
      if (assets.includes(asset)) throw new Error(`F96_LAZY duplicate asset in ${route}: ${asset}`);
      assets.push(asset);
      skip();
      if (body[at] === ',') { at++; continue; }
      if (body[at] === ']') { at++; break; }
      throw new Error(`F96_LAZY expected comma or ] in ${route}`);
    }
    map[route] = assets;
    skip();
    if (body[at] === ',') { at++; continue; }
    if (at !== body.length) throw new Error(`F96_LAZY unexpected trailing token at offset ${at}`);
    break;
  }
  if (!Object.keys(map).length) throw new Error('F96_LAZY empty manifest');
  return map;
}
