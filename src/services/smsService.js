// 短信服务配置
// 支持多个短信服务提供商

// 阿里云短信服务配置
const ALIYUN_SMS_CONFIG = {
  accessKeyId: process.env.REACT_APP_ALIYUN_ACCESS_KEY_ID,
  accessKeySecret: process.env.REACT_APP_ALIYUN_ACCESS_KEY_SECRET,
  signName: '智能知识助手',
  templateCode: 'SMS_123456789', // 替换为实际的模板ID
  endpoint: 'https://dysmsapi.aliyuncs.com'
};

// 腾讯云短信服务配置
const TENCENT_SMS_CONFIG = {
  secretId: process.env.REACT_APP_TENCENT_SECRET_ID,
  secretKey: process.env.REACT_APP_TENCENT_SECRET_KEY,
  sdkAppId: process.env.REACT_APP_TENCENT_SMS_SDK_APP_ID,
  signName: '智能知识助手',
  templateId: '123456', // 替换为实际的模板ID
  endpoint: 'sms.tencentcloudapi.com'
};

// 网易云信短信服务配置
const NETEASE_SMS_CONFIG = {
  appKey: process.env.REACT_APP_NETEASE_APP_KEY,
  appSecret: process.env.REACT_APP_NETEASE_APP_SECRET,
  templateId: '123456', // 替换为实际的模板ID
  endpoint: 'https://api.netease.im/sms/sendcode.action'
};

// 短信服务提供商枚举
export const SMS_PROVIDERS = {
  ALIYUN: 'aliyun',
  TENCENT: 'tencent',
  NETEASE: 'netease'
};

// 当前使用的短信服务提供商
const CURRENT_PROVIDER = SMS_PROVIDERS.ALIYUN;

// 生成6位数字验证码
export const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// 发送短信验证码
export const sendSMSVerificationCode = async (phone, code, type = 'register') => {
  try {
    switch (CURRENT_PROVIDER) {
      case SMS_PROVIDERS.ALIYUN:
        return await sendAliyunSMS(phone, code, type);
      case SMS_PROVIDERS.TENCENT:
        return await sendTencentSMS(phone, code, type);
      case SMS_PROVIDERS.NETEASE:
        return await sendNeteaseSMS(phone, code, type);
      default:
        throw new Error('未配置短信服务提供商');
    }
  } catch (error) {
    console.error('发送短信失败:', error);
    throw error;
  }
};

// 阿里云短信发送
const sendAliyunSMS = async (phone, code, type) => {
  // 这里应该调用阿里云SDK或API
  // 由于是前端代码，实际的短信发送应该在后端进行
  
  const response = await fetch('/api/sms/aliyun/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      phone,
      code,
      type,
      templateCode: ALIYUN_SMS_CONFIG.templateCode,
      signName: ALIYUN_SMS_CONFIG.signName
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || '发送失败');
  }

  return await response.json();
};

// 腾讯云短信发送
const sendTencentSMS = async (phone, code, type) => {
  const response = await fetch('/api/sms/tencent/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      phone,
      code,
      type,
      templateId: TENCENT_SMS_CONFIG.templateId,
      signName: TENCENT_SMS_CONFIG.signName,
      sdkAppId: TENCENT_SMS_CONFIG.sdkAppId
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || '发送失败');
  }

  return await response.json();
};

// 网易云信短信发送
const sendNeteaseSMS = async (phone, code, type) => {
  const response = await fetch('/api/sms/netease/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      phone,
      code,
      type,
      templateId: NETEASE_SMS_CONFIG.templateId
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || '发送失败');
  }

  return await response.json();
};

// 验证码模板
export const SMS_TEMPLATES = {
  register: {
    aliyun: '您的注册验证码是：${code}，5分钟内有效，请勿泄露。',
    tencent: '您的注册验证码是：{1}，5分钟内有效，请勿泄露。',
    netease: '您的注册验证码是：${code}，5分钟内有效，请勿泄露。'
  },
  login: {
    aliyun: '您的登录验证码是：${code}，5分钟内有效，请勿泄露。',
    tencent: '您的登录验证码是：{1}，5分钟内有效，请勿泄露。',
    netease: '您的登录验证码是：${code}，5分钟内有效，请勿泄露。'
  },
  resetPassword: {
    aliyun: '您的密码重置验证码是：${code}，5分钟内有效，请勿泄露。',
    tencent: '您的密码重置验证码是：{1}，5分钟内有效，请勿泄露。',
    netease: '您的密码重置验证码是：${code}，5分钟内有效，请勿泄露。'
  }
};

// 短信服务商费用对比（仅供参考）
export const SMS_PRICING = {
  aliyun: {
    name: '阿里云短信',
    freeQuota: '100条/月',
    price: '0.045元/条',
    pros: ['稳定可靠', '到达率高', '支持国际短信'],
    cons: ['价格相对较高']
  },
  tencent: {
    name: '腾讯云短信',
    freeQuota: '100条（新用户）',
    price: '0.045元/条',
    pros: ['接入简单', '文档完善', '技术支持好'],
    cons: ['免费额度仅新用户']
  },
  netease: {
    name: '网易云信',
    freeQuota: '100条/日',
    price: '0.05元/条',
    pros: ['每日免费额度', '适合小规模应用'],
    cons: ['功能相对简单']
  }
};

// 环境变量配置说明
export const ENV_CONFIG_GUIDE = `
# 阿里云短信服务配置
REACT_APP_ALIYUN_ACCESS_KEY_ID=your_access_key_id
REACT_APP_ALIYUN_ACCESS_KEY_SECRET=your_access_key_secret

# 腾讯云短信服务配置  
REACT_APP_TENCENT_SECRET_ID=your_secret_id
REACT_APP_TENCENT_SECRET_KEY=your_secret_key
REACT_APP_TENCENT_SMS_SDK_APP_ID=your_sdk_app_id

# 网易云信短信服务配置
REACT_APP_NETEASE_APP_KEY=your_app_key
REACT_APP_NETEASE_APP_SECRET=your_app_secret
`;

console.log('短信服务配置指南:');
console.log(ENV_CONFIG_GUIDE);
