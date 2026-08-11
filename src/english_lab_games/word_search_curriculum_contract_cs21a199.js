// CS21A199-R2 · Contrato curricular público para Word Search.
// Frontend-only: prepara el juego para consumir ACADEMIA_PLAY_BANK cuando se consolide el backend Live.
(function installEnglishLabWordSearchCurriculumCS21A199(global){
  'use strict';
  if(!global || global.EnglishLabWordSearchCurriculumCS21A199) return;

  const VERSION='CS21A199-R2';
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
    levelId:LEVEL_ID,unitId:UNIT_ID,unitTitle:"What's your name?",lessons:Object.freeze([1,2]),
    focus:'Vocabulary recognition and spelling',
    objectiveEs:'Reconocer y localizar vocabulario clave de la Unidad 1 reforzando forma escrita, ortografía y asociación básica de significado.',
    source:'APOLLO_G3 · ACADEMIA_PLAY_BANK',officialGrade:false,status:'QA_FOUNDATION',
  });

  function clean(value){return String(value==null?'':value).replace(/\s+/g,' ').trim();}
  function upper(value){return clean(value).toUpperCase();}
  function ascii(value){return upper(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'');}
  function gridWord(value){return ascii(value).replace(/[^A-Z]/g,'');}
  function optionValue(row,key){const letter=upper(key);return clean(row && row['OPTION_'+letter]);}
  function rowStatus(row){return upper(row?.STATUS||row?.status);}
  function validCorrectOption(row){
    const correct=upper(row?.CORRECT_OPTION||row?.correct_option);
    return ['A','B','C','D'].includes(correct) && !!optionValue(row,correct);
  }
  function supported(row){
    const level=upper(row?.LEVEL_ID||row?.level_id),unit=upper(row?.UNIT_ID||row?.unit_id),area=upper(row?.AREA_ID||row?.area_id);
    const template=upper(row?.TEMPLATE_ID||row?.template_id),type=upper(row?.ITEM_TYPE||row?.item_type);
    if(level!==LEVEL_ID||unit!==UNIT_ID||area!=='VOCAB'||rowStatus(row)!=='ACTIVE')return false;
    const spec=SUPPORTED_TEMPLATES.find(item=>item.templateId===template&&item.itemType===type);
    if(!spec)return false;
    if(template==='VOCAB_01')return validCorrectOption(row);
    if(template==='VOCAB_02')return !!clean(row?.MATCH_LEFT||row?.match_left)&&!!clean(row?.MATCH_RIGHT||row?.match_right);
    return false;
  }

  function canonicalRow(input){
    const row=input&&typeof input==='object'?input:{},template=upper(row.TEMPLATE_ID||row.template_id),sourceItemId=clean(row.SOURCE_ITEM_ID||row.source_item_id);
    let label='',hintEs='';
    if(template==='VOCAB_01'){
      label=clean(row.STEM||row.stem);
      const correct=upper(row.CORRECT_OPTION||row.correct_option);
      if(!['A','B','C','D'].includes(correct))return null;
      hintEs=optionValue(row,correct);
    }else if(template==='VOCAB_02'){
      label=clean(row.MATCH_LEFT||row.match_left);hintEs=clean(row.MATCH_RIGHT||row.match_right);
    }
    const token=gridWord(label);
    if(!sourceItemId||!label||!hintEs||token.length<3)return null;
    return Object.freeze({wordId:sourceItemId,sourceItemId,playItemId:clean(row.PLAY_ITEM_ID||row.play_item_id),levelId:upper(row.LEVEL_ID||row.level_id),unitId:upper(row.UNIT_ID||row.unit_id),templateId:template,label,gridWord:token,hintEs});
  }

  function analyzeRows(rows){
    const source=Array.isArray(rows)?rows:[],accepted=[],rejected=[];
    source.forEach((row,index)=>{
      if(!supported(row)){rejected.push(Object.freeze({index,sourceItemId:clean(row?.SOURCE_ITEM_ID||row?.source_item_id),reason:'UNSUPPORTED_OR_INCOMPLETE'}));return;}
      const item=canonicalRow(row);if(!item){rejected.push(Object.freeze({index,sourceItemId:clean(row?.SOURCE_ITEM_ID||row?.source_item_id),reason:'INVALID_CANONICAL_ROW'}));return;}
      accepted.push(item);
    });
    return Object.freeze({accepted:Object.freeze(accepted),rejected:Object.freeze(rejected)});
  }

  function vocabularyFromRows(rows){
    const analyzed=analyzeRows(rows),seenSources=new Set(),seenTokens=new Set();
    return Object.freeze(analyzed.accepted.filter(item=>{
      if(item.gridWord.length>GRID_SIZE||seenSources.has(item.sourceItemId)||seenTokens.has(item.gridWord))return false;
      seenSources.add(item.sourceItemId);seenTokens.add(item.gridWord);return true;
    }));
  }

  function validatePool(rows){
    const analyzed=analyzeRows(rows),words=vocabularyFromRows(rows),ids=new Set(words.map(item=>item.sourceItemId)),tokens=new Set(words.map(item=>item.gridWord));
    const oversized=analyzed.accepted.filter(item=>item.gridWord.length>GRID_SIZE).map(item=>item.label);
    const duplicateTokens=[];const tokenSeen=new Set();analyzed.accepted.forEach(item=>{if(tokenSeen.has(item.gridWord)&&!duplicateTokens.includes(item.gridWord))duplicateTokens.push(item.gridWord);tokenSeen.add(item.gridWord);});
    return Object.freeze({
      ok:words.length===WORD_COUNT&&ids.size===WORD_COUNT&&tokens.size===WORD_COUNT&&oversized.length===0&&duplicateTokens.length===0,
      version:VERSION,gameId:GAME_ID,levelId:LEVEL_ID,unitId:UNIT_ID,count:words.length,uniqueSources:ids.size,uniqueGridWords:tokens.size,
      oversized:Object.freeze(oversized),duplicateGridWords:Object.freeze(duplicateTokens),rejected:Object.freeze(analyzed.rejected.slice()),
    });
  }

  function publicContract(){return Object.freeze({version:VERSION,gameId:GAME_ID,enabledUnits:Object.freeze([UNIT_ID]),gridSize:GRID_SIZE,wordCount:WORD_COUNT,directions:DIRECTIONS,supportedTemplates:SUPPORTED_TEMPLATES,curriculum:CURRICULUM,backendStatus:'PENDING_UNIFIED_APPS_SCRIPT'});}

  global.EnglishLabWordSearchCurriculumCS21A199=Object.freeze({VERSION,GAME_ID,LEVEL_ID,UNIT_ID,GRID_SIZE,WORD_COUNT,DIRECTIONS,SUPPORTED_TEMPLATES,CURRICULUM,clean,upper,ascii,gridWord,optionValue,rowStatus,validCorrectOption,supported,canonicalRow,analyzeRows,vocabularyFromRows,validatePool,publicContract});
})(window);
