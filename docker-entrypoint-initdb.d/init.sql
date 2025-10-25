-- 创建数据库和用户（如果不存在）
-- 这个脚本会在PostgreSQL容器首次启动时执行

-- 设置默认编码
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;

-- 创建扩展（如果需要的话）
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 输出初始化完成信息
\echo 'Database initialization completed successfully!'