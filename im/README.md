## Poco IM 服务（独立）

该服务用于：

- 通过 IM（当前实现：Telegram / 钉钉）发起任务、续聊、回答 AskQuestion/Plan Approval
- 通过轮询 Backend 的公开 API 发送通知（完成/失败/需要输入）

设计目标：

- **与 Backend 数据库完全解耦**：IM 使用独立数据库（默认 `sqlite:///./im.db`）
- **Backend 单独运行不受影响**：不启用 IM 时，现有系统照常工作
- **多 IM 可扩展**：通过统一消息模型和发送网关接入不同平台

### 运行

在 `im/` 目录：

```bash
uv sync
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8002
```

### 环境变量（示例）

```bash
# IM service
DATABASE_URL=sqlite:///./im.db
BACKEND_URL=http://localhost:8000
BACKEND_USER_ID=default
FRONTEND_PUBLIC_URL=http://localhost:3000
FRONTEND_DEFAULT_LANG=zh

# Polling
POLL_USER_INPUT_INTERVAL_SECONDS=2
POLL_SESSION_MESSAGES_INTERVAL_SECONDS=2
POLL_SESSIONS_RECENT_INTERVAL_SECONDS=5
POLL_SESSIONS_FULL_INTERVAL_SECONDS=300
POLL_HTTP_TIMEOUT_SECONDS=10

# Telegram
TELEGRAM_BOT_TOKEN=123:abc
TELEGRAM_WEBHOOK_SECRET_TOKEN=

# DingTalk
DINGTALK_ENABLED=true
DINGTALK_WEBHOOK_TOKEN=
# Stream Mode（推荐，用于“收消息/事件推送/卡片回调”，无需公网 webhook）
DINGTALK_STREAM_ENABLED=true
# 可选：订阅全量事件（EVENT topic="*"），默认 false（事件较多）
DINGTALK_STREAM_SUBSCRIBE_EVENTS=false
# OpenAPI（推荐，用于“主动发消息/通知”，不依赖 sessionWebhook）
DINGTALK_CLIENT_ID=
DINGTALK_CLIENT_SECRET=
DINGTALK_ROBOT_CODE=
DINGTALK_OPEN_BASE_URL=https://api.dingtalk.com
# 可选：仅出站的固定 webhook（兜底/通知用，通常是“群自定义机器人”的 webhook）
DINGTALK_WEBHOOK_URL=
```

### Webhook

- Telegram: `POST /api/v1/webhooks/telegram`
- 钉钉（Webhook 模式可选）：`POST /api/v1/webhooks/dingtalk`（如使用 Stream 模式则不需要配置公网回调）

### IM 命令

- `/help`：查看完整命令列表
- `/list [n]`：查看最近会话（默认 10 条）
- `/connect <session_id|序号>`：连接会话（会自动订阅）
- `/new <任务>`：创建新会话并自动连接
- `/watch <session_id>`：订阅某个会话
- `/watches`：查看全部订阅
- `/unwatch <session_id|序号>`：取消订阅
- `/link`：查看当前连接会话
- `/clear`：清除当前会话绑定
- `/answer <request_id> {...}`：回答 AskQuestion
- `/answer <request_id> {"approved":"true|false"}`：回答 Plan Approval

普通文本：如果当前已连接会话，会作为续聊消息发送。

提示：在群聊里仅 `@机器人`（不带其他内容）会自动返回命令帮助（等价于 `/help`）。
