@echo off
setlocal
cd /d "%~dp0"

echo.
echo ==========================================
echo  AutoParts CallCenter - Criar instalador
echo ==========================================
echo.

where npm >nul 2>nul
if errorlevel 1 (
  echo Nao encontrei o Node.js / npm neste computador.
  echo Instala primeiro o Node.js LTS: https://nodejs.org/
  echo.
  pause
  exit /b 1
)

echo A instalar dependencias...
call npm install
if errorlevel 1 (
  echo.
  echo Falhou a instalacao das dependencias.
  pause
  exit /b 1
)

echo.
echo A criar setup Windows...
call npm run setup
if errorlevel 1 (
  echo.
  echo Falhou a criacao do setup.
  pause
  exit /b 1
)

echo.
echo Instalador criado na pasta dist.
echo.
pause
