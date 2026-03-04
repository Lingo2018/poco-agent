#!/bin/bash
# NAS 专用启动脚本
# 解决 NAS 环境无法访问 ghcr.io 拉取镜像的问题

set -e

echo "=== Poco Agent NAS 启动脚本 ==="

# 确保本地镜像有正确的 tag
if docker images --format '{{.Repository}}:{{.Tag}}' | grep -q "^poco-executor:local$"; then
  echo "检测到本地镜像 poco-executor:local，创建 ghcr.io 标签..."
  docker tag poco-executor:local ghcr.io/poco-ai/poco-executor:full 2>/dev/null && \
    echo "[ok] Tagged poco-executor:local -> ghcr.io/poco-ai/poco-executor:full"
  docker tag poco-executor:local ghcr.io/poco-ai/poco-executor:lite 2>/dev/null && \
    echo "[ok] Tagged poco-executor:local -> ghcr.io/poco-ai/poco-executor:lite"
fi

# 启动服务（跳过拉取镜像）
echo "启动服务..."
./scripts/quickstart.sh --no-pull-executor "$@"
