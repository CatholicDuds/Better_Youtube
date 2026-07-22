$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot
$project = Join-Path $projectRoot "desktop\Clarity.CodexLauncher\Clarity.CodexLauncher.csproj"
$publishDirectory = Join-Path $projectRoot "desktop\Clarity.CodexLauncher\bin\Release\net10.0-windows\win-x64\publish"
$distributionDirectory = Join-Path $projectRoot "dist"

$env:NEXT_PUBLIC_DESKTOP_APP = "true"
$env:NEXT_PUBLIC_BASE_PATH = ""
Push-Location $projectRoot
try {
    pnpm run build
    if ($LASTEXITCODE -ne 0) { throw "Falha ao gerar a interface gráfica do Clarity." }
} finally {
    Pop-Location
}

dotnet publish $project -c Release -r win-x64 --self-contained true
if ($LASTEXITCODE -ne 0) { throw "Falha ao compilar o Clarity Curator." }

New-Item -ItemType Directory -Path $distributionDirectory -Force | Out-Null
Copy-Item -LiteralPath (Join-Path $publishDirectory "Clarity.exe") -Destination (Join-Path $distributionDirectory "Clarity.exe") -Force
Write-Host "Aplicativo gráfico criado em: $(Join-Path $distributionDirectory 'Clarity.exe')"
