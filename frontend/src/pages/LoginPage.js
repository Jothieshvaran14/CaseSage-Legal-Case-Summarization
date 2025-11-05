import React, { useState } from 'react';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { Scale, BookOpen } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const LoginPage = ({ onLogin }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const endpoint = isRegister ? '/auth/register' : '/auth/login';
      const response = await axios.post(`${API}${endpoint}`, formData);
      
      toast.success(isRegister ? 'Account created successfully!' : 'Welcome back!');
      onLogin(response.data.access_token, response.data.user);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)' }}>
      <div className="w-full max-w-6xl grid md:grid-cols-2 gap-8 items-center">
        {/* Left Side - Branding */}
        <div className="text-white space-y-6 hidden md:block">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-amber-500/20 rounded-xl backdrop-blur-sm">
              <Scale className="w-8 h-8 text-amber-400" />
            </div>
            <div>
              <h1 className="text-4xl font-bold" style={{ fontFamily: 'Playfair Display, serif' }}>CaseSage</h1>
              <p className="text-slate-400 text-sm">AI-Powered Legal Intelligence</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <h2 className="text-3xl font-semibold leading-tight" style={{ fontFamily: 'Playfair Display, serif' }}>
              Transform Legal Research with AI
            </h2>
            <p className="text-slate-300 text-lg leading-relaxed">
              Automated case summarization, citation mapping, and semantic search powered by advanced AI models.
            </p>
          </div>

          <div className="space-y-3 pt-4">
            <div className="flex items-start gap-3">
              <BookOpen className="w-5 h-5 text-amber-400 mt-1" />
              <div>
                <p className="font-medium">Intelligent Summarization</p>
                <p className="text-sm text-slate-400">Extract facts, issues, arguments, and verdicts automatically</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <BookOpen className="w-5 h-5 text-amber-400 mt-1" />
              <div>
                <p className="font-medium">Citation Recognition</p>
                <p className="text-sm text-slate-400">Identify and map legal precedents instantly</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <BookOpen className="w-5 h-5 text-amber-400 mt-1" />
              <div>
                <p className="font-medium">Semantic Case Search</p>
                <p className="text-sm text-slate-400">Find similar cases using AI-powered search</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Auth Form */}
        <Card className="backdrop-blur-xl bg-white/10 border-white/20 shadow-2xl" data-testid="auth-card">
          <CardHeader>
            <CardTitle className="text-2xl text-white" style={{ fontFamily: 'Playfair Display, serif' }}>
              {isRegister ? 'Create Account' : 'Welcome Back'}
            </CardTitle>
            <CardDescription className="text-slate-300">
              {isRegister ? 'Register to access CaseSage' : 'Sign in to continue your legal research'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {isRegister && (
                <div className="space-y-2">
                  <Label htmlFor="full_name" className="text-white">Full Name</Label>
                  <Input
                    id="full_name"
                    type="text"
                    placeholder="John Doe"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    required={isRegister}
                    className="bg-white/5 border-white/20 text-white placeholder:text-slate-400"
                    data-testid="input-fullname"
                  />
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="bg-white/5 border-white/20 text-white placeholder:text-slate-400"
                  data-testid="input-email"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-white">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  className="bg-white/5 border-white/20 text-white placeholder:text-slate-400"
                  data-testid="input-password"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold transition-all"
                disabled={loading}
                data-testid="btn-submit"
              >
                {loading ? 'Please wait...' : (isRegister ? 'Create Account' : 'Sign In')}
              </Button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setIsRegister(!isRegister)}
                  className="text-sm text-amber-400 hover:text-amber-300 transition-colors"
                  data-testid="btn-toggle-auth"
                >
                  {isRegister ? 'Already have an account? Sign in' : "Don't have an account? Register"}
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
