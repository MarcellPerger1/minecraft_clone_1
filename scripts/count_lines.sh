find ./src -name "*.js" ! -wholename "**/libs/**" | xargs wc -l | tail -n1