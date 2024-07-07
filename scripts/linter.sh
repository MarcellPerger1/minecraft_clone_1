GREEN="\033[0;32m"
NC="\033[0m"
npx eslint --max-warnings 0 "$@" ./
ret=$?
if test $ret -eq 0
then
  echo -e "${GREEN}No errors found.${NC}"
else
  exit $ret  
fi
