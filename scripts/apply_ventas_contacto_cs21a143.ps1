param()

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$repoRoot = Split-Path -Parent $PSScriptRoot
$drawerPath = Join-Path $repoRoot 'src\ventas_drawer.jsx'
$ventasHtmlPath = Join-Path $repoRoot 'ventas.html'

if (-not (Test-Path -LiteralPath $drawerPath -PathType Leaf)) { throw "No existe $drawerPath" }
if (-not (Test-Path -LiteralPath $ventasHtmlPath -PathType Leaf)) { throw "No existe $ventasHtmlPath" }

$utf8 = [System.Text.UTF8Encoding]::new($false)
$drawer = [System.IO.File]::ReadAllText($drawerPath, [System.Text.Encoding]::UTF8)
$ventasHtml = [System.IO.File]::ReadAllText($ventasHtmlPath, [System.Text.Encoding]::UTF8)

$oldInfo = @'
                <dl className="vx-kv">
                  <dt>Correo</dt><dd>{d.correo || '—'} <button className="vx-copy" onClick={() => copy(d.correo)}>copiar</button></dd>
                  <dt>Teléfono</dt><dd>{window.fmtTelV(d.telefono)} <button className="vx-copy" onClick={() => copy(d.telefono)}>copiar</button></dd>
                  <dt>WhatsApp</dt><dd>
'@

$newInfo = @'
                <dl className="vx-kv">
                  <dt>Cédula</dt><dd>{String(d.cedula || '').replace(/\D/g, '') || '—'} <button className="vx-copy" onClick={() => copy(String(d.cedula || '').replace(/\D/g, ''))}>copiar</button></dd>
                  <dt>Teléfono</dt><dd>{window.fmtTelV(d.telefono)} <button className="vx-copy" onClick={() => copy(d.telefono)}>copiar</button></dd>
                  <dt>Correo</dt><dd>{d.correo || '—'} <button className="vx-copy" onClick={() => copy(d.correo)}>copiar</button></dd>
                  <dt>WhatsApp</dt><dd>
'@

$oldFooter = @'
                <button className="vx-btn vx-btn-ghost" style={{ flex: 1 }} onClick={() => setModal('nota')}>
                  <window.Vico d={window.VI.doc} size={14} /> Agregar nota
                </button>
'@

$newFooter = @'
                <button className="vx-btn vx-btn-ghost" style={{ flex: 1.25 }}
                  onClick={llamarWhatsApp} disabled={!waNum}
                  title={waNum ? 'Abrir WhatsApp' : 'Sin número registrado'}>
                  <window.Vico d={window.VI.wa} size={16} fill="currentColor" /> Abrir WhatsApp
                </button>
'@

function Replace-ExactlyOnce {
  param([string]$Text, [string]$Old, [string]$New, [string]$Label)
  $first = $Text.IndexOf($Old, [System.StringComparison]::Ordinal)
  if ($first -lt 0) { throw "No encontré preimagen exacta: $Label" }
  $second = $Text.IndexOf($Old, $first + $Old.Length, [System.StringComparison]::Ordinal)
  if ($second -ge 0) { throw "La preimagen aparece más de una vez: $Label" }
  return $Text.Substring(0, $first) + $New + $Text.Substring($first + $Old.Length)
}

$drawer2 = Replace-ExactlyOnce -Text $drawer -Old $oldInfo -New $newInfo -Label 'Información personal'
$drawer2 = Replace-ExactlyOnce -Text $drawer2 -Old $oldFooter -New $newFooter -Label 'Footer Agregar nota -> Abrir WhatsApp'

$oldCache = 'src/ventas_drawer.jsx?v=F98.4Z6PERF1'
$newCache = 'src/ventas_drawer.jsx?v=F98.4Z6CS21A143CONTACT1'
$ventasHtml2 = Replace-ExactlyOnce -Text $ventasHtml -Old $oldCache -New $newCache -Label 'cache-buster ventas_drawer'

# Compuertas del cambio solicitado.
if (($drawer2 -split '<dt>Cédula</dt>').Count -ne 2) { throw 'Debe existir exactamente una fila Cédula nueva.' }
if (-not $drawer2.Contains("String(d.cedula || '').replace(/\D/g, '')")) { throw 'La cédula no quedó normalizada sin guiones.' }
if (-not $drawer2.Contains("Abrir WhatsApp")) { throw 'No quedó el botón Abrir WhatsApp.' }
if ($drawer2.Contains("<window.Vico d={window.VI.doc} size={14} /> Agregar nota")) { throw 'El botón duplicado Agregar nota sigue en el footer.' }
if (-not $drawer2.Contains("{savingNota ? <><span className=\"vx-spin\" /> Guardando…</> : 'Agregar nota'}")) { throw 'Se perdió el formulario real de notas.' }

[System.IO.File]::WriteAllText($drawerPath, $drawer2, $utf8)
[System.IO.File]::WriteAllText($ventasHtmlPath, $ventasHtml2, $utf8)

Write-Host '=== CS21A143 · CONTACTO VENTAS ==='
Write-Host 'PASS Cédula agregada sin guiones + copiar'
Write-Host 'PASS orden: Cédula -> Teléfono -> Correo -> WhatsApp'
Write-Host 'PASS footer: Agregar nota -> Abrir WhatsApp'
Write-Host 'PASS formulario de notas inferior preservado'
Write-Host 'PASS cache-buster ventas_drawer actualizado'
Write-Host ''
Write-Host 'Archivos modificados:'
Write-Host '  src/ventas_drawer.jsx'
Write-Host '  ventas.html'
