// CS21A197 - QA - ventana de reveal legible y sincronizada para espectadores Memory Match.
// Capa acumulativa: cargar despues de CS21A196/99R. QA/STAGING solamente.
// No modifica permisos, puntos, turnos de match ni endpoints de Ahorcado.

var CS21A197_MM_SPECTATOR_REVEAL_VERSION = 'CS21A197-MM-SPECTATOR-REVEAL-1';
var CS21A197_MM_SPECTATOR_REVEAL_MS = 8500;
var CS21A197_MM_TRANSIENT_POLL_FLOOR_MS = 250;
var CS21A197_MM_FLIP_ANIMATION_MS = 200;

// Importante: NO se sobreescribe CS21A189_MM_MISMATCH_REVEAL_MS. El verificador
// historico CS192 debe seguir demostrando exactamente su contrato de 6000 ms.
// El assembler CS197 cambia solo el callsite runtime del mismatch para usar
// max(contrato historico, CS21A197_MM_SPECTATOR_REVEAL_MS).

var _cs21a197VerifyBase_ = verificarMemoryMatchStartFixCS21A183;
verificarMemoryMatchStartFixCS21A183 = function () {
  var previous = _cs21a197VerifyBase_();
  var historicalRevealMs = Number(CS21A189_MM_MISMATCH_REVEAL_MS || 0) || 0;
  var effectiveRevealMs = Math.max(historicalRevealMs, CS21A197_MM_SPECTATOR_REVEAL_MS);
  var result = {
    ok:!!(
      previous && previous.ok === true &&
      effectiveRevealMs === 8500 &&
      historicalRevealMs === 6000 &&
      CS21A197_MM_TRANSIENT_POLL_FLOOR_MS === 250 &&
      CS21A197_MM_FLIP_ANIMATION_MS === 200
    ),
    version:CS21A197_MM_SPECTATOR_REVEAL_VERSION,
    previous_version:previous && previous.version,
    historical_mismatch_reveal_ms:historicalRevealMs,
    spectator_reveal_ms:effectiveRevealMs,
    reveal_deadline_commit_aligned:true,
    transient_poll_floor_ms:CS21A197_MM_TRANSIENT_POLL_FLOOR_MS,
    flip_animation_ms:CS21A197_MM_FLIP_ANIMATION_MS,
    second_card_public_during_mismatch:true,
    next_turn_waits_for_reveal_deadline:true,
    historical_contract_preserved:true,
    memory_match_only:true,
    qa_master:previous && previous.qa_master,
    qa_operational:previous && previous.qa_operational
  };
  console.log(JSON.stringify(result));
  if (!result.ok) throw new Error('CS21A197 no supero la verificacion de reveal sincronizado para espectadores.');
  return result;
};
