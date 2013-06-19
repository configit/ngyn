@echo off

SET MSBUILD=C:\Windows\Microsoft.NET\Framework\v4.0.30319\msbuild.exe
SET TARGET=%1
SET CONFIGURATION=%2

:: Test if correct version of msbuild is installed
IF NOT EXIST %MSBUILD% (
  ECHO msbuild.exe version 4.0.30319.1 doesn't exist. Install Visual Studio 2010 or greater.
  EXIT /B
)

:: Set default target to Test
IF %TARGET%.==. (
  SET TARGET=Test
)

:: Now run msbuild
%MSBUILD% /t:%TARGET% /v:n /nologo Build.proj