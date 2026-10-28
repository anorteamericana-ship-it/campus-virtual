# F111 R34-B -- finalize ONE read-only public frontend snapshot, never overwrite.
$ErrorActionPreference='Stop'
$root='C:\Users\leodr\Documents\CampusVirtual\F111_OFICIAL'
$folder=Join-Path $root '_RESPALDO_FRONTEND_LIVE_R34B_20261028'
$manifestPath=Join-Path $folder 'manifest.json'
$zipPath=Join-Path $root 'F111_R34B_FRONTEND_PUBLIC_20261028.zip'
if(Test-Path -LiteralPath $zipPath){throw 'ZIP_ALREADY_EXISTS_NOT_OVERWRITING'}
$m=Get-Content -LiteralPath $manifestPath -Raw -Encoding UTF8|ConvertFrom-Json
if($m.files -ne 137 -or $m.errors -ne 1 -or @($m.unavailable).Count -ne 1 -or $m.unavailable[0].path -ne 'css2'){throw 'UNEXPECTED_SNAPSHOT_STATE'}
$allHtml=Get-Content -LiteralPath (Join-Path $folder 'files\campus.html') -Raw -Encoding UTF8
if(-not $allHtml.Contains('fonts.googleapis.com/css2')){throw 'UNVERIFIED_EXTERNAL_FONT_REF'}
$verified=0
foreach($e in $m.entries){
 $full=Join-Path (Join-Path $folder 'files') $e.path
 if(-not (Test-Path -LiteralPath $full)){throw ('MISSING_ASSET '+$e.path)}
 $sha=(Get-FileHash -LiteralPath $full -Algorithm SHA256).Hash.ToLowerInvariant()
 $size=(Get-Item -LiteralPath $full).Length
 if($sha -ne $e.sha256 -or $size -ne [int64]$e.bytes){throw ('ASSET_INTEGRITY_FAIL '+$e.path)}
 $verified++
}
if($verified -ne 137){throw 'UNEXPECTED_FILECOUNT'}
$m | Add-Member -NotePropertyName external_dependencies -NotePropertyValue @('fonts.googleapis.com CSS2 (external, not part of Campus origin)') -Force
$m | Add-Member -NotePropertyName excluded_external_refs -NotePropertyValue @('css2: extracted pathname from external Google Fonts CSS2 reference; never a local Campus resource') -Force
$m.unavailable=@()
$m.errors=0
$m | Add-Member -NotePropertyName verified_sha256_count -NotePropertyValue $verified -Force
$m | Add-Member -NotePropertyName restore_status -NotePropertyValue 'STATIC_PUBLIC_ASSETS_VERIFIED_ONLY_NOT_FULL_DEPLOY_RESTORE' -Force
$m | ConvertTo-Json -Depth 12|Set-Content -LiteralPath $manifestPath -Encoding UTF8
Compress-Archive -Path (Join-Path $folder 'files'),$manifestPath -DestinationPath $zipPath -CompressionLevel Optimal
Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip=[System.IO.Compression.ZipFile]::OpenRead($zipPath)
try{
 $entries=@($zip.Entries)
 if($entries.Count -lt 138){throw 'ZIP_ENTRIES_INCOMPLETE'}
 $hasManifest=@($entries|Where-Object{$_.FullName -match '(^|/)manifest.json$'}).Count -gt 0
 if(-not $hasManifest){throw 'ZIP_MANIFEST_MISSING'}
}finally{$zip.Dispose()}
$hash=(Get-FileHash -LiteralPath $zipPath -Algorithm SHA256).Hash
Write-Output ('R34B_BACKUP_VERIFIED_ASSETS='+$verified)
Write-Output ('R34B_ZIP_ENTRIES='+$entries.Count)
Write-Output ('R34B_ZIP_SHA256='+$hash)
Write-Output ('R34B_ZIP_SIZE='+(Get-Item -LiteralPath $zipPath).Length)
Write-Output ('R34B_ZIP_LOCATION='+$zipPath)
