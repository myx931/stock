#!/bin/bash

# 简单的启动脚本用于股票数据分析平台

# 创建必要的目录
mkdir -p logs
mkdir -p temp

# 启动应用
echo "启动股票数据分析平台..."

# 设置数据库连接
JDBC_URL="jdbc:postgresql://dbconn.sealoshzh.site:36671/postgres?directConnection=true"
USERNAME="postgres"
PASSWORD="7w6mlhvv"

# 使用环境变量允许覆盖默认配置
DB_URL=${DB_URL:-$JDBC_URL}
DB_USER=${DB_USER:-$USERNAME}
DB_PASS=${DB_PASS:-$PASSWORD}
SERVER_PORT=${SERVER_PORT:-8080}

# 启动Java应用
java -Xms512m -Xmx1024m \
     -Djava.io.tmpdir=./temp \
     -Dserver.port=$SERVER_PORT \
     -Dspring.datasource.url="$DB_URL" \
     -Dspring.datasource.username="$DB_USER" \
     -Dspring.datasource.password="$DB_PASS" \
     -Dserver.tomcat.basedir=./temp \
     -jar stock-0.0.1-SNAPSHOT.jar

# 脚本结束后应用也会终止 