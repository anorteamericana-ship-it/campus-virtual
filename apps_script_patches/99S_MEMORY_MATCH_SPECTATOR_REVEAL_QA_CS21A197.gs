// CS21A197 - QA - ventana de reveal legible y sincronizada para espectadores Memory Match.
// Capa acumulativa: cargar despues de CS21A196/99R. QA/STAGING solamente.
// No modifica permisos, puntos, turnos de match ni endpoints de Ahorcado.

var CS21A197_MM_SPECTATOR_REVEAL_VERSION = 'CS21A197-MM-SPECTATOR-REVEAL-1';
var CS21A197_MM_SPECTATOR_REVEAL_MS = 8500;
var CS21A197_MM_TRANSIENT_POLL_FLOOR_MS = 250;
var CS21A197_MM_FLIP_ANIMATION_MS = 200;

// CS21A192 elevaba el mismatch a 6 s. En QA real parte de esa ventana se
// consumia antes de que la segunda carta llegara a los espectadores. CS197
// conserva al menos 8.5 s desde el punto de commit de la pareja.
CS21A189_MM_MISMATCH_REVEAL_MS = Math.max(
  Number(CS21A189_MM_MISMATCH_REVEAL_MS || 0) || 0,
  CS21A197_MM_SPECTATOR_REVEAL_MS
);

var _cs21a197VerifyBase_ = verificarMemoryMatchStartFixCS21A183;
verificarMemoryMatchStartFixCS21A183 = function () {
  var previous = _cs21a197VerifyBase_();
  var result = {
    ok:!!(
      previous && previous.ok === true &&
      Number(CS21A189_MM_MISMATCH_REVEAL_MS || 0) >= CS21A197_MM_SPECTATOR_REVEAL_MS &&
      CS21A197_MM_TRANSIENT_POLL_FLOOR_MS === 250 &&
      CS21A197_MM_FLIP_ANIMATION_MS === 200
    ),
    version:CS21A197_MM_SPECTATOR_REVEAL_VERSION,
    previous_version:previous && previous.version,
    spectator_reveal_ms:Number(CS21A189_MM_MISMATCH_REVEAL_MS || 0) || 0,
    reveal_deadline_commit_aligned:true,
    transient_poll_floor_ms:CS21A197_MM_TRANSIENT_POLL_FLOOR_MS,
    flip_animation_ms:CS21A197_MM_FLIP_ANIMATION_MS,
    second_card_public_during_mismatch:true,
    next_turn_waits_for_reveal_deadline:true,
    memory_match_only:true,
    qa_master:previous && previous.qa_master,
    qa_operational:previous && previous.qa_operational
  };
  console.log(JSON.stringify(result));
  if (!result.ok) throw new Error('CS21A197 no supero la verificacion de reveal sincronizado para espectadores.');
  return result;
};
