$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot
$project = Join-Path $projectRoot "desktop\Clarity.CodexLauncher\Clarity.CodexLauncher.csproj"
$publishDirectory = Join-Path $projectRoot "desktop\Clarity.CodexLauncher\bin\Release\net10.0-windows\win-x64\publish"
$distributionDirectory = Join-Path $projectRoot "dist"

dotnet publish $project -c Release -r win-x64 --self-contained true
if ($LASTEXITCODE -ne 0) { throw "Falha ao compilar o Clarity Curator." }

New-Item -ItemType Directory -Path $distributionDirectory -Force | Out-Null
Copy-Item -LiteralPath (Join-Path $publishDirectory "ClarityCurator.exe") -Destination (Join-Path $distributionDirectory "ClarityCurator.exe") -Force
Write-Host "Executável criado em: $(Join-Path $distributionDirectory 'ClarityCurator.exe')"
