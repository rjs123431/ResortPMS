param(
	[string]$RootPath = (Get-Location).Path,
	[string]$OldName = "PMS",
	[string]$NewName = "PMS"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Replace-TextInFile {
	param(
		[Parameter(Mandatory = $true)]
		[string]$FilePath,
		[Parameter(Mandatory = $true)]
		[string]$OldText,
		[Parameter(Mandatory = $true)]
		[string]$NewText
	)

	$content = Get-Content -Path $FilePath -Raw -Encoding UTF8 -ErrorAction Stop
	if (-not [string]::IsNullOrEmpty($content) -and $content.Contains($OldText)) {
		$updated = $content.Replace($OldText, $NewText)
		if ($updated -ne $content) {
			Set-Content -Path $FilePath -Value $updated -Encoding UTF8 -NoNewline
			Write-Host "Updated content: $FilePath"
		}
	}
}

if (-not (Test-Path -Path $RootPath -PathType Container)) {
	throw "Root path does not exist: $RootPath"
}

$root = (Resolve-Path -Path $RootPath).Path
Write-Host "Root path: $root"
Write-Host "Replacing '$OldName' -> '$NewName'"

# 1) Replace text in files first.
$files = Get-ChildItem -Path $root -Recurse -File -Force |
	Where-Object {
		$_.FullName -notmatch "[\\/]\.git[\\/]" -and
		$_.FullName -notmatch "[\\/]bin[\\/]" -and
		$_.FullName -notmatch "[\\/]obj[\\/]" -and
		$_.FullName -notmatch "[\\/]node_modules[\\/]" -and
		$_.FullName -notmatch "[\\/]dist[\\/]" -and
		$_.FullName -notmatch "[\\/]dev-dist[\\/]"
	}

foreach ($file in $files) {
	try {
		Replace-TextInFile -FilePath $file.FullName -OldText $OldName -NewText $NewName
	}
	catch {
		# Skip binary/non-UTF8 files without failing the entire run.
		Write-Host "Skipped file: $($file.FullName)"
	}
}

# 2) Rename files (deepest first to avoid path conflicts).
$filesToRename = Get-ChildItem -Path $root -Recurse -File -Force |
	Where-Object { $_.Name.Contains($OldName) } |
	Sort-Object { $_.FullName.Length } -Descending

foreach ($file in $filesToRename) {
	$newFileName = $file.Name.Replace($OldName, $NewName)
	if ($newFileName -ne $file.Name) {
		Rename-Item -LiteralPath $file.FullName -NewName $newFileName
		Write-Host "Renamed file: $($file.FullName) -> $newFileName"
	}
}

# 3) Rename directories (deepest first so children are handled before parents).
$dirsToRename = Get-ChildItem -Path $root -Recurse -Directory -Force |
	Where-Object { $_.Name.Contains($OldName) } |
	Sort-Object { $_.FullName.Length } -Descending

foreach ($dir in $dirsToRename) {
	$newDirName = $dir.Name.Replace($OldName, $NewName)
	if ($newDirName -ne $dir.Name) {
		Rename-Item -LiteralPath $dir.FullName -NewName $newDirName
		Write-Host "Renamed folder: $($dir.FullName) -> $newDirName"
	}
}

Write-Host "Done. Replacement completed successfully."


