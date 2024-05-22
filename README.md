# 99AI 插件系统

## 简介

99AI 插件系统是为 [99AI](https://github.com/vastxie/99AI) 设计的插件扩展系统，旨在通过传入 `prompt` 字符串并返回处理后的结果，为 AI 赋能。该系统使用 NestJS 框架开发，支持插件化扩展，方便开发者根据需求进行自定义开发和维护。

## 已支持的插件

| 插件名称 | 插件参数   | 描述                                     |
| -------- | ---------- | ---------------------------------------- |
| 联网搜索 | net-search | 根据提示词返回联网的结果                 |
| 思维导图 | mind-map   | 生成 MarkDown 格式大纲，用户生成思维导图 |

## 系统部署

### 配置环境变量

- 复制`.env.example`文件为`.env`。
- 根据需要修改`.env`文件中的配置项。

### 安装

首先，确保你已经安装了 pnpm。然后在项目根目录下运行以下命令安装依赖：

```bash
$ pnpm install
$ pnpm build
```

### 运行应用

你可以使用以下命令在不同模式下运行应用：

```bash
# 开发模式
$ pnpm run start

# 监听模式
$ pnpm run start:dev

# 生产模式
$ pnpm run start:prod
```

或使用 `pm2` 运行

```bash
pm2 start pm2.config.json
```

## 插件示例

### 请求

```bash
curl -X POST "https://api.example.com/plugins/{pluginName}" \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_API_KEY" \
     -d '{
           "prompt": "深圳天气"
         }'
```

### 响应

```http
{
  "result": "深圳今天下雷"
}
```

## 贡献

欢迎大家共同维护开发 99AI 插件系统！如果你有任何建议或问题，请随时提交 Issue 或 Pull Request。一起为 AI 赋能，共同打造更强大的插件生态系统。

## 学习交流

扫码添加微信备注 `99`，拉交流群。（不接受私聊技术咨询，有问题优先群内交流）

<img src="https://github.com/vastxie/99AI/assets/24899308/ee20578f-063d-48d8-bff6-85ac3e38fe60" width="300">
