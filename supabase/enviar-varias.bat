@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo Enviando VARIAS notificacoes (enche a barra) para todos os inscritos...
echo.
node --env-file=.env enviar-varias.mjs %*
echo.
pause
