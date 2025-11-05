import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import { FileText, AlertCircle, Scale, Calendar, ThumbsUp, ThumbsDown, MessageSquare } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Textarea } from './ui/textarea';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const SummaryTab = ({ currentDocument, summaryData, onSummaryGenerated }) => {
  const [loading, setLoading] = useState(false);
  const [summaryType, setSummaryType] = useState('detailed');
  const [localSummary, setLocalSummary] = useState(summaryData);
  const [feedbackComment, setFeedbackComment] = useState('');

  useEffect(() => {
    setLocalSummary(summaryData);
  }, [summaryData]);

  const handleGenerateSummary = async () => {
    if (!currentDocument) {
      toast.error('Please upload a document first');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API}/summarize`,
        {
          document_id: currentDocument.document_id,
          summary_type: summaryType
        },
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      setLocalSummary(response.data);
      onSummaryGenerated(response.data);
      toast.success('Summary generated successfully!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to generate summary');
    } finally {
      setLoading(false);
    }
  };

  const handleFeedback = async (rating) => {
    if (!currentDocument) return;

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API}/feedback`,
        {
          document_id: currentDocument.document_id,
          rating: rating,
          comment: feedbackComment || null
        },
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      toast.success('Thank you for your feedback!');
      setFeedbackComment('');
    } catch (error) {
      toast.error('Failed to submit feedback');
    }
  };

  const getConfidenceColor = (score) => {
    if (score >= 0.9) return 'text-green-400';
    if (score >= 0.8) return 'text-yellow-400';
    return 'text-orange-400';
  };

  return (
    <div className="space-y-6">
      {/* Control Panel */}
      <Card className="backdrop-blur-xl bg-white/10 border-white/20" data-testid="summary-control-card">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Generate Summary
          </CardTitle>
          <CardDescription className="text-slate-300">
            {currentDocument ? `Document: ${currentDocument.filename}` : 'No document uploaded'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-white mb-2 block">Summary Type</label>
              <div className="grid grid-cols-3 gap-3">
                <Button
                  variant={summaryType === 'executive' ? 'default' : 'outline'}
                  onClick={() => setSummaryType('executive')}
                  className={summaryType === 'executive' ? 'bg-amber-500 text-slate-900' : 'border-white/20 text-white'}
                  data-testid="btn-executive"
                >
                  Executive
                </Button>
                <Button
                  variant={summaryType === 'detailed' ? 'default' : 'outline'}
                  onClick={() => setSummaryType('detailed')}
                  className={summaryType === 'detailed' ? 'bg-amber-500 text-slate-900' : 'border-white/20 text-white'}
                  data-testid="btn-detailed"
                >
                  Detailed
                </Button>
                <Button
                  variant={summaryType === 'risk-focused' ? 'default' : 'outline'}
                  onClick={() => setSummaryType('risk-focused')}
                  className={summaryType === 'risk-focused' ? 'bg-amber-500 text-slate-900' : 'border-white/20 text-white'}
                  data-testid="btn-risk-focused"
                >
                  Risk-Focused
                </Button>
              </div>
            </div>

            <Button
              onClick={handleGenerateSummary}
              disabled={!currentDocument || loading}
              className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold"
              data-testid="btn-generate-summary"
            >
              {loading ? 'Generating...' : 'Generate Summary'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Display */}
      {localSummary && (
        <div className="space-y-6">
          <Tabs defaultValue="structured" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-white/10 border border-white/20">
              <TabsTrigger value="structured" className="data-[state=active]:bg-amber-500 data-[state=active]:text-slate-900" data-testid="tab-structured">
                Structured View
              </TabsTrigger>
              <TabsTrigger value="timeline" className="data-[state=active]:bg-amber-500 data-[state=active]:text-slate-900" data-testid="tab-timeline">
                Timeline
              </TabsTrigger>
            </TabsList>

            <TabsContent value="structured" className="space-y-4 mt-6">
              {/* Facts */}
              <Card className="backdrop-blur-xl bg-emerald-500/10 border-emerald-500/30" data-testid="facts-card">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white flex items-center gap-2">
                      <div className="w-3 h-3 bg-emerald-400 rounded-full"></div>
                      Facts of the Case
                    </CardTitle>
                    {localSummary.confidence_scores?.facts && (
                      <Badge variant="outline" className={`${getConfidenceColor(localSummary.confidence_scores.facts)} border-current`}>
                        {(localSummary.confidence_scores.facts * 100).toFixed(0)}% confidence
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-200 leading-relaxed">{localSummary.facts}</p>
                </CardContent>
              </Card>

              {/* Issues */}
              <Card className="backdrop-blur-xl bg-yellow-500/10 border-yellow-500/30" data-testid="issues-card">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white flex items-center gap-2">
                      <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                      Issues Raised
                    </CardTitle>
                    {localSummary.confidence_scores?.issues && (
                      <Badge variant="outline" className={`${getConfidenceColor(localSummary.confidence_scores.issues)} border-current`}>
                        {(localSummary.confidence_scores.issues * 100).toFixed(0)}% confidence
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-200 leading-relaxed">{localSummary.issues}</p>
                </CardContent>
              </Card>

              {/* Arguments */}
              <Card className="backdrop-blur-xl bg-blue-500/10 border-blue-500/30" data-testid="arguments-card">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                      Arguments Presented
                    </CardTitle>
                    {localSummary.confidence_scores?.arguments && (
                      <Badge variant="outline" className={`${getConfidenceColor(localSummary.confidence_scores.arguments)} border-current`}>
                        {(localSummary.confidence_scores.arguments * 100).toFixed(0)}% confidence
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-200 leading-relaxed">{localSummary.arguments}</p>
                </CardContent>
              </Card>

              {/* Verdict */}
              <Card className="backdrop-blur-xl bg-red-500/10 border-red-500/30" data-testid="verdict-card">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white flex items-center gap-2">
                      <Scale className="w-5 h-5 text-red-400" />
                      Final Verdict
                    </CardTitle>
                    {localSummary.confidence_scores?.verdict && (
                      <Badge variant="outline" className={`${getConfidenceColor(localSummary.confidence_scores.verdict)} border-current`}>
                        {(localSummary.confidence_scores.verdict * 100).toFixed(0)}% confidence
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-200 leading-relaxed">{localSummary.verdict}</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="timeline" className="mt-6">
              <Card className="backdrop-blur-xl bg-white/10 border-white/20" data-testid="timeline-card">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Case Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {localSummary.timeline && localSummary.timeline.length > 0 ? (
                    <div className="space-y-4">
                      {localSummary.timeline.map((event, index) => (
                        <div key={index} className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div className="w-3 h-3 bg-amber-400 rounded-full"></div>
                            {index < localSummary.timeline.length - 1 && (
                              <div className="w-0.5 h-full bg-amber-400/30 mt-2"></div>
                            )}
                          </div>
                          <div className="flex-1 pb-8">
                            <p className="text-amber-400 font-semibold text-sm">{event.date}</p>
                            <p className="text-slate-300 text-sm mt-1">{event.event}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-400 text-center py-8">No timeline events detected</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Feedback */}
          <Card className="backdrop-blur-xl bg-white/10 border-white/20" data-testid="feedback-card">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Feedback
              </CardTitle>
              <CardDescription className="text-slate-300">
                Help us improve by rating this summary
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={() => handleFeedback(1)}
                  className="flex-1 border-white/20 hover:bg-red-500/20 text-white"
                  data-testid="btn-thumbs-down"
                >
                  <ThumbsDown className="w-4 h-4 mr-2" />
                  Not Helpful
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleFeedback(5)}
                  className="flex-1 border-white/20 hover:bg-green-500/20 text-white"
                  data-testid="btn-thumbs-up"
                >
                  <ThumbsUp className="w-4 h-4 mr-2" />
                  Helpful
                </Button>
              </div>
              <Textarea
                placeholder="Optional: Share your thoughts on this summary..."
                value={feedbackComment}
                onChange={(e) => setFeedbackComment(e.target.value)}
                className="bg-white/5 border-white/20 text-white placeholder:text-slate-400 min-h-[80px]"
                data-testid="textarea-feedback"
              />
            </CardContent>
          </Card>
        </div>
      )}

      {!localSummary && !loading && (
        <Card className="backdrop-blur-xl bg-white/10 border-white/20">
          <CardContent className="py-16">
            <div className="text-center space-y-4">
              <AlertCircle className="w-12 h-12 text-slate-400 mx-auto" />
              <p className="text-slate-300">No summary generated yet. Upload a document and click "Generate Summary" to begin.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SummaryTab;
