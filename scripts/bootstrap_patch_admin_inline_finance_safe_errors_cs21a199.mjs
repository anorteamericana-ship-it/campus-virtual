import fs from 'node:fs';

const path = 'src/admin_students_inline_payment_cs21a36.jsx';
let src = fs.readFileSync(path, 'utf8');

function count(needle) { return src.split(needle).length - 1; }
function replaceOnce(oldText, newText, label) {
  const n = count(oldText);
  if (n !== 1) throw new Error(`${label}: expected 1 exact preimage, found ${n}`);
  src = src.replace(oldText, newText);
  console.log(`${label}: replaced 1`);
}

replaceOnce(
`function requestId(){try{if(globalThis.crypto?.randomUUID)return 'PAY-'+crypto.randomUUID();}catch(_){}return \`PAY-\${Date.now().toString(36)}-\${Math.random().toString(36).slice(2)}-\${Math.random().toString(36).slice(2)}\`;}

async function postInline(fn,payload={},timeoutMs=35000){`,
`function requestId(){try{if(globalThis.crypto?.randomUUID)return 'PAY-'+crypto.randomUUID();}catch(_){}return \`PAY-\${Date.now().toString(36)}-\${Math.random().toString(36).slice(2)}-\${Math.random().toString(36).slice(2)}\`;}

function inlineFinanceSafeUserError(raw, fallback, context = '') {
  const msg=String(raw==null?'':raw).trim();
  if(!msg)return fallback;
  const technicalCode=/^[a-z0-9.-]+(?:_[a-z0-9.-]+)+$/i.test(msg);
  const technicalText=/apps?\\s*script|backend|endpoint|stack|exception|trace|typeerror|referenceerror|syntaxerror|rangeerror|networkerror|aborterror|failed to fetch|network request failed|<html|\\bjson\\b|\\btoken\\b|unauthorized|forbidden|internal server|http\\s*\\d{3}|status\\s*\\d{3}|respuesta inv[aá]lida|request[_ -]?id|getEstudiante|getComprobantes|aplicarPago/i.test(msg);
  if(technicalCode||technicalText){
    console.warn('[AdminInlineFinance] Detalle técnico oculto al operador.',{context,error:msg});
    return fallback;
  }
  return msg;
}

async function postInline(fn,payload={},timeoutMs=35000){`,
'insert finance safe-error boundary'
);

replaceOnce(
`.catch(e=>alive&&setError(e?.message||String(e))).finally(()=>alive&&setLoading(false));`,
`.catch(e=>alive&&setError(inlineFinanceSafeUserError(e?.message || String(e), 'No pudimos cargar la información financiera. Intentá de nuevo.', 'cargar_finanzas'))).finally(()=>alive&&setLoading(false));`,
'finance load catch'
);

replaceOnce(
`    }catch(e){setError(e?.message||String(e));}finally{setSearching(false);}
  }

  async function selectReceipt(item){`,
`    }catch(e){setError(inlineFinanceSafeUserError(e?.message || String(e), 'No pudimos buscar los comprobantes. Intentá de nuevo.', 'buscar_comprobante'));}finally{setSearching(false);}
  }

  async function selectReceipt(item){`,
'receipt search catch'
);

replaceOnce(
`    catch(e){setReceipt(null);setError(e?.message||String(e));}finally{setSearching(false);}`,
`    catch(e){setReceipt(null);setError(inlineFinanceSafeUserError(e?.message || String(e), 'No pudimos actualizar el comprobante. Intentá de nuevo.', 'seleccionar_comprobante'));}finally{setSearching(false);}`,
'receipt select catch'
);

replaceOnce(
`    }catch(e){setError(e?.message||String(e));}finally{setApplying(false);}
  }

  return <div style={{border:'1px solid #DCD5CC'`,
`    }catch(e){setError(inlineFinanceSafeUserError(e?.message || String(e), 'No pudimos aplicar el pago. Revisá los datos e intentá de nuevo.', 'aplicar_pago'));}finally{setApplying(false);}
  }

  return <div style={{border:'1px solid #DCD5CC'`,
'payment apply catch'
);

fs.writeFileSync(path,src,'utf8');
console.log('CS21A199 exact inline finance safe-error patch applied');
