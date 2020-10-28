@echo off

set dBase=src\
set dWatch=src\
set dOut=html\vfu-support\

pug -b %dBase% -w %dWatch% -o %dOut% -P