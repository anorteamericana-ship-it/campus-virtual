// QA juegos fase 1 · carga src/academia_play.jsx en Node para probar sus funciones puras.
// Usa el mismo Babel que el sitio (vendor/babel.js) con la misma configuración que src/lazy_loader.jsx.
// Solo lectura: no escribe archivos ni hace llamadas de red.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

export function loadAcademiaPlay(root = process.cwd()) {
  const Babel = require(path.join(root, 'vendor', 'babel.js'));
  const file = path.join(root, 'src', 'academia_play.jsx');
  const source = fs.readFileSync(file, 'utf8');
  const code = Babel.transform(source, { presets: ['react'], plugins: ['transform-block-scoping'] }).code;
  const noHook = () => { throw new Error('Hook de React llamado fuera de un componente'); };
  const React = {
    createElement: () => null,
    Fragment: 'Fragment',
    useMemo: noHook, useState: noHook, useEffect: noHook, useRef: noHook, useLayoutEffect: noHook, useCallback: noHook,
  };
  const context = vm.createContext({ React, window: {}, console });
  vm.runInContext(code, context, { filename: 'src/academia_play.jsx' });
  return { context, source };
}

// Copia a objetos/arrays del realm de Node (los del contexto vm fallan en comparaciones estrictas).
export function plain(value) {
  return JSON.parse(JSON.stringify(value));
}
