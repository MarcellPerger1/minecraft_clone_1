find . ! -wholename "**/libs/**" ! -wholename "**/node_modules/**" ! -wholename "**/res/**" ! -name "package-lock.json" ! -wholename "**/.cache/**" ! -wholename "**/.config/**" \
\( -name "*.js" \
  -o -name "*.[mc]js" \
  -o -name "*.json" \
  -o -name "*.css" \
  -o -name "*.html" \
  -o -name "*.sh" \
  -o -name "*.yml" \
  -o -name "*.glsl" \
\)