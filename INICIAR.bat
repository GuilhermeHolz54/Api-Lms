@echo off
cd /d "%~dp0"
echo Iniciando PRISMA LMS API...
docker compose up -d --build
if errorlevel 1 (
  echo.
  echo ERRO: confira se o Docker Desktop esta aberto e tente novamente.
  pause
  exit /b 1
)
echo.
echo Containers iniciados. Aguarde alguns instantes para a API ficar pronta.
start "" http://localhost:3000/api-docs
pause
