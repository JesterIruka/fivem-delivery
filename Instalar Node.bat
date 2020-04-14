@ECHO OFF
set NULL_VAL=null
set NODE_VER=%NULL_VAL%

node -v >.tmp_nodever
set /p NODE_VER=<.tmp_nodever
del .tmp_nodever

IF "%NODE_VER%"=="%NULL_VAL%" (
    echo.
    echo Node.js nao esta instalado, aperte qualquer tecla para abrir o site e baixar o instalador.
    PAUSE
    start "" https://nodejs.org/dist/v12.16.2/node-v12.16.2-x64.msi
    echo.
    echo.
    echo Execute o instalador, e feche esta janela em seguida.
    PAUSE
    EXIT
) ELSE (
    echo Voce ja possui uma versao do Node.js instalada ^(%NODE_VER%^).
)
pause