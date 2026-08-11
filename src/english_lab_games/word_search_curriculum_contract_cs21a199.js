// CS21A199 · Contrato curricular público para Word Search.
// Frontend-only: prepara el juego para consumir ACADEMIA_PLAY_BANK cuando se consolide el backend Live.
(function installEnglishLabWordSearchCurriculumCS21A199(global){
  'use strict';
  if(!global || global.EnglishLabWordSearchCurriculumCS21A199) return;

  const VERSION='CS21A199';
  const GAME_ID='WORD_SEARCH';
  const LEVEL_ID='B1';
  const UNIT_ID='B1-U01';
  const GRID_SIZE=14;
  const WORD_COUNT=10;
  const DIRECTIONS=Object.freeze(['E','S','SE','SW']);
  const SUPPORTED_TEMPLATES=Object.freeze([
    Object.freeze({templateId:'VOCAB_01',itemType:'MCQ'}),
    Object.freeze({templateId:'VOCAB_02',itemType:'MATCH'}),
  ]);

  const CURRICULUM=Object.freeze({
    levelId:LEVEL_ID,
    unitId:UNIT_ID,
    unitTitle:"What's your name?",
    lessons:Object.freeze([1,2]),
    focus:'Vocabulary recognition and spelling',
    objectiveEs:'Reconocer y localizar vocabulario clave de la Unidad 1 reforzando forma escrita, ortografía y asociación básica de significado.',
    source:'APOLLO_G3 · ACADEMIA_PLAY_BANK',
    officialGrade:false,
    status:'QA_FOUNDATION',
  });

  function clean(value){return String(value==null?'':value).replace(/\s+/g,' ').trim();}
  function upper(value){return clean(value).toUpperCase();}
  function ascii(value){return upper(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'');}
  function gridWord(value){return ascii(value).replace(/[^A-Z]/g,'');}
  function optionValue(row,key){
    const letter=upper(key);
    return clean(row && row['OPTION_'+letter]);
  }
  function supported(row){
    const level=upper(row?.LEVEL_ID||row?.level_id);
    const unit=upper(row?.UNIT_ID||row?.unit_id);
    const area=upper(row?.AREA_ID||row?.area_id);
    const template=upper(row?.TEMPLATE_ID||row?.template_id);
    const type=upper(row?.ITEM_TYPE||row?.item_type);
    const status=upper(row?.STATUS||row?.status||'ACTIVE');
    return level===LEVEL_ID && unit===UNIT_ID && area==='VOCAB' && status==='ACTIVE' &&
      SUPPORTED_TEMPLATES.some(spec=>spec.templateId===template&&spec.itemType===type);
  }

  function canonicalRow(input){
    const row=input&&typeof input==='object'?input:{};
    const template=upper(row.TEMPLATE_ID||row.template_id);
    const sourceItemId=clean(row.SOURCE_ITEM_ID||row.source_item_id);
    let label='';
    let hintEs='';
    if(template==='VOCAB_01'){
      label=clean(row.STEM||row.stem);
      const correct=upper(row.CORRECT_OPTION||row.correct_option||'A');
      hintEs=optionValue(row,['A','B','C','D'].includes(correct)?correct:'A');
    }else if(template==='VOCAB_02'){
      label=clean(row.MATCH_LEFT||row.match_left);
      hintEs=clean(row.MATCH_RIGHT||row.match_right);
    }
    return Object.freeze({
      wordId:sourceItemId,
      sourceItemId,
      playItemId:clean(row.PLAY_ITEM_ID||row.play_item_id),
      levelId:upper(row.LEVEL_ID||row.level_id),
      unitId:upper(row.UNIT_ID||row.unit_id),
      templateId:template,
      label,
      gridWord:gridWord(label),
      hintEs,
    });
  }

  function vocabularyFromRows(rows){
    const seen=new Set();
    return Object.freeze((Array.isArray(rows)?rows:[])
      .filter(supported)
      .map(canonicalRow)
      .filter(item=>{
        if(!item.wordId||!item.label||item.gridWord.length<3||item.gridWord.length>GRID_SIZE||seen.has(item.sourceItemId)) return false;
        seen.add(item.sourceItemId);
        return true;
      }));
  }

  function validatePool(rows){
    const words=vocabularyFromRows(rows);
    const ids=new Set(words.map(item=>item.sourceItemId));
    const tokens=new Set(words.map(item=>item.gridWord));
    const long=words.filter(item=>item.gridWord.length>GRID_SIZE).map(item=>item.label);
    return Object.freeze({
      ok:words.length===WORD_COUNT&&ids.size===WORD_COUNT&&tokens.size===WORD_COUNT&&long.length===0,
      version:VERSION,
      gameId:GAME_ID,
      levelId:LEVEL_ID,
      unitId:UNIT_ID,
      count:words.length,
      uniqueSources:ids.size,
      uniqueGridWords:tokens.size,
      oversized:Object.freeze(long),
    });
  }

  function publicContract(){
    return Object.freeze({
      version:VERSION,
      gameId:GAME_ID,
      enabledUnits:Object.freeze([UNIT_ID]),
      gridSize:GRID_SIZE,
      wordCount:WORD_COUNT,
      directions:DIRECTIONS,
      supportedTemplates:SUPPORTED_TEMPLATES,
      curriculum:CURRICULUM,
      backendStatus:'PENDING_UNIFIED_APPS_SCRIPT',
    });
  }

  global.EnglishLabWordSearchCurriculumCS21A199=Object.freeze({
    VERSION,GAME_ID,LEVEL_ID,UNIT_ID,GRID_SIZE,WORD_COUNT,DIRECTIONS,SUPPORTED_TEMPLATES,CURRICULUM,
    clean,upper,ascii,gridWord,supported,canonicalRow,vocabularyFromRows,validatePool,publicContract,
  });
})(window);
