@echo off
echo 启动股票数据分析平台...

:: 创建必要的目录
if not exist logs mkdir logs
if not exist temp mkdir temp

:: 默认配置
set JDBC_URL=jdbc:postgresql://dbconn.sealoshzh.site:36671/postgres?directConnection=true
set USERNAME=postgres
set PASSWORD=7w6mlhvv
set SERVER_PORT=8080

:: 使用环境变量允许覆盖默认配置
if not "%DB_URL%"=="" set JDBC_URL=%DB_URL%
if not "%DB_USER%"=="" set USERNAME=%DB_USER%
if not "%DB_PASS%"=="" set PASSWORD=%DB_PASS%
if not "%SERVER_PORT%"=="" set SERVER_PORT=%SERVER_PORT%

:: 启动Java应用
java -Xms512m -Xmx1024m ^
     -Djava.io.tmpdir=./temp ^
     -Dserver.port=%SERVER_PORT% ^
     -Dspring.datasource.url="%JDBC_URL%" ^
     -Dspring.datasource.username="%USERNAME%" ^
     -Dspring.datasource.password="%PASSWORD%" ^
     -Dserver.tomcat.basedir=./temp ^
     -jar stock-0.0.1-SNAPSHOT.jar 