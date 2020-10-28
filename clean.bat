rem Pug-CLI does not offer the convenience of excluding files from the file
rem modification watch list. Run this script before before deploying to
rem remove unnecessary files

set d=html\includes\
if exist %d% rmdir %d% /q /s