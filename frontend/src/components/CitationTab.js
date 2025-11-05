import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { BookOpen, ExternalLink, AlertCircle } from 'lucide-react';

const CitationTab = ({ currentDocument, summaryData }) => {
  const citations = summaryData?.citations || [];

  return (
    <div className="space-y-6">
      <Card className="backdrop-blur-xl bg-white/10 border-white/20" data-testid="citations-card">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Legal Citations Detected
          </CardTitle>
          <CardDescription className="text-slate-300">
            {citations.length > 0
              ? `Found ${citations.length} citation(s) in the document`
              : 'No citations detected yet'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {citations.length > 0 ? (
            <div className="space-y-4">
              {citations.map((citation, index) => (
                <div
                  key={index}
                  className="p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all"
                  data-testid={`citation-item-${index}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-3">
                        <Badge className="bg-amber-500/20 text-amber-400 border-amber-400/30">
                          {citation.type}
                        </Badge>
                        <p className="text-white font-semibold">{citation.citation}</p>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        {citation.year && (
                          <div>
                            <span className="text-slate-400">Year:</span>
                            <span className="text-white ml-2">{citation.year}</span>
                          </div>
                        )}
                        {citation.court && (
                          <div>
                            <span className="text-slate-400">Court:</span>
                            <span className="text-white ml-2">{citation.court}</span>
                          </div>
                        )}
                        {citation.number && (
                          <div>
                            <span className="text-slate-400">Number:</span>
                            <span className="text-white ml-2">{citation.number}</span>
                          </div>
                        )}
                        {citation.volume && (
                          <div>
                            <span className="text-slate-400">Volume:</span>
                            <span className="text-white ml-2">{citation.volume}</span>
                          </div>
                        )}
                        {citation.page && (
                          <div>
                            <span className="text-slate-400">Page:</span>
                            <span className="text-white ml-2">{citation.page}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <a
                      href={`https://indiankanoon.org/search/?formInput=${encodeURIComponent(citation.citation)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-amber-400 hover:text-amber-300 transition-colors"
                      data-testid={`link-citation-${index}`}
                    >
                      <ExternalLink className="w-5 h-5" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 space-y-4">
              <AlertCircle className="w-12 h-12 text-slate-400 mx-auto" />
              <div className="space-y-2">
                <p className="text-slate-300">No citations detected in the document</p>
                <p className="text-sm text-slate-400">
                  Upload a legal document with citations like "AIR 1975 SC 1234" or "(2001) 3 SCC 456"
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Citation Statistics */}
      {citations.length > 0 && (
        <Card className="backdrop-blur-xl bg-white/10 border-white/20" data-testid="citation-stats-card">
          <CardHeader>
            <CardTitle className="text-white">Citation Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-white/5 rounded-lg">
                <p className="text-3xl font-bold text-amber-400">{citations.length}</p>
                <p className="text-sm text-slate-300 mt-1">Total Citations</p>
              </div>
              <div className="text-center p-4 bg-white/5 rounded-lg">
                <p className="text-3xl font-bold text-amber-400">
                  {citations.filter(c => c.type === 'AIR').length}
                </p>
                <p className="text-sm text-slate-300 mt-1">AIR Citations</p>
              </div>
              <div className="text-center p-4 bg-white/5 rounded-lg">
                <p className="text-3xl font-bold text-amber-400">
                  {citations.filter(c => c.type === 'SCC').length}
                </p>
                <p className="text-sm text-slate-300 mt-1">SCC Citations</p>
              </div>
              <div className="text-center p-4 bg-white/5 rounded-lg">
                <p className="text-3xl font-bold text-amber-400">
                  {citations.filter(c => c.court === 'SC').length}
                </p>
                <p className="text-sm text-slate-300 mt-1">Supreme Court</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CitationTab;
