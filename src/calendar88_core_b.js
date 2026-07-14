// F98.4-Z6-CS21A88 · Calendar core B
(function () {
  'use strict';

  const core = window.__AN_CAL88;
  if (!core) throw new Error('CS21A88 core A no está cargado.');

  core.normalizeText = function (value) {
    let text = core.text(value);
    try {
      text = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    } catch (_) {}
    return text.toUpperCase().replace(/\s+/g, ' ').trim();
  };

  core.levelId = function (value) {
    const text = core.normalizeText(value);
    if (['B1', 'BASICO I', 'BASICO 1'].includes(text)) return 'B1';
    if (['B2', 'BASICO II', 'BASICO 2'].includes(text)) return 'B2';
    if (['I1', 'INTERMEDIO I', 'INTERMEDIO 1'].includes(text)) return 'I1';
    if (['I2', 'INTERMEDIO II', 'INTERMEDIO 2'].includes(text)) return 'I2';
    return text || 'B1';
  };

  core.sourceCategory = function (group) {
    const raw = core.normalizeText(
      group && (group.estadoCategoria || group.estadoGrupo || group.comentario)
    );
    if (group && group.esApertura) return 'APERTURA';
    if (raw === 'PROYECTADO' || raw === 'APERTURA') return 'APERTURA';
    if (raw === 'COMPLETADO' || raw === 'CERRADO' || raw === 'FINALIZADO') return 'CERRADO';
    if (raw === 'ACTIVO' || raw === 'EN CURSO' || raw === 'CURSANDO') return 'ACTIVO';
    return 'REVISAR';
  };

  core.normalizeLesson = function (lesson) {
    if (!lesson || !core.text(lesson.fecha)) return null;
    return Object.assign({}, lesson, {
      leccion: Number(lesson.leccion || 0),
      fecha: core.text(lesson.fecha).slice(0, 10),
      tipo: core.normalizeText(lesson.tipo || lesson.tipo_leccion || 'CLASE') || 'CLASE',
      estado: core.normalizeText(lesson.estado || 'PROGRAMADA') || 'PROGRAMADA'
    });
  };

  core.normalizeGroup = function (rawGroup) {
    if (!rawGroup) return null;
    const code = core.text(rawGroup.code || rawGroup.cod_grupo || rawGroup.codigoBase);
    if (!code) return null;

    const level = core.levelId(rawGroup.nivelId || rawGroup.nivel);
    const lessons = (Array.isArray(rawGroup.lecciones) ? rawGroup.lecciones : [])
      .map(core.normalizeLesson)
      .filter(Boolean)
      .sort(function (a, b) {
        return a.fecha.localeCompare(b.fecha) || a.leccion - b.leccion;
      });

    return Object.assign({}, rawGroup, {
      code: code,
      nivelId: level,
      lecciones: lessons,
      docente: core.text(rawGroup.docente) || 'Por definir',
      dias: core.text(rawGroup.dias || rawGroup.diasCode),
      hora: core.text(rawGroup.hora),
      estadoFuente: core.sourceCategory(rawGroup)
    });
  };
})();