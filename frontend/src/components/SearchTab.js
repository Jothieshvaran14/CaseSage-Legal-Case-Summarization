import React, { useState } from 'react';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import { Search, ExternalLink, BookOpen, AlertCircle } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const SearchTab = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!query.trim()) {
      toast.error('Please enter a search query');
      return;
    }

    setLoading(true);
    setSearched(true);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API}/search`,
        { query: query.trim(), top_k: 5 },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      setResults(response.data.cases);
      toast.success(`Found ${response.data.cases.length} similar cases`);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Search failed');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="backdrop-blur-xl bg-white/10 border-white/20" data-testid="search-card">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Search className="w-5 h-5" />
            Semantic Case Search
          </CardTitle>
          <CardDescription className="text-slate-300">
            Search for similar legal cases using AI-powered semantic search
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex gap-3">
              <Input
                type="text"
                placeholder="e.g., breach of contract, property dispute, criminal negligence..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 bg-white/5 border-white/20 text-white placeholder:text-slate-400"
                data-testid="input-search"
              />
              <Button
                type="submit"
                disabled={loading}
                className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold px-8"
                data-testid="btn-search"
              >
                {loading ? 'Searching...' : 'Search'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Search Results */}
      {searched && (
        <Card className="backdrop-blur-xl bg-white/10 border-white/20" data-testid="results-card">
          <CardHeader>
            <CardTitle className="text-white">Search Results</CardTitle>
            <CardDescription className="text-slate-300">
              {results.length > 0
                ? `Found ${results.length} relevant case(s)`
                : 'No cases found'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {results.length > 0 ? (
              <div className="space-y-4">
                {results.map((result, index) => (
                  <div
                    key={index}
                    className="p-5 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all"
                    data-testid={`result-item-${index}`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="text-white font-semibold text-lg mb-2">
                            {result.title}
                          </h3>
                          <p className="text-slate-300 text-sm leading-relaxed">
                            {result.snippet}
                          </p>
                        </div>
                        <BookOpen className="w-5 h-5 text-amber-400 flex-shrink-0" />
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-white/10">
                        <Badge className="bg-amber-500/20 text-amber-400 border-amber-400/30">
                          {result.citation}
                        </Badge>
                        <a
                          href={result.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-amber-400 hover:text-amber-300 text-sm transition-colors"
                          data-testid={`link-result-${index}`}
                        >
                          View Full Case
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 space-y-4">
                <AlertCircle className="w-12 h-12 text-slate-400 mx-auto" />
                <div className="space-y-2">
                  <p className="text-slate-300">No matching cases found</p>
                  <p className="text-sm text-slate-400">
                    Try adjusting your search terms or using different keywords
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Search Tips */}
      {!searched && (
        <Card className="backdrop-blur-xl bg-white/10 border-white/20" data-testid="tips-card">
          <CardHeader>
            <CardTitle className="text-white">Search Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-slate-300">
              <li className="flex gap-3">
                <span className="text-amber-400">•</span>
                <span>Use specific legal terms and concepts for better results</span>
              </li>
              <li className="flex gap-3">
                <span className="text-amber-400">•</span>
                <span>Include relevant context like "property dispute" or "employment law"</span>
              </li>
              <li className="flex gap-3">
                <span className="text-amber-400">•</span>
                <span>The search uses AI to understand the meaning of your query, not just keywords</span>
              </li>
              <li className="flex gap-3">
                <span className="text-amber-400">•</span>
                <span>Results are ranked by semantic similarity to your query</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SearchTab;
