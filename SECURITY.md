# 安全配置指南

## 概述

本文档详细说明了智能知识助手的安全防护措施和配置方法。

## 安全防护措施

### 1. 注册安全

#### 多重验证
- **邮箱验证**: 必须使用有效邮箱地址
- **手机号验证**: 必须使用真实手机号码接收短信验证码
- **图形验证码**: 防止机器人自动注册
- **密码强度检查**: 至少8位，包含字母和数字

#### 频率限制
- **注册冷却**: 同一IP地址1分钟内只能注册一次
- **短信限制**: 同一手机号每日最多发送5条验证码，每次间隔1分钟
- **验证码有效期**: 5分钟内有效

### 2. 登录安全

#### 防暴力破解
- **尝试限制**: 同一账号5次失败后锁定15分钟
- **IP限制**: 同一IP地址异常登录会被临时封禁
- **设备记录**: 记录常用登录设备，异常设备需要额外验证

#### 会话管理
- **JWT令牌**: 使用安全的JWT令牌进行身份验证
- **自动过期**: 令牌7天后自动过期，需要重新登录
- **单点登录**: 支持多设备登录，但会记录所有活跃会话

### 3. 数据安全

#### 多租户隔离
- **组织隔离**: 每个组织的数据完全隔离
- **权限控制**: 用户只能访问自己组织的数据
- **API鉴权**: 所有API请求都需要有效的身份验证

#### 数据加密
- **传输加密**: 所有数据传输使用HTTPS
- **存储加密**: 敏感数据在存储时进行加密
- **密码哈希**: 用户密码使用bcrypt进行哈希存储

## 短信服务配置

### 推荐服务商

#### 1. 阿里云短信服务 ⭐⭐⭐⭐⭐
```bash
# 优势
- 免费额度: 100条/月
- 价格: 0.045元/条
- 到达率: 99%+
- 支持国际短信

# 配置
REACT_APP_ALIYUN_ACCESS_KEY_ID=your_access_key_id
REACT_APP_ALIYUN_ACCESS_KEY_SECRET=your_access_key_secret
```

#### 2. 腾讯云短信服务 ⭐⭐⭐⭐
```bash
# 优势  
- 免费额度: 新用户100条
- 价格: 0.045元/条
- 接入简单
- 文档完善

# 配置
REACT_APP_TENCENT_SECRET_ID=your_secret_id
REACT_APP_TENCENT_SECRET_KEY=your_secret_key
REACT_APP_TENCENT_SMS_SDK_APP_ID=your_sdk_app_id
```

#### 3. 网易云信 ⭐⭐⭐
```bash
# 优势
- 免费额度: 100条/日
- 价格: 0.05元/条
- 适合小规模应用

# 配置
REACT_APP_NETEASE_APP_KEY=your_app_key
REACT_APP_NETEASE_APP_SECRET=your_app_secret
```

### 配置步骤

#### 阿里云短信服务配置

1. **注册阿里云账号**
   - 访问 https://www.aliyun.com
   - 完成实名认证

2. **开通短信服务**
   - 进入短信服务控制台
   - 申请签名和模板
   - 获取AccessKey

3. **配置环境变量**
   ```bash
   # 在.env文件中添加
   REACT_APP_ALIYUN_ACCESS_KEY_ID=your_access_key_id
   REACT_APP_ALIYUN_ACCESS_KEY_SECRET=your_access_key_secret
   ```

4. **短信模板示例**
   ```
   模板名称: 注册验证码
   模板内容: 您的注册验证码是：${code}，5分钟内有效，请勿泄露。
   ```

#### 腾讯云短信服务配置

1. **注册腾讯云账号**
   - 访问 https://cloud.tencent.com
   - 完成实名认证

2. **开通短信服务**
   - 进入短信控制台
   - 创建应用
   - 申请签名和模板

3. **配置环境变量**
   ```bash
   REACT_APP_TENCENT_SECRET_ID=your_secret_id
   REACT_APP_TENCENT_SECRET_KEY=your_secret_key
   REACT_APP_TENCENT_SMS_SDK_APP_ID=your_sdk_app_id
   ```

## 安全最佳实践

### 1. 环境变量管理
```bash
# 生产环境
NODE_ENV=production

# API配置
REACT_APP_API_URL=https://your-api-domain.com

# 短信服务配置
REACT_APP_SMS_PROVIDER=aliyun
REACT_APP_ALIYUN_ACCESS_KEY_ID=***
REACT_APP_ALIYUN_ACCESS_KEY_SECRET=***

# 安全配置
REACT_APP_JWT_SECRET=your-super-secret-key
REACT_APP_ENCRYPTION_KEY=your-encryption-key
```

### 2. 前端安全
- **输入验证**: 所有用户输入都进行验证和清理
- **XSS防护**: 防止跨站脚本攻击
- **CSRF防护**: 防止跨站请求伪造
- **内容安全策略**: 配置CSP头部

### 3. 后端安全
- **API限流**: 防止API被恶意调用
- **SQL注入防护**: 使用参数化查询
- **文件上传安全**: 限制文件类型和大小
- **日志记录**: 记录所有安全相关事件

### 4. 部署安全
- **HTTPS强制**: 所有流量都使用HTTPS
- **安全头部**: 配置安全相关的HTTP头部
- **定期更新**: 及时更新依赖包和系统补丁
- **监控告警**: 配置安全监控和告警

## 应急响应

### 安全事件处理流程

1. **发现阶段**
   - 监控系统告警
   - 用户举报
   - 安全扫描发现

2. **响应阶段**
   - 立即隔离受影响系统
   - 评估影响范围
   - 通知相关人员

3. **恢复阶段**
   - 修复安全漏洞
   - 恢复正常服务
   - 验证修复效果

4. **总结阶段**
   - 分析事件原因
   - 完善安全措施
   - 更新应急预案

## 联系方式

如发现安全问题，请立即联系：

- 📧 安全邮箱: wwwaaannn7878@163.com
- 🔒 加密通信: 支持PGP加密
- ⚡ 紧急联系: 24小时内响应

## 安全更新

- 定期发布安全更新
- 关注CVE漏洞公告
- 及时修复已知问题
- 持续改进安全措施
