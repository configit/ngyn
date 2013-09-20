@echo off
FOR %%X in (node.exe) do (set NODE_FOUND=%%~$PATH:X)
IF NOT DEFINED NODE_FOUND (
  echo "Please install Nodejs (http://http://nodejs.org)"
  exit /b -1
  )

SET PHANTOMJS_BIN=%~dp0node_modules\phantomjs\lib\phantom\phantomjs.exe

cmd /c npm install
node "%~dp0node_modules\grunt-cli\bin\grunt" karma:background watch %*