@echo off

cmd /c npm install
node "%~dp0node_modules\grunt-cli\bin\grunt" build