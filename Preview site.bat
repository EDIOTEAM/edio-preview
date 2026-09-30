@echo off
rem Opens the EDIO website in your browser with the 3D models working.
rem (Double-clicking index.html blocks 3D in the browser; this serves the folder like the live site.)
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools\preview-server.ps1"
