// 模拟短信服务 - 用于开发和测试
// 在生产环境中替换为真实的短信服务

class MockSMSService {
  constructor() {
    this.codes = new Map(); // 存储验证码
    this.sendHistory = new Map(); // 发送历史
  }

  // 生成验证码
  generateCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // 模拟发送短信
  async sendSMS(phone, type = 'register') {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 生成验证码
    const code = this.generateCode();
    
    // 存储验证码，5分钟过期
    this.codes.set(phone, {
      code,
      type,
      timestamp: Date.now(),
      expires: Date.now() + 5 * 60 * 1000 // 5分钟
    });

    // 记录发送历史
    const history = this.sendHistory.get(phone) || [];
    history.push({
      code,
      type,
      timestamp: Date.now(),
      phone
    });
    this.sendHistory.set(phone, history);

    // 在开发环境中显示验证码（生产环境中移除）
    if (process.env.NODE_ENV === 'development') {
      console.log(`📱 模拟短信发送成功！`);
      console.log(`📞 手机号: ${phone}`);
      console.log(`🔢 验证码: ${code}`);
      console.log(`⏰ 有效期: 5分钟`);
      
      // 在页面上显示验证码（仅开发环境）
      this.showCodeInUI(phone, code);
    }

    return {
      success: true,
      message: '验证码发送成功',
      // 开发环境返回验证码，生产环境不返回
      ...(process.env.NODE_ENV === 'development' && { code })
    };
  }

  // 在UI中显示验证码（仅开发环境）
  showCodeInUI(phone, code) {
    // 创建一个临时的通知元素
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #10B981;
      color: white;
      padding: 16px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10000;
      font-family: monospace;
      font-size: 14px;
      max-width: 300px;
    `;
    
    notification.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 8px;">📱 开发环境 - 模拟短信</div>
      <div>手机号: ${phone}</div>
      <div style="font-size: 18px; font-weight: bold; color: #FEF3C7; margin: 8px 0;">
        验证码: ${code}
      </div>
      <div style="font-size: 12px; opacity: 0.9;">5分钟内有效</div>
      <button onclick="this.parentElement.remove()" style="
        position: absolute;
        top: 8px;
        right: 8px;
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        font-size: 16px;
      ">×</button>
    `;

    document.body.appendChild(notification);

    // 5秒后自动消失
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 5000);
  }

  // 验证验证码
  async verifyCode(phone, inputCode) {
    const stored = this.codes.get(phone);
    
    if (!stored) {
      return {
        valid: false,
        message: '验证码不存在或已过期'
      };
    }

    if (Date.now() > stored.expires) {
      this.codes.delete(phone);
      return {
        valid: false,
        message: '验证码已过期'
      };
    }

    if (stored.code !== inputCode) {
      return {
        valid: false,
        message: '验证码错误'
      };
    }

    // 验证成功，删除验证码
    this.codes.delete(phone);
    
    return {
      valid: true,
      message: '验证成功'
    };
  }

  // 获取发送历史（调试用）
  getSendHistory(phone) {
    return this.sendHistory.get(phone) || [];
  }

  // 清理过期的验证码
  cleanup() {
    const now = Date.now();
    for (const [phone, data] of this.codes.entries()) {
      if (now > data.expires) {
        this.codes.delete(phone);
      }
    }
  }
}

// 创建全局实例
const mockSMSService = new MockSMSService();

// 定期清理过期验证码
setInterval(() => {
  mockSMSService.cleanup();
}, 60000); // 每分钟清理一次

export default mockSMSService;

// 导出主要方法
export const sendVerificationCode = async (phone, type = 'register') => {
  return await mockSMSService.sendSMS(phone, type);
};

export const verifyVerificationCode = async (phone, code) => {
  return await mockSMSService.verifyCode(phone, code);
};

// 真实短信服务的接口（生产环境使用）
export const sendRealSMS = async (phone, type = 'register') => {
  try {
    const response = await fetch('/api/sms/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone,
        type
      })
    });

    if (!response.ok) {
      throw new Error('发送失败');
    }

    return await response.json();
  } catch (error) {
    console.error('真实短信发送失败:', error);
    throw error;
  }
};

// 根据环境选择使用模拟还是真实服务
export const sendSMS = process.env.NODE_ENV === 'development' 
  ? sendVerificationCode 
  : sendRealSMS;
