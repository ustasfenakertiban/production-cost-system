
#!/bin/bash

# Скрипт автоматического бэкапа PostgreSQL базы данных через Node.js
cd /home/ubuntu/production_cost_system
NODE_PATH=./app/node_modules node backup-node.js
