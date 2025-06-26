import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { 
  validators, 
  loginLimiter, 
  registrationLimiter, 
  getClientIP,
  checkPasswordStrength
} from '../utils/security';

const AuthModal = ({ isOpen, onClose, onLogin }) => {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [captcha, setCaptcha] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(null);
  const [errors, setErrors] = useState({});

  // 生成简单的图形验证码
  const generateCaptcha = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 4; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptcha(result);
  };

  useEffect(() => {
    if (isOpen && !isLoginMode) {
      generateCaptcha();
    }
  }, [isOpen, isLoginMode]);

  // 密码强度检查
  useEffect(() => {
    if (!isLoginMode && formData.password) {
      setPasswordStrength(checkPasswordStrength(formData.password));
    } else {
      setPasswordStrength(null);
    }
  }, [formData.password, isLoginMode]);

  const validateForm = () => {
    const newErrors = {};

    if (!validators.email(formData.email)) {
      newErrors.email = '请输入正确的邮箱地址';
    }

    if (!isLoginMode) {
      if (!validators.password(formData.password)) {
        newErrors.password = '密码至少8位，需包含字母和数字';
      }

      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = '两次输入的密码不一致';
      }

      if (captchaInput.toLowerCase() !== captcha.toLowerCase()) {
        newErrors.captcha = '图形验证码错误';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const clientIP = getClientIP();
    setLoading(true);
    
    try {
      if (isLoginMode) {
        // 检查登录尝试限制
        if (!loginLimiter.canAttempt(formData.email)) {
          const remainingTime = Math.ceil(loginLimiter.getRemainingTime(formData.email) / 1000 / 60);
          alert(`登录尝试过多，请${remainingTime}分钟后再试`);
          return;
        }

        // 模拟登录API调用
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 模拟登录成功
        const userData = {
          user: {
            id: 'user_' + Date.now(),
            email: formData.email,
            displayName: formData.email.split('@')[0],
            role: 'user',
            createdAt: new Date().toISOString()
          },
          token: 'mock_jwt_token_' + Date.now()
        };
        
        loginLimiter.recordAttempt(formData.email, true);
        localStorage.setItem('userToken', userData.token);
        localStorage.setItem('userInfo', JSON.stringify(userData.user));
        onLogin(userData.user);
        onClose();
      } else {
        // 检查注册频率限制
        if (!registrationLimiter.canRegister(clientIP)) {
          const remainingTime = Math.ceil(registrationLimiter.getRemainingTime(clientIP) / 1000);
          alert(`注册过于频繁，请${remainingTime}秒后再试`);
          return;
        }

        // 模拟注册API调用
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        registrationLimiter.recordRegistration(clientIP);
        alert('注册成功！请登录');
        setIsLoginMode(true);
        setFormData({
          email: formData.email,
          password: '',
          confirmPassword: ''
        });
        setErrors({});
        setCaptchaInput('');
      }
    } catch (error) {
      console.error('认证失败:', error);
      alert('操作失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">
            {isLoginMode ? '登录' : '注册'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              邮箱 *
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.email ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="请输入邮箱地址"
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              密码 *
            </label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.password ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder={isLoginMode ? "请输入密码" : "至少8位，包含字母和数字"}
            />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            
            {/* 密码强度指示器 */}
            {passwordStrength && (
              <div className="mt-2">
                <div className="flex items-center space-x-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        passwordStrength.strength === 'weak' ? 'bg-red-500 w-1/3' :
                        passwordStrength.strength === 'medium' ? 'bg-yellow-500 w-2/3' :
                        'bg-green-500 w-full'
                      }`}
                    />
                  </div>
                  <span className={`text-xs font-medium ${
                    passwordStrength.strength === 'weak' ? 'text-red-500' :
                    passwordStrength.strength === 'medium' ? 'text-yellow-500' :
                    'text-green-500'
                  }`}>
                    {passwordStrength.strength === 'weak' ? '弱' :
                     passwordStrength.strength === 'medium' ? '中' : '强'}
                  </span>
                </div>
                {passwordStrength.suggestions.length > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    建议: {passwordStrength.suggestions.join('、')}
                  </p>
                )}
              </div>
            )}
          </div>
          
          {!isLoginMode && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  确认密码 *
                </label>
                <input
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="请再次输入密码"
                />
                {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
              </div>

              {/* 图形验证码 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  验证码 *
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    required
                    value={captchaInput}
                    onChange={(e) => setCaptchaInput(e.target.value)}
                    className={`flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.captcha ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="请输入验证码"
                  />
                  <div 
                    className="w-20 h-10 bg-gray-200 border border-gray-300 rounded-md flex items-center justify-center cursor-pointer font-mono text-lg font-bold select-none hover:bg-gray-300 transition-colors"
                    onClick={generateCaptcha}
                    style={{
                      background: `linear-gradient(45deg, #f0f0f0, #e0e0e0)`,
                      letterSpacing: '2px'
                    }}
                  >
                    {captcha}
                  </div>
                </div>
                {errors.captcha && <p className="text-red-500 text-xs mt-1">{errors.captcha}</p>}
                <p className="text-xs text-gray-500 mt-1">点击验证码可刷新</p>
              </div>
            </>
          )}
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? '处理中...' : (isLoginMode ? '登录' : '注册')}
          </button>
        </form>
        
        <div className="mt-4 text-center">
          <button
            onClick={() => {
              setIsLoginMode(!isLoginMode);
              generateCaptcha();
              setFormData({
                email: '',
                password: '',
                confirmPassword: ''
              });
              setCaptchaInput('');
              setErrors({});
            }}
            className="text-blue-600 hover:text-blue-800 transition-colors"
          >
            {isLoginMode ? '没有账号？点击注册' : '已有账号？点击登录'}
          </button>
        </div>

        {!isLoginMode && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <h4 className="text-sm font-medium text-blue-800 mb-1">安全提示</h4>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• 请使用真实的邮箱地址进行注册</li>
              <li>• 密码至少8位，建议包含大小写字母、数字和特殊字符</li>
              <li>• 每个邮箱只能注册一个账号</li>
              <li>• 注册即表示同意我们的服务条款和隐私政策</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthModal;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">
            {isLoginMode ? '登录' : '注册'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              邮箱 *
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="请输入邮箱地址"
            />
          </div>

          {!isLoginMode && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                手机号 *
              </label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="请输入手机号码"
              />
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              密码 *
            </label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={isLoginMode ? "请输入密码" : "至少8位，包含字母和数字"}
            />
          </div>
          
          {!isLoginMode && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  确认密码 *
                </label>
                <input
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="请再次输入密码"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  组织名称 *
                </label>
                <input
                  type="text"
                  required
                  value={formData.organizationName}
                  onChange={(e) => setFormData({...formData, organizationName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="请输入您的公司或组织名称"
                />
              </div>

              {/* 图形验证码 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  图形验证码 *
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    required
                    value={captchaInput}
                    onChange={(e) => setCaptchaInput(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="请输入验证码"
                  />
                  <div 
                    className="w-20 h-10 bg-gray-200 border border-gray-300 rounded-md flex items-center justify-center cursor-pointer font-mono text-lg font-bold select-none"
                    onClick={generateCaptcha}
                    style={{
                      background: `linear-gradient(45deg, #f0f0f0, #e0e0e0)`,
                      letterSpacing: '2px'
                    }}
                  >
                    {captcha}
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">点击验证码可刷新</p>
              </div>

              {/* 短信验证码 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  短信验证码 *
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    required
                    value={formData.verificationCode}
                    onChange={(e) => setFormData({...formData, verificationCode: e.target.value})}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="请输入短信验证码"
                  />
                  <button
                    type="button"
                    onClick={sendVerificationCode}
                    disabled={sendingCode || countdown > 0 || !formData.phone}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm whitespace-nowrap"
                  >
                    {sendingCode ? '发送中...' : countdown > 0 ? `${countdown}s` : '发送验证码'}
                  </button>
                </div>
              </div>
            </>
          )}
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? '处理中...' : (isLoginMode ? '登录' : '注册')}
          </button>
        </form>
        
        <div className="mt-4 text-center">
          <button
            onClick={() => {
              setIsLoginMode(!isLoginMode);
              generateCaptcha();
              setFormData({
                email: '',
                password: '',
                confirmPassword: '',
                organizationName: '',
                phone: '',
                verificationCode: ''
              });
              setCaptchaInput('');
              setCountdown(0);
            }}
            className="text-blue-600 hover:text-blue-800"
          >
            {isLoginMode ? '没有账号？点击注册' : '已有账号？点击登录'}
          </button>
        </div>

        {!isLoginMode && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <h4 className="text-sm font-medium text-yellow-800 mb-1">安全提示</h4>
            <ul className="text-xs text-yellow-700 space-y-1">
              <li>• 请使用真实的手机号码进行注册</li>
              <li>• 密码至少8位，建议包含大小写字母、数字和特殊字符</li>
              <li>• 每个手机号只能注册一个账号</li>
              <li>• 注册即表示同意我们的服务条款和隐私政策</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthModal;
