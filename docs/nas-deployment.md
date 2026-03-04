# NAS 部署问题排查指南

本文档记录在 NAS（如群晖）上部署 Poco Agent 时遇到的常见问题及解决方案。

## 问题1：Executor 代理配置冲突

### 症状
Executor 无法连接 LiteLLM，报 connection error 或 proxy connection timeout。

### 原因
`.env` 中设置了 `API_PROXY=socks5://172.17.0.1:10808`，但 executor → litellm 是 Docker 内网通信，不需要代理。代理设置会导致内网请求被错误地转发到代理服务器。

### 解决方案
注释掉 `.env` 中的 `API_PROXY`：
```bash
sed -i 's/^API_PROXY=/#API_PROXY=/' .env
```

然后重启 executor-manager：
```bash
docker compose up -d --force-recreate executor-manager
```

---

## 问题2：LiteLLM 认证错误 "No connected db"

### 症状
API 返回 400 错误，错误信息为 "No connected db" 或 ProxyException。

### 原因
新版 LiteLLM（1.x+）默认启用认证，即使 `LITELLM_MASTER_KEY` 为空也会尝试验证。需要明确禁用认证功能。

### 解决方案
在 `litellm_config.yaml` 末尾添加以下配置：
```yaml
general_settings:
  disable_end_user_cost_tracking: true
  enable_jwt_auth: false
  enforce_user_param: false
  allow_user_auth: false
  master_key: null
```

然后重启 LiteLLM：
```bash
docker compose restart litellm
```

---

## 问题3：OpenRouter 地区限制 403

### 症状
API 返回 403 错误，错误信息为 "This model is not available in your region"。

### 原因
LiteLLM 容器需要通过代理才能访问 OpenRouter API（中国大陆地区限制）。

### 解决方案
在 `docker-compose.yml` 的 litellm 服务 environment 中添加代理环境变量：
```yaml
litellm:
  environment:
    OPENROUTER_API_KEY: ${OPENROUTER_API_KEY:-}
    LITELLM_MASTER_KEY: ${LITELLM_MASTER_KEY:-}
    HTTPS_PROXY: socks5://172.17.0.1:10808
    HTTP_PROXY: socks5://172.17.0.1:10808
    ALL_PROXY: socks5://172.17.0.1:10808
```

> **注意**：`172.17.0.1` 是 Docker 默认网桥的网关 IP，指向宿主机。确保宿主机上的代理服务监听在 `0.0.0.0:10808` 或允许来自 Docker 网络的连接。

然后重启 LiteLLM：
```bash
docker compose up -d --force-recreate litellm
```

---

## 合并上游分支前检查清单

从上游仓库合并代码后，请确保以下配置保持正确：

| 检查项 | 位置 | 要求 |
|--------|------|------|
| API_PROXY | `.env` | 应保持**注释状态**（executor 不需要代理） |
| general_settings | `litellm_config.yaml` | 需包含禁用认证的配置 |
| 代理环境变量 | `docker-compose.yml` litellm 服务 | 需配置 HTTPS_PROXY/HTTP_PROXY/ALL_PROXY |

### 快速验证命令

```bash
# 检查 API_PROXY 是否被注释
grep "^API_PROXY" .env && echo "警告: API_PROXY 未注释！"

# 检查 litellm_config.yaml 是否包含 general_settings
grep -q "general_settings" litellm_config.yaml || echo "警告: 缺少 general_settings！"

# 检查 docker-compose.yml 中 litellm 是否配置代理
grep -A20 "litellm:" docker-compose.yml | grep -q "HTTPS_PROXY" || echo "警告: litellm 缺少代理配置！"
```

---

## 问题4：Executor 镜像拉取失败（DNS 超时）

### 症状
任务卡在 "Hatching" 状态，executor-manager 日志显示：
```
docker.errors.APIError: 500 Server Error ... dial tcp: lookup ghcr.io on 8.8.4.4:53: i/o timeout
```

### 原因
NAS 网络环境无法访问 ghcr.io，executor-manager 尝试拉取 `ghcr.io/poco-ai/poco-executor:full` 镜像时 DNS 解析超时。

### 解决方案
使用本地构建的镜像，手动创建 tag：
```bash
docker tag poco-executor:local ghcr.io/poco-ai/poco-executor:full
docker tag poco-executor:local ghcr.io/poco-ai/poco-executor:lite
```

或使用 NAS 专用启动脚本 `start-nas.sh`（会自动处理）。

---

## NAS 启动脚本使用说明

NAS 环境推荐使用 `start-nas.sh` 脚本，它会自动处理镜像 tag 问题。

### 使用场景

| 场景 | 命令 |
|------|------|
| 首次部署 / 更新本地镜像后 | `./start-nas.sh` |
| 日常重启服务 | `docker compose up -d` |
| 修改 .env 配置后生效 | `docker compose up -d --force-recreate` |

### 脚本说明

- `./scripts/quickstart.sh` - 官方脚本，会从 ghcr.io 拉取镜像（需要网络通畅）
- `./start-nas.sh` - NAS 专用脚本，使用本地镜像，跳过网络拉取

**NAS 上统一用 `./start-nas.sh` 启动即可。**

---

## 代理配置总结

| 服务 | 是否需要代理 | 原因 |
|------|-------------|------|
| Executor | ❌ 不需要 | 连接 LiteLLM 是 Docker 内网通信 |
| LiteLLM | ✅ 需要 | 访问 OpenRouter 等外部 API |
| Backend | ❌ 不需要 | 只处理内部 API 请求 |
| Frontend | ❌ 不需要 | 通过 Backend 代理 API 请求 |
