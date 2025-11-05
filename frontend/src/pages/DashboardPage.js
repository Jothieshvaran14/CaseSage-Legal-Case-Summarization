import React, { useState } from 'react';
import { Scale, LogOut, User } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import UploadTab from '../components/UploadTab';
import SummaryTab from '../components/SummaryTab';
import CitationTab from '../components/CitationTab';
import SearchTab from '../components/SearchTab';
import SettingsTab from '../components/SettingsTab';

const DashboardPage = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('upload');
  const [currentDocument, setCurrentDocument] = useState(null);
  const [summaryData, setSummaryData] = useState(null);
  const [theme, setTheme] = useState('dark');

  const handleDocumentUploaded = (document) => {
    setCurrentDocument(document);
    setActiveTab('summary');
  };

  const handleSummaryGenerated = (summary) => {
    setSummaryData(summary);
  };

  return (
    <div className="min-h-screen" style={{ background: theme === 'dark' ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)' : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)' }}>
      {/* Header */}
      <header className="border-b border-white/10 backdrop-blur-xl bg-white/5">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 rounded-lg">
              <Scale className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Playfair Display, serif' }}>CaseSage</h1>
              <p className="text-xs text-slate-400">Legal Intelligence Platform</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-white" data-testid="user-info">
              <User className="w-4 h-4" />
              <span className="text-sm">{user?.email || 'User'}</span>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={onLogout}
              className="border-white/20 text-white hover:bg-white/10"
              data-testid="btn-logout"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 bg-white/10 backdrop-blur-sm border border-white/20" data-testid="tab-list">
            <TabsTrigger value="upload" className="data-[state=active]:bg-amber-500 data-[state=active]:text-slate-900" data-testid="tab-upload">
              Upload
            </TabsTrigger>
            <TabsTrigger value="summary" className="data-[state=active]:bg-amber-500 data-[state=active]:text-slate-900" data-testid="tab-summary">
              Summary
            </TabsTrigger>
            <TabsTrigger value="citations" className="data-[state=active]:bg-amber-500 data-[state=active]:text-slate-900" data-testid="tab-citations">
              Citations
            </TabsTrigger>
            <TabsTrigger value="search" className="data-[state=active]:bg-amber-500 data-[state=active]:text-slate-900" data-testid="tab-search">
              Search
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-amber-500 data-[state=active]:text-slate-900" data-testid="tab-settings">
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="mt-6">
            <UploadTab onDocumentUploaded={handleDocumentUploaded} />
          </TabsContent>

          <TabsContent value="summary" className="mt-6">
            <SummaryTab 
              currentDocument={currentDocument} 
              summaryData={summaryData}
              onSummaryGenerated={handleSummaryGenerated}
            />
          </TabsContent>

          <TabsContent value="citations" className="mt-6">
            <CitationTab currentDocument={currentDocument} summaryData={summaryData} />
          </TabsContent>

          <TabsContent value="search" className="mt-6">
            <SearchTab />
          </TabsContent>

          <TabsContent value="settings" className="mt-6">
            <SettingsTab theme={theme} setTheme={setTheme} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default DashboardPage;
