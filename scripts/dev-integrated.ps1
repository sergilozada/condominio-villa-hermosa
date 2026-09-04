$ErrorActionPreference = "Stop"

function New-LocalSecret {
  $randomBytes = New-Object byte[] 32
  $randomGenerator = [System.Security.Cryptography.RandomNumberGenerator]::Create()

  try {
    $randomGenerator.GetBytes($randomBytes)
  }
  finally {
    $randomGenerator.Dispose()
  }

  return [Convert]::ToBase64String($randomBytes).TrimEnd("=").Replace("+", "-").Replace("/", "_")
}

function Import-LocalEnvironment {
  param(
    [Parameter(Mandatory = $true)]
    [string] $Path
  )

  foreach ($rawLine in [System.IO.File]::ReadAllLines($Path)) {
    $line = $rawLine.Trim().TrimStart([char] 0xFEFF)
    if (-not $line -or $line.StartsWith("#")) {
      continue
    }

    $separatorIndex = $line.IndexOf("=")
    if ($separatorIndex -le 0) {
      continue
    }

    $name = $line.Substring(0, $separatorIndex).Trim()
    $value = $line.Substring($separatorIndex + 1)
    if ($name -match "^[A-Za-z_][A-Za-z0-9_]*$") {
      [Environment]::SetEnvironmentVariable($name, $value, "Process")
    }
  }
}

function Resolve-PythonCommand {
  foreach ($commandName in @("python", "python3")) {
    $command = Get-Command $commandName -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($command) {
      return @{
        FilePath = $command.Source
        PrefixArguments = @()
      }
    }
  }

  $pythonLauncher = Get-Command "py" -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($pythonLauncher) {
    return @{
      FilePath = $pythonLauncher.Source
      PrefixArguments = @("-3")
    }
  }

  if ($env:USERPROFILE) {
    $codexPython = Join-Path $env:USERPROFILE ".cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe"
    if (Test-Path -LiteralPath $codexPython -PathType Leaf) {
      return @{
        FilePath = $codexPython
        PrefixArguments = @()
      }
    }
  }

  throw "No se encontro Python 3 en PATH ni en el runtime local de Codex."
}

$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$minutesRoot = Join-Path $projectRoot "services\minutas"
$serverEntryPoint = Join-Path $minutesRoot "server.py"
$localEnvironmentPath = Join-Path $minutesRoot ".env.local"
$databasePath = Join-Path $minutesRoot "data\villahermosa-integrated.db"
$viteCommand = Join-Path $projectRoot "node_modules\.bin\vite.cmd"

if (-not (Test-Path -LiteralPath $serverEntryPoint -PathType Leaf)) {
  throw "No se encontro el servicio de minutas en $serverEntryPoint"
}
if (-not (Test-Path -LiteralPath $viteCommand -PathType Leaf)) {
  throw "No se encontro Vite. Ejecuta 'npm install' en la raiz de Prueba y vuelve a intentarlo."
}

if (-not (Test-Path -LiteralPath $localEnvironmentPath -PathType Leaf)) {
  $adminPassword = New-LocalSecret
  $advisorPassword = New-LocalSecret
  $utf8WithoutBom = New-Object System.Text.UTF8Encoding($false)
  $environmentLines = @(
    "VH_HOST=127.0.0.1",
    "VH_PORT=8010",
    "VH_ALLOW_EMBED=1",
    "VH_COOKIE_SECURE=0",
    "VH_DATABASE_PATH=$databasePath",
    "VH_ADMIN_EMAIL=admin@villahermosa.com",
    "VH_ADMIN_PASSWORD=$adminPassword",
    "VH_ASESOR_EMAIL=asesor@villahermosa.com",
    "VH_ASESOR_PASSWORD=$advisorPassword"
  )

  [System.IO.File]::WriteAllLines($localEnvironmentPath, $environmentLines, $utf8WithoutBom)
  Write-Host "Configuracion privada creada en services/minutas/.env.local (ignorada por Git)."
}

Import-LocalEnvironment -Path $localEnvironmentPath

# Estas opciones siempre son locales, aunque el archivo se haya creado en una ejecucion anterior.
$env:VH_HOST = "127.0.0.1"
$env:VH_PORT = "8010"
$env:VH_ALLOW_EMBED = "1"
$env:VH_COOKIE_SECURE = "0"
$env:VH_DATABASE_PATH = $databasePath

if (-not $env:VH_ADMIN_PASSWORD -or $env:VH_ADMIN_PASSWORD.Length -lt 16) {
  throw "La credencial local de administrador no existe o no cumple la longitud minima."
}
if (-not $env:VH_ASESOR_PASSWORD -or $env:VH_ASESOR_PASSWORD.Length -lt 16) {
  throw "La credencial local de asesor no existe o no cumple la longitud minima."
}

Write-Host ""
Write-Host "Accesos locales de Minutas (solo se muestran en esta terminal):" -ForegroundColor Cyan
Write-Host "  Administrador: $env:VH_ADMIN_EMAIL / $env:VH_ADMIN_PASSWORD"
Write-Host "  Asesor:        $env:VH_ASESOR_EMAIL / $env:VH_ASESOR_PASSWORD"
Write-Host "  Archivo privado: services/minutas/.env.local (ignorado por Git)"
Write-Host ""

$pythonCommand = Resolve-PythonCommand
$serverArguments = @($pythonCommand.PrefixArguments) + @("server.py")
$pythonProcess = $null
$viteExitCode = 0

try {
  $pythonProcess = Start-Process `
    -FilePath $pythonCommand.FilePath `
    -ArgumentList $serverArguments `
    -WorkingDirectory $minutesRoot `
    -WindowStyle Hidden `
    -PassThru

  $serviceReady = $false
  $readinessDeadline = [DateTime]::UtcNow.AddSeconds(20)

  while ([DateTime]::UtcNow -lt $readinessDeadline) {
    if ($pythonProcess.HasExited) {
      throw "El servicio de minutas termino antes de quedar disponible."
    }

    try {
      $healthResponse = Invoke-WebRequest `
        -Uri "http://127.0.0.1:8010/api/health" `
        -UseBasicParsing `
        -TimeoutSec 1
      if ($healthResponse.StatusCode -eq 200) {
        $serviceReady = $true
        break
      }
    }
    catch {
      Start-Sleep -Milliseconds 250
    }
  }

  if (-not $serviceReady) {
    throw "El servicio de minutas no respondio en http://127.0.0.1:8010/api/health."
  }

  Write-Host "Servicio de minutas listo en http://127.0.0.1:8010"
  Write-Host "Iniciando el panel integrado..."

  Push-Location $projectRoot
  try {
    & $viteCommand
    if ($null -ne $LASTEXITCODE) {
      $viteExitCode = $LASTEXITCODE
    }
  }
  finally {
    Pop-Location
  }
}
finally {
  if ($pythonProcess -and -not $pythonProcess.HasExited) {
    Stop-Process -Id $pythonProcess.Id -Force -ErrorAction SilentlyContinue
    $pythonProcess.WaitForExit()
  }
}

exit $viteExitCode
