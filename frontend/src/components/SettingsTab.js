import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Moon, Sun, Info } from 'lucide-react';

const SettingsTab = ({ theme, setTheme }) => {
  return (
    <div className="space-y-6">
      <Card className="backdrop-blur-xl bg-white/10 border-white/20" data-testid="settings-card">
        <CardHeader>
          <CardTitle className="text-white">Appearance</CardTitle>
          <CardDescription className="text-slate-300">
            Customize the look and feel of CaseSage
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="theme-toggle" className="text-white font-medium">Theme</Label>
              <p className="text-sm text-slate-400">Toggle between light and dark mode</p>
            </div>
            <div className="flex items-center gap-3">
              <Sun className="w-4 h-4 text-amber-400" />
              <Switch
                id="theme-toggle"
                checked={theme === 'dark'}
                onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                data-testid="switch-theme"
              />
              <Moon className="w-4 h-4 text-slate-400" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="backdrop-blur-xl bg-white/10 border-white/20" data-testid="about-card">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Info className="w-5 h-5" />
            About CaseSage
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-slate-300">
          <div>
            <h4 className="font-semibold text-white mb-2">Version</h4>
            <p className="text-sm">1.0.0 - IEEE TEMS Interstellar 2025</p>
          </div>
          
          <div>
            <h4 className="font-semibold text-white mb-2">Technology Stack</h4>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs">React</span>
              <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs">FastAPI</span>
              <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs">OpenAI GPT-4o</span>
              <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs">MongoDB</span>
              <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs">FAISS</span>
              <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs">Tesseract OCR</span>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-2">Features</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex gap-2">
                <span className="text-amber-400">✓</span>
                <span>AI-powered document summarization</span>
              </li>
              <li className="flex gap-2">
                <span className="text-amber-400">✓</span>
                <span>Automatic citation detection and linking</span>
              </li>
              <li className="flex gap-2">
                <span className="text-amber-400">✓</span>
                <span>Semantic case search with FAISS</span>
              </li>
              <li className="flex gap-2">
                <span className="text-amber-400">✓</span>
                <span>OCR support for PDFs and images</span>
              </li>
              <li className="flex gap-2">
                <span className="text-amber-400">✓</span>
                <span>Timeline extraction and visualization</span>
              </li>
              <li className="flex gap-2">
                <span className="text-amber-400">✓</span>
                <span>Confidence scoring for AI outputs</span>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsTab;
