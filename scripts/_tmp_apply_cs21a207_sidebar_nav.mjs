#!/usr/bin/env node
import fs from 'node:fs';

const path = 'src/sidebar.jsx';
const original = fs.readFileSync(path, 'utf8');
const pair = /\.\.\.\(mostrarAcademiaPlay \? \[\s*\{ id: 'academia_play', label: 'English LAB', icon: 'english_lab', badge: 'Piloto' \},\s*\{ id: 'english_lab_live', label: 'English LAB Live', icon: 'english_lab', badge: 'Nuevo' \},\s*\] : \[\]\),/g;
const matches = [...original.matchAll(pair)];
if (matches.length !== 2) {
  throw new Error(`CS21A207 esperaba exactamente 2 bloques duplicados English LAB/Live; encontró ${matches.length}.`);
}
const canonical = "...(mostrarAcademiaPlay ? [{ id: 'english_lab_live', label: 'English LAB', icon: 'english_lab', badge: 'Nuevo' }] : []),";
const updated = original.replace(pair, canonical);
if (updated === original) throw new Error('CS21A207 no produjo cambios.');
if (!updated.includes("{ id: 'academia_play', label: 'English LAB', icon: 'english_lab', badge: 'Gratis' }")) {
  throw new Error('CS21A207 debe preservar English LAB gratis para prospectos.');
}
if (!updated.includes("{ id: 'academia_play', label: 'English LAB', icon: 'english_lab', badge: 'Piloto' }")) {
  throw new Error('CS21A207 debe preservar la ruta catálogo para administración/compatibilidad.');
}
const canonicalCount = (updated.match(/id: 'english_lab_live', label: 'English LAB', icon: 'english_lab', badge: 'Nuevo'/g) || []).length;
if (canonicalCount !== 2) throw new Error(`CS21A207 esperaba 2 entradas canónicas Live; encontró ${canonicalCount}.`);
if (updated.includes("id: 'english_lab_live', label: 'English LAB Live'")) {
  throw new Error('CS21A207 no debe dejar la etiqueta visible English LAB Live en sidebar docente/estudiante.');
}
fs.writeFileSync(path, updated);
console.log(JSON.stringify({ok:true, changed_blocks:2, canonical_visible_entries:2, free_route_preserved:true, admin_compatibility_preserved:true}, null, 2));
