#!/usr/bin/env bash
# 服务器上一键更新：拉代码 → 装依赖 → 构建 → 重启
# 用法：bash deploy/update.sh
set -e

cd "$(dirname "$0")/.."

echo "==> 拉取最新代码"
git pull --ff-only

echo "==> 安装依赖"
npm ci

echo "==> 构建"
npm run build

echo "==> 重启服务"
pm2 restart shiguang

echo "==> 最近日志"
pm2 logs shiguang --lines 20 --nostream
