import React, { useState } from "react";
import { useAuth } from "@/App";
import { useNavigate } from "react-router-dom";
import { Coffee, Eye, EyeSlash, User, Envelope, Lock } from "@phosphor-icons/react";

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, register, user } = useAuth();
  const navigate = useNavigate();

  if (user) { navigate("/"); return null; }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isRegister) {
        await register(name, email, password);
      } else {
        await login(email, password);
      }
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.detail || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" data-testid="login-page">
      {/* Left - Hero Image */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1762117863076-b55c0dbf19ff?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDJ8MHwxfHNlYXJjaHwyfHxjb2ZmZWUlMjBjdXAlMjBjYWZlfGVufDB8fHx8MTc3NDUxMTQ2M3ww&ixlib=rb-4.1.0&q=85"
          alt="Coffee"
          className="object-cover w-full h-full"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#2C1E16]/80 via-[#2C1E16]/30 to-transparent" />
        <div className="absolute bottom-12 left-12 right-12 text-white">
          <h1 className="text-5xl font-bold mb-3" style={{ fontFamily: 'Outfit' }}>Surya Coffee</h1>
          <p className="text-lg opacity-80" style={{ fontFamily: 'Manrope' }}>Point of Sale System</p>
          <p className="text-sm opacity-60 mt-2" style={{ fontFamily: 'Manrope' }}>Near Central Market, Chennai, Tamil Nadu</p>
        </div>
      </div>

      {/* Right - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-[#FDFBF7]">
        <div className="w-full max-w-md animate-fadeIn">
          {/* Logo for mobile */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-[#D97757] flex items-center justify-center">
              <Coffee size={28} weight="duotone" className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#2C1E16]" style={{ fontFamily: 'Outfit' }}>Surya Coffee</h2>
              <p className="text-xs text-[#8A7969]">POS System</p>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-[#2C1E16] mb-2" style={{ fontFamily: 'Outfit' }}>
              {isRegister ? "Create Account" : "Welcome Back"}
            </h2>
            <p className="text-[#8A7969]">
              {isRegister ? "Set up your staff account" : "Sign in to start taking orders"}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-[#C95A49]/10 border border-[#C95A49]/20 text-[#C95A49] text-sm" data-testid="login-error">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label className="text-xs font-bold uppercase tracking-[0.2em] text-[#8A7969] mb-2 block">Name</label>
                <div className="relative">
                  <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A7969]" />
                  <input
                    data-testid="register-name-input"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white border border-[#EAE5D9] text-[#2C1E16] rounded-xl focus:ring-2 focus:ring-[#D97757]/20 focus:border-[#D97757] transition-all outline-none"
                    placeholder="Your name"
                    required
                  />
                </div>
              </div>
            )}
            <div>
              <label className="text-xs font-bold uppercase tracking-[0.2em] text-[#8A7969] mb-2 block">Email</label>
              <div className="relative">
                <Envelope size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A7969]" />
                <input
                  data-testid="login-email-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-[#EAE5D9] text-[#2C1E16] rounded-xl focus:ring-2 focus:ring-[#D97757]/20 focus:border-[#D97757] transition-all outline-none"
                  placeholder="email@example.com"
                  required
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-[0.2em] text-[#8A7969] mb-2 block">Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A7969]" />
                <input
                  data-testid="login-password-input"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 bg-white border border-[#EAE5D9] text-[#2C1E16] rounded-xl focus:ring-2 focus:ring-[#D97757]/20 focus:border-[#D97757] transition-all outline-none"
                  placeholder="Enter password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A7969] hover:text-[#5C4A3D] transition-colors"
                >
                  {showPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <button
              data-testid="login-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#D97757] text-white hover:bg-[#BF6245] transition-all rounded-xl font-semibold text-base disabled:opacity-50 active:scale-[0.98]"
            >
              {loading ? "Please wait..." : isRegister ? "Create Account" : "Sign In"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              data-testid="toggle-auth-mode"
              onClick={() => { setIsRegister(!isRegister); setError(""); }}
              className="text-sm text-[#D97757] hover:text-[#BF6245] font-medium transition-colors"
            >
              {isRegister ? "Already have an account? Sign in" : "Need an account? Register"}
            </button>
          </div>

          {!isRegister && (
            <div className="mt-8 p-4 rounded-xl bg-[#F4F1EA] border border-[#EAE5D9]">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#8A7969] mb-2">Demo Accounts</p>
              <div className="space-y-1 text-sm text-[#5C4A3D]">
                <p><span className="font-semibold">Admin:</span> admin@surya.coffee / admin123</p>
                <p><span className="font-semibold">Staff:</span> staff@surya.coffee / staff123</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
