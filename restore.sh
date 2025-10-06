
#!/bin/bash

# Скрипт восстановления из бэкапа PostgreSQL через Node.js
if [ -z "$1" ]; then
  echo "Использование: $0 <путь_к_файлу_бэкапа>"
  exit 1
fi

cd /home/ubuntu/production_cost_system
NODE_PATH=./app/node_modules node restore-node.js "$1"
