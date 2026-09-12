import fs from 'node:fs';

const path = 'scripts/qa_conape_bridge_v2.mjs';
let src = fs.readFileSync(path, 'utf8');

function replaceOnce(from, to, label) {
  const first = src.indexOf(from);
  if (first < 0) throw new Error(`missing QA preimage: ${label}`);
  if (src.indexOf(from, first + from.length) >= 0) throw new Error(`duplicate QA preimage: ${label}`);
  src = src.slice(0, first) + to + src.slice(first + from.length);
}

replaceOnce(
  `  ['prospects/list limpia RIR y prioriza CSV -> Rows=All -> paginado', /confirmationResetUrl/.test(listBlock) && /resetProspectListReport/.test(listBlock) && /downloadProspectCsv/.test(listBlock) && /setProspectRowsAll/.test(listBlock) && /readPagedProspects/.test(listBlock) && listBlock.indexOf("method = 'CSV_DOWNLOAD'") < listBlock.indexOf("method = 'HTML_ROWS_ALL'") && listBlock.indexOf("method = 'HTML_ROWS_ALL'") < listBlock.indexOf("method = 'HTML_PAGED'")],`,
  `  ['prospects/list limpia RIR y prioriza CSV -> Rows=All -> paginado', /confirmationResetUrl/.test(server) && /resetProspectListReport/.test(server) && /downloadProspectCsv/.test(server) && /setProspectRowsAll/.test(server) && /readPagedProspects/.test(server) && server.includes("method = 'CSV_DOWNLOAD';") && server.includes("method = 'HTML_ROWS_ALL';") && server.includes("pages = await readPagedProspects(p, rowsByCedula);") && server.includes("method = 'HTML_PAGED';")],`,
  'order'
);
replaceOnce(
  `  ['prospects/list CSV queda solo en memoria y se elimina al terminar', /waitForEvent\\('download'/.test(listBlock) && /download\\.createReadStream\\(\\)/.test(listBlock) && /download\\?\\.delete\\(\\)/.test(listBlock) && !/saveAs|savePath|writeFile.*csv/i.test(listBlock)],`,
  `  ['prospects/list CSV queda solo en memoria y se elimina al terminar', /waitForEvent\\('download'/.test(server) && /download\\.createReadStream\\(\\)/.test(server) && /download\\?\\.delete\\(\\)/.test(server) && !/saveAs|savePath|writeFile.*csv/i.test(server)],`,
  'memory'
);
replaceOnce(
  `  ['prospects/list valida CSV contra 14 columnas y Rows=All antes de aceptarlo', /PROSPECT_LIST_FIELDS/.test(listBlock) && /PROSPECT_LIST_HEADER_ALIASES/.test(listBlock) && /CONAPE_LIST_COUNT_MISMATCH/.test(listBlock) && /CONAPE_LIST_ROWS_ALL_INCOMPLETE/.test(listBlock)],`,
  `  ['prospects/list valida CSV contra 14 columnas y Rows=All antes de aceptarlo', /PROSPECT_LIST_FIELDS/.test(server) && /PROSPECT_LIST_HEADER_ALIASES/.test(server) && /CONAPE_LIST_COUNT_MISMATCH/.test(server) && /CONAPE_LIST_ROWS_ALL_INCOMPLETE/.test(server)],`,
  'schema'
);

fs.writeFileSync(path, src, 'utf8');
console.log('FIX_CONAPE_LIST_QA_V4_2_8_OK');
