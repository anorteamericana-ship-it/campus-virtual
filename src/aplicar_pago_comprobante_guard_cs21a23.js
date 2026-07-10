// F98.4-Z6-CS21A23 · Guard visual del buscador de comprobantes agotados.
(function() {
  "use strict";
  const VERSION = "F98.4-Z6-CS21A23";
  function saldoDisponibleAP23(item) {
    if (!item) return 0;
    const directo = Number(item.saldo);
    const calculado = Number(item.credito || 0) - Number(item.aplicado || 0);
    const valor = Number.isFinite(directo) ? directo : calculado;
    return Number.isFinite(valor) ? Math.max(0, Math.round(valor * 100) / 100) : 0;
  }
  function normalizarDisponiblesAP23(lista) {
    const vistos = /* @__PURE__ */ new Set();
    return (Array.isArray(lista) ? lista : []).filter((item) => {
      const doc = String(item?.doc || "").trim();
      if (!doc || vistos.has(doc) || saldoDisponibleAP23(item) <= 9e-3) return false;
      vistos.add(doc);
      return true;
    }).map((item) => ({ ...item, saldo: saldoDisponibleAP23(item) }));
  }
  function Paso3APSeguroCS21A23({ comprobantes, setComprobantes, setComprSel, setPaso, setError }) {
    const [q, setQ] = React.useState("");
    const [cargandoCompr, setCargandoCompr] = React.useState(false);
    const [validandoDoc, setValidandoDoc] = React.useState("");
    const [errLocal, setErrLocal] = React.useState("");
    const cargar = React.useCallback(async () => {
      setCargandoCompr(true);
      setErrLocal("");
      try {
        if (typeof window.postAP !== "function") throw new Error("El módulo de pagos no publicó el conector postAP.");
        const data = await window.postAP({ fn: "getComprobantes", consulta_en: Date.now() });
        if (!data?.ok) throw new Error(data?.error || "Error al cargar comprobantes.");
        const disponibles = normalizarDisponiblesAP23(data.comprobantes);
        setComprobantes(disponibles);
      } catch (e) {
        setComprobantes([]);
        setErrLocal("Error al consultar saldos bancarios: " + (e?.message || e));
      } finally {
        setCargandoCompr(false);
      }
    }, [setComprobantes]);
    React.useEffect(() => {
      cargar();
    }, [cargar]);
    const seleccionar = React.useCallback(async (item) => {
      const doc = String(item?.doc || "").trim();
      if (!doc || validandoDoc) return;
      setValidandoDoc(doc);
      setErrLocal("");
      setError("");
      try {
        const data = await window.postAP({ fn: "getComprobantes", numero_documento: doc, consulta_en: Date.now() });
        if (!data?.ok) throw new Error(data?.error || "No se pudo validar el comprobante.");
        const frescos = normalizarDisponiblesAP23(data.comprobantes);
        const vigente = frescos.find((x) => String(x.doc || "").trim() === doc);
        if (!vigente || saldoDisponibleAP23(vigente) <= 9e-3) {
          setComprobantes((prev) => (Array.isArray(prev) ? prev : []).filter((x) => String(x?.doc || "").trim() !== doc));
          setComprSel(null);
          const mensaje = `El comprobante ${doc} ya no tiene saldo disponible y fue retirado de la lista.`;
          setErrLocal(mensaje);
          setError(mensaje);
          return;
        }
        setComprobantes((prev) => {
          const base = (Array.isArray(prev) ? prev : []).filter((x) => String(x?.doc || "").trim() !== doc);
          return normalizarDisponiblesAP23([vigente, ...base]);
        });
        setComprSel(vigente);
        setPaso(4);
      } catch (e) {
        const mensaje = "No se pudo confirmar el saldo antes de continuar: " + (e?.message || e);
        setErrLocal(mensaje);
        setError(mensaje);
      } finally {
        setValidandoDoc("");
      }
    }, [validandoDoc, setComprobantes, setComprSel, setPaso, setError]);
    const resultados = normalizarDisponiblesAP23(comprobantes).filter((item) => {
      const query = q.trim().toLowerCase();
      if (!query) return true;
      return String(item.doc || "").toLowerCase().includes(query) || String(item.descripcion || "").toLowerCase().includes(query) || String(item.fecha || "").toLowerCase().includes(query);
    });
    return React.createElement("div", { "data-payment-search-version": VERSION }, React.createElement("div", { style: { display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", flexWrap: "wrap", marginBottom: 6 } }, React.createElement("div", { style: { fontFamily: "var(--f-serif)", fontSize: 22, fontWeight: 500, color: "var(--an-navy-ink)" } }, "Buscar comprobante bancario"), React.createElement("button", { type: "button", onClick: cargar, disabled: cargandoCompr || !!validandoDoc, style: { padding: "7px 11px", border: "1px solid var(--line)", background: "var(--surface)", borderRadius: "var(--r-sm)", color: "var(--an-navy)", fontSize: 11, fontWeight: 800, cursor: cargandoCompr ? "wait" : "pointer", opacity: cargandoCompr ? 0.65 : 1 } }, cargandoCompr ? "Actualizando…" : "↻ Actualizar saldos")), React.createElement("div", { style: { fontSize: 13, color: "var(--ink-3)", marginBottom: 14 } }, "Se muestran únicamente comprobantes cuyo saldo fue confirmado en BDBANCARIO. El saldo se vuelve a validar al seleccionarlo."), React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10, background: "var(--surface)", border: "2px solid var(--an-granate)", borderRadius: "var(--r-md)", padding: "10px 16px", marginBottom: 14 } }, React.createElement("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "var(--an-granate)", strokeWidth: "2.5" }, React.createElement("circle", { cx: "11", cy: "11", r: "8" }), React.createElement("path", { d: "M21 21l-4.3-4.3" })), React.createElement("input", { value: q, onChange: (e) => setQ(e.target.value), autoFocus: true, placeholder: "N° documento, fecha o descripción…", style: { flex: 1, border: "none", outline: "none", fontFamily: "var(--f-mono)", fontSize: 14, background: "transparent" } })), errLocal && React.createElement("div", { style: { padding: "10px 14px", background: "color-mix(in srgb,#C00000 8%,white)", border: "1px solid #C00000", borderRadius: "var(--r-md)", color: "#C00000", fontSize: 13, marginBottom: 12 } }, "⚠ ", errLocal), cargandoCompr ? React.createElement("div", { style: { textAlign: "center", padding: 40, color: "var(--ink-3)", fontSize: 14 } }, "Consultando saldos reales…") : React.createElement("div", { className: "card", style: { padding: 0, overflow: "hidden" } }, React.createElement("table", { className: "table-soft", style: { fontSize: 12 } }, React.createElement("thead", null, React.createElement("tr", null, React.createElement("th", null, "Fecha"), React.createElement("th", null, "N° Documento"), React.createElement("th", null, "Descripción"), React.createElement("th", { style: { textAlign: "right" } }, "Crédito"), React.createElement("th", { style: { textAlign: "right" } }, "Saldo disponible"))), React.createElement("tbody", null, resultados.length ? resultados.map((item) => {
      const saldo = saldoDisponibleAP23(item);
      const validando = validandoDoc === String(item.doc || "").trim();
      return React.createElement("tr", { key: item.doc, onClick: () => seleccionar(item), style: { cursor: validando ? "wait" : "pointer", opacity: validando ? 0.6 : 1 }, "aria-busy": validando ? "true" : "false" }, React.createElement("td", { style: { fontFamily: "var(--f-mono)", fontSize: 11 } }, item.fecha), React.createElement("td", { style: { fontFamily: "var(--f-mono)", fontWeight: 700, color: "var(--an-navy)" } }, item.doc), React.createElement("td", { style: { maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }, item.descripcion), React.createElement("td", { style: { textAlign: "right", fontFamily: "var(--f-mono)" } }, "₡" + Number(item.credito || 0).toLocaleString("es-CR")), React.createElement("td", { style: { textAlign: "right" } }, React.createElement("span", { style: { fontFamily: "var(--f-mono)", fontWeight: 700, fontSize: 14, color: "#2E7D32" } }, validando ? "Validando…" : "₡" + saldo.toLocaleString("es-CR"))));
    }) : React.createElement("tr", null, React.createElement("td", { colSpan: 5, style: { textAlign: "center", color: "var(--ink-3)", padding: 24, fontStyle: "italic" } }, "Sin comprobantes con saldo disponible"))))));
  }
  function aplicarParche() {
    if (typeof window.Paso3AP !== "function") return false;
    if (window.Paso3AP === Paso3APSeguroCS21A23) return true;
    window.Paso3AP = Paso3APSeguroCS21A23;
    window.__AN_APLICAR_PAGO_COMPROBANTE_GUARD__ = { version: VERSION, saldoDisponibleAP23, normalizarDisponiblesAP23 };
    return true;
  }
  window.addEventListener("an:lazy-module-loaded", (event) => {
    const src = String(event?.detail?.src || "");
    if (src.includes("aplicar_pago.jsx")) aplicarParche();
  });
  setTimeout(aplicarParche, 0);
})();
