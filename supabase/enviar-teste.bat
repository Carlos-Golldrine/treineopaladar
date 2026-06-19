@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo Enviando UMA notificacao de teste para todos os inscritos...
echo.
node --env-file=.env enviar-teste.mjs %*
echo.
pause
