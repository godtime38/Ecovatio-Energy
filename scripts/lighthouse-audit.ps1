param([string]$Label = 'final', [int]$Runs = 3)
$ErrorActionPreference = 'Stop'
$env:CHROME_PATH = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
$lighthouseEntry = Get-ChildItem "$PSScriptRoot/../.cache/npm/_npx" -Directory | ForEach-Object { Join-Path $_.FullName 'node_modules/lighthouse/cli/index.js' } | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $lighthouseEntry) { throw 'Install Lighthouse into .cache/npm first.' }
$reportDirectory = Join-Path $PSScriptRoot '../reports/lighthouse'
New-Item -ItemType Directory -Force $reportDirectory | Out-Null
foreach ($device in @('mobile', 'desktop')) {
    for ($run = 1; $run -le $Runs; $run++) {
        $arguments = @($lighthouseEntry, 'http://127.0.0.1:8765/', '--chrome-flags=--headless=new', '--output=json', '--output=html', "--output-path=$reportDirectory/$Label-$device-$run", '--quiet')
        if ($device -eq 'desktop') { $arguments += '--preset=desktop' }
        & node @arguments
        if ($LASTEXITCODE -ne 0) { throw "Lighthouse failed: $device $run" }
        Write-Output "Completed $Label $device $run"
    }
}
