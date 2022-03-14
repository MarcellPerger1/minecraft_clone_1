GREEN="\033[0;32m"
NC="\033[0m"
npx eslint --max-warnings 1 $@ ./
if test $? -eq 0
then
  echo -e "${GREEN}No errors found.${NC}"
fi