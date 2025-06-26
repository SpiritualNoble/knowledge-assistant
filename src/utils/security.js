// 安全工具函数

// 防暴力破解 - 登录尝试限制
class LoginAttemptLimiter {
  constructor() {
    this.attempts = new Map();
    this.blockDuration = 15 * 60 * 1000; // 15分钟
    this.maxAttempts = 5;
  }

  canAttempt(identifier) {
    const key = this.getKey(identifier);
    const record = this.attempts.get(key);
    
    if (!record) return true;
    
    // 检查是否还在封禁期
    if (Date.now() - record.lastAttempt < this.blockDuration) {
      return record.count < this.maxAttempts;
    }
    
    // 封禁期已过，重置计数
    this.attempts.delete(key);
    return true;
  }

  recordAttempt(identifier, success = false) {
    const key = this.getKey(identifier);
    
    if (success) {
      // 成功登录，清除记录
      this.attempts.delete(key);
      return;
    }
    
    const record = this.attempts.get(key) || { count: 0, lastAttempt: 0 };
    record.count += 1;
    record.lastAttempt = Date.now();
    
    this.attempts.set(key, record);
  }

  getRemainingTime(identifier) {
    const key = this.getKey(identifier);
    const record = this.attempts.get(key);
    
    if (!record || record.count < this.maxAttempts) return 0;
    
    const elapsed = Date.now() - record.lastAttempt;
    return Math.max(0, this.blockDuration - elapsed);
  }

  getKey(identifier) {
    return `login_${identifier}`;
  }
}

// 注册频率限制
class RegistrationLimiter {
  constructor() {
    this.registrations = new Map();
    this.cooldown = 60 * 1000; // 1分钟冷却
  }

  canRegister(ip) {
    const lastRegistration = this.registrations.get(ip);
    if (!lastRegistration) return true;
    
    return Date.now() - lastRegistration > this.cooldown;
  }

  recordRegistration(ip) {
    this.registrations.set(ip, Date.now());
  }

  getRemainingTime(ip) {
    const lastRegistration = this.registrations.get(ip);
    if (!lastRegistration) return 0;
    
    const elapsed = Date.now() - lastRegistration;
    return Math.max(0, this.cooldown - elapsed);
  }
}

// 短信发送频率限制
class SMSLimiter {
  constructor() {
    this.smsRecords = new Map();
    this.cooldown = 60 * 1000; // 1分钟冷却
    this.dailyLimit = 5; // 每日限制5条
  }

  canSendSMS(phone) {
    const today = new Date().toDateString();
    const key = `${phone}_${today}`;
    const record = this.smsRecords.get(key) || { count: 0, lastSent: 0 };
    
    // 检查日限制
    if (record.count >= this.dailyLimit) return false;
    
    // 检查冷却时间
    if (Date.now() - record.lastSent < this.cooldown) return false;
    
    return true;
  }

  recordSMS(phone) {
    const today = new Date().toDateString();
    const key = `${phone}_${today}`;
    const record = this.smsRecords.get(key) || { count: 0, lastSent: 0 };
    
    record.count += 1;
    record.lastSent = Date.now();
    
    this.smsRecords.set(key, record);
  }

  getRemainingTime(phone) {
    const today = new Date().toDateString();
    const key = `${phone}_${today}`;
    const record = this.smsRecords.get(key);
    
    if (!record) return 0;
    
    const elapsed = Date.now() - record.lastSent;
    return Math.max(0, this.cooldown - elapsed);
  }

  getDailyRemaining(phone) {
    const today = new Date().toDateString();
    const key = `${phone}_${today}`;
    const record = this.smsRecords.get(key) || { count: 0 };
    
    return Math.max(0, this.dailyLimit - record.count);
  }
}

// 输入验证
export const validators = {
  email: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },
  
  password: (password) => {
    // 至少8位，包含字母、数字，可选特殊字符
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;
    return passwordRegex.test(password);
  }
};

// XSS防护
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

// 创建全局实例
export const loginLimiter = new LoginAttemptLimiter();
export const registrationLimiter = new RegistrationLimiter();
export const smsLimiter = new SMSLimiter();

// 获取客户端IP（模拟）
export const getClientIP = () => {
  // 在实际应用中，这应该从服务器端获取
  return 'client_' + Math.random().toString(36).substr(2, 9);
};

// 密码强度检查
export const checkPasswordStrength = (password) => {
  const checks = {
    length: password.length >= 8,
    hasLetter: /[A-Za-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecial: /[@$!%*#?&]/.test(password),
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password)
  };
  
  const score = Object.values(checks).filter(Boolean).length;
  
  let strength = 'weak';
  if (score >= 5) strength = 'strong';
  else if (score >= 3) strength = 'medium';
  
  return {
    score,
    strength,
    checks,
    suggestions: [
      !checks.length && '至少8个字符',
      !checks.hasLetter && '包含字母',
      !checks.hasNumber && '包含数字',
      !checks.hasSpecial && '包含特殊字符(@$!%*#?&)',
      !checks.hasUpper && '包含大写字母',
      !checks.hasLower && '包含小写字母'
    ].filter(Boolean)
  };
};
