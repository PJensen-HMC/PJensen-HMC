$watchPath = "S:\PJ\make-it-small"
$workPath = "C:\temp\make-it-small-wip"
$ffmpeg = "ffmpeg"

if (-not (Test-Path $workPath)) {
    New-Item -ItemType Directory -Path $workPath -Force | Out-Null
}

function Wait-ForStableFile {
    param(
        [string]$Path,
        [int]$StableChecks = 3,
        [int]$DelaySeconds = 2,
        [int]$MaxAttempts = 60
    )

    $lastSize = -1
    $stableCount = 0

    for ($i = 0; $i -lt $MaxAttempts; $i++) {
        if (-not (Test-Path $Path)) {
            Start-Sleep -Seconds $DelaySeconds
            continue
        }

        try {
            $item = Get-Item $Path -ErrorAction Stop
            $size = $item.Length

            if ($size -eq $lastSize) {
                $stableCount++
            }
            else {
                $stableCount = 0
            }

            $lastSize = $size

            if ($stableCount -ge $StableChecks) {
                return $true
            }
        }
        catch {
        }

        Start-Sleep -Seconds $DelaySeconds
    }

    return $false
}

function Convert-ToSmallMp3 {
    param([string]$InputFile)

    if (-not (Test-Path $InputFile)) { return }
    if ([System.IO.Path]::GetExtension($InputFile).ToLower() -ne ".mp3") { return }

    $directory = [System.IO.Path]::GetDirectoryName($InputFile)
    $baseName = [System.IO.Path]::GetFileNameWithoutExtension($InputFile)

    if ($baseName -like "*-small") { return }

    $outputFile = Join-Path $directory ($baseName + "-small.mp3")

    if (Test-Path $outputFile) {
        Write-Host "Skipping; output exists: $outputFile"
        return
    }

    Write-Host "Waiting for copy to finish: $InputFile"
    if (-not (Wait-ForStableFile -Path $InputFile)) {
        Write-Host "Timed out waiting for stable file: $InputFile"
        return
    }

    if (Test-Path $outputFile) {
        Write-Host "Skipping; output exists: $outputFile"
        return
    }

    $localInput = Join-Path $workPath ($baseName + ".mp3")
    $localOutput = Join-Path $workPath ($baseName + "-small.mp3")

    try {
        Write-Host "Copying local: $InputFile"
        Copy-Item $InputFile $localInput -Force

        Write-Host "Converting at 64k: $localInput"
        & $ffmpeg -hide_banner -loglevel error -nostdin -y `
            -i $localInput `
            -vn `
            -c:a libmp3lame `
            -b:a 64k `
            $localOutput

        if ($LASTEXITCODE -ne 0 -or -not (Test-Path $localOutput)) {
            Write-Host "ffmpeg failed: $InputFile"
            return
        }

        Write-Host "Moving back: $outputFile"
        Move-Item $localOutput $outputFile -Force

        Write-Host "Done: $outputFile"
    }
    catch {
        Write-Host "Error processing ${InputFile}: $_"
    }
    finally {
        if (Test-Path $localInput)  { Remove-Item $localInput -Force -ErrorAction SilentlyContinue }
        if (Test-Path $localOutput) { Remove-Item $localOutput -Force -ErrorAction SilentlyContinue }
    }
}

Get-ChildItem -Path $watchPath -Filter *.mp3 -File | ForEach-Object {
    Convert-ToSmallMp3 $_.FullName
}

$watcher = New-Object System.IO.FileSystemWatcher
$watcher.Path = $watchPath
$watcher.Filter = "*.mp3"
$watcher.IncludeSubdirectories = $false
$watcher.EnableRaisingEvents = $true

$action = {
    $path = $Event.SourceEventArgs.FullPath
    Convert-ToSmallMp3 $path
}

Register-ObjectEvent $watcher Created -Action $action | Out-Null
Register-ObjectEvent $watcher Renamed -Action $action | Out-Null

Write-Host "Watching $watchPath for MP3 files. Press Ctrl+C to stop."

while ($true) {
    Start-Sleep -Seconds 5
}
