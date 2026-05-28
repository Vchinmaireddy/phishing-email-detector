/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Sparkles, Shield, AlertTriangle, ShieldCheck, Link, AlertOctagon, RefreshCw, Layers } from 'lucide-react';
import { EmailDatasetItem, PredictionResult, ClassifierType } from '../types';
import { extractAllFeatures, extractAndAnalyzeLinks, getSpecialCharRatio, PHISHING_KEYWORDS, TfidfVectorizer } from '../lib/ml';

interface EmailAnalyzerProps {
  presets: EmailDatasetItem[];
  vectorizer: TfidfVectorizer;
  activeClassifierName: ClassifierType;
  modelWeights: Record<string, number>;
  onPredict: (text: string) => { label: 'phishing' | 'safe'; confidence: number };
}

export default function EmailAnalyzer({
  presets,
  vectorizer,
  activeClassifierName,
  modelWeights,
  onPredict,
}: EmailAnalyzerProps) {
  const [selectedPresetId, setSelectedPresetId] = useState('');
  const [inputSender, setInputSender] = useState('');
  const [inputSubject, setInputSubject] = useState('');
  const [inputBody, setInputBody] = useState('');
  
  // Results
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  
  // AI analysis
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [aiError, setAiError] = useState<string | null>(null);

  // Load preset on dropdown select
  const handlePresetChange = (presetId: string) => {
    setSelectedPresetId(presetId);
    if (!presetId) {
      setInputSender('');
      setInputSubject('');
      setInputBody('');
      setPrediction(null);
      setAiAnalysis(null);
      return;
    }

    const email = presets.find(p => p.id === presetId);
    if (email) {
      setInputSender(email.sender);
      setInputSubject(email.subject);
      setInputBody(email.body);
      
      // Auto analyze when preset is selected
      triggerAnalysis(email.sender, email.subject, email.body);
    }
  };

  // Run the full pipeline analysis
  const triggerAnalysis = (sender: string, subject: string, body: string) => {
    if (!body) return;
    setAiAnalysis(null);
    setAiError(null);

    const fullText = `${subject} ${body}`;
    
    // 1. Run model prediction
    const output = onPredict(fullText);
    
    // 2. Extracted Heuristics
    const links = extractAndAnalyzeLinks(body);
    const lowercaseBody = body.toLowerCase();
    const detectedKeywords = PHISHING_KEYWORDS.filter(kw => lowercaseBody.includes(kw));
    const specialCharRatio = getSpecialCharRatio(body);
    
    // Urgency check
    const lowUrgentWords = ['info', 'update', 'notice'];
    const highUrgentWords = ['immediate', 'urgent', 'action required', 'suspended', 'restrict', 'expire'];
    let urgencyLevel: 'high' | 'medium' | 'low' = 'low';
    if (highUrgentWords.some(w => lowercaseBody.includes(w))) {
      urgencyLevel = 'high';
    } else if (lowUrgentWords.some(w => lowercaseBody.includes(w))) {
      urgencyLevel = 'medium';
    }

    // Top words inside document filtered by vocabulary
    const docTokens = lowercaseBody.replace(/[^\w\s-]/g, ' ').split(/\s+/);
    const uniqueTokens = Array.from(new Set(docTokens));
    const matchedVocabTfidfs = uniqueTokens
      .filter(t => vectorizer.vocabulary.includes(t))
      .map(term => {
        // Simple mock TF inside single doc
        const tf = docTokens.filter(x => x === term).length / docTokens.length;
        const wtVal = modelWeights[term] || 0.0;
        return { word: term, value: tf * Math.abs(wtVal) };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    // Explanation string builder
    let explanation = `Model categorized this text as ${output.label} with ${(output.confidence * 100).toFixed(0)}% confidence based on `;
    if (output.label === 'phishing') {
      explanation += `the presence of high urgency trigger words, multiple suspicious link markers, and heavy density of spam terms in the vocabulary.`;
    } else {
      explanation += `organic domain indicators, official HTTPS secure web standard patterns, and structured personal update sentences.`;
    }

    setPrediction({
      label: output.label,
      confidence: output.confidence,
      extractedFeatures: {
        suspiciousKeywordCount: detectedKeywords.length,
        detectedKeywords,
        linkCount: links.length,
        suspiciousLinkCount: links.filter(l => l.hasIpAddress || l.hasSuspiciousSubdomain || l.hasDeceptiveWording || !l.isSecure).length,
        specialCharRatio,
        urgencyLevel,
        topTfidfWords: matchedVocabTfidfs,
      },
      linkAnalyses: links,
      explanation,
    });
  };

  // AI Security Consultant triggers server-side Gemini 3.5-flash
  const fetchAiReport = async () => {
    if (!prediction || !inputBody) return;
    
    setAiLoading(true);
    setAiError(null);
    setAiAnalysis(null);

    const steps = [
      'Establishing tunnel to security servers...',
      'Isolating hyperlinks & phishing tokens...',
      'Modeling behavioral click lures with Gemini...',
      'Compiling final cybersecurity threat report...',
    ];

    // Stagger loading text changes to make it look highly futuristic
    let stepIdx = 0;
    setLoadingStep(steps[stepIdx]);
    const stepTimer = setInterval(() => {
      if (stepIdx < steps.length - 1) {
        stepIdx++;
        setLoadingStep(steps[stepIdx]);
      }
    }, 1200);

    try {
      const response = await fetch('/api/analyze-gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailText: `From: ${inputSender}\nSubject: ${inputSubject}\nBody: ${inputBody}`,
          mlVerdict: prediction.label,
          confidence: prediction.confidence,
          scores: {
            suspiciousKeywordCount: prediction.extractedFeatures.suspiciousKeywordCount,
            linkCount: prediction.extractedFeatures.linkCount,
            urgencyLevel: prediction.extractedFeatures.urgencyLevel,
          }
        }),
      });

      const data = await response.json();
      clearInterval(stepTimer);

      if (response.ok) {
        setAiAnalysis(data.explanation);
      } else {
        throw new Error(data.error || 'Failed to capture AI report.');
      }
    } catch (err: any) {
      clearInterval(stepTimer);
      setAiError(err?.message || 'Error executing server call. Make sure GEMINI_API_KEY is configured.');
    } finally {
      setAiLoading(false);
    }
  };

  // Simple and pristine parser to convert bold lines and bullets into React elements
  const renderSimpleMarkdown = (markdownText: string) => {
    if (!markdownText) return null;
    const lines = markdownText.split('\n');
    return lines.map((line, idx) => {
      const trimmed = line.trim();
      
      // Headers
      if (trimmed.startsWith('###')) {
        return <h4 key={idx} className="font-extrabold text-sm text-slate-800 mt-4 mb-2 uppercase tracking-wide">{trimmed.replace('###', '').trim()}</h4>;
      }
      if (trimmed.startsWith('##')) {
        return <h3 key={idx} className="font-bold text-base text-indigo-950 mt-5 border-b border-slate-100 pb-1 mb-2">{trimmed.replace('##', '').trim()}</h3>;
      }

      // Bullets
      if (trimmed.startsWith('*') || trimmed.startsWith('-')) {
        // Check for Bold content inside bullets e.g. "- **Tactic**: Details"
        const cleanContent = trimmed.replace(/^[\s*-]+/, '');
        return (
          <li key={idx} className="ml-4 list-disc text-sm text-gray-700 leading-relaxed mb-1.5 font-medium">
            {renderLineWithBolds(cleanContent)}
          </li>
        );
      }

      // Ordered list numbered checks
      if (/^\d+\./.test(trimmed)) {
        const cleanContent = trimmed.replace(/^\d+\./, '').trim();
        const numStr = trimmed.match(/^\d+/)![0];
        return (
          <div key={idx} className="flex gap-2.5 items-start mb-3 font-medium">
            <span className="bg-slate-200 text-slate-800 w-5 h-5 font-bold rounded-full flex items-center justify-center text-xs shrink-0 mt-0.5 font-mono">{numStr}</span>
            <div className="text-sm text-gray-700 leading-relaxed flex-1">{renderLineWithBolds(cleanContent)}</div>
          </div>
        );
      }

      // Empty line
      if (trimmed === '') return <div key={idx} className="h-2"></div>;

      // Default paragraph
      return <p key={idx} className="text-sm text-gray-750 leading-relaxed mb-2 font-medium">{renderLineWithBolds(trimmed)}</p>;
    });
  };

  // Parses basic **bold** matches inline
  const renderLineWithBolds = (textLine: string) => {
    const parts = textLine.split(/\*\*([^*]+)\*\*/g);
    return parts.map((part, i) => {
      if (i % 2 === 1) {
        return <strong key={i} className="font-bold text-gray-900 border-b border-indigo-100 bg-indigo-50/50 px-1 rounded">{part}</strong>;
      }
      return part;
    });
  };

  // Highlight word algorithm mapping document tokens to weights
  const renderHighlightedBody = () => {
    if (!inputBody) return null;
    
    // Split by spaces but preserve delimiters so spacing/tabs stay immaculate
    const tokens = inputBody.split(/(\s+)/);
    
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs font-mono font-medium leading-relaxed max-h-72 overflow-y-auto overflow-x-hidden scrollbar-thin">
        {tokens.map((token, index) => {
          // If spacing, output raw spacing
          if (/^\s+$/.test(token)) {
            return <span key={index}>{token}</span>;
          }

          // Clean token to alphanumeric lowercase
          const cleanToken = token.toLowerCase().replace(/[^\w-]/g, '');
          const wVal = modelWeights[cleanToken];

          if (wVal !== undefined && Math.abs(wVal) > 0.15) {
            const isPhishingIndicator = wVal > 0;
            return (
              <span
                key={index}
                className={`relative group inline-block font-mono font-bold px-1 rounded border-b mx-0.5 transition-all text-[11px] ${
                  isPhishingIndicator
                    ? 'bg-red-50 text-red-700 border-red-300 hover:bg-red-100'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                }`}
              >
                {token}
                {/* Float helper */}
                <span className="pointer-events-none absolute bottom-5 left-1/2 transform -translate-x-1/2 whitespace-nowrap bg-slate-900 text-white text-[9px] px-1.5 py-0.5 rounded shadow opacity-0 group-hover:opacity-100 transition-opacity z-20 font-sans font-semibold">
                  {cleanToken}: {wVal > 0 ? '+' : ''}{wVal.toFixed(2)}
                </span>
              </span>
            );
          }

          return <span key={index}>{token}</span>;
        })}
      </div>
    );
  };

  return (
    <div id="email-analyzer-playground" className="space-y-6">
      
      {/* Sandbox inputs */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex md:flex-row flex-col justify-between md:items-center gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Layers className="text-indigo-600" size={18} />
            <h3 className="font-bold text-gray-900 text-base">Predictive Simulator Sandbox</h3>
          </div>
          
          {/* Preset Select dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap font-sans">Quick Presets</span>
            <select
              id="presets-combo"
              value={selectedPresetId}
              onChange={(e) => handlePresetChange(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg py-1 px-2.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium cursor-pointer"
            >
              <option value="">-- Clear / Write custom --</option>
              <optgroup label="🚨 Phishing Presets">
                {presets.filter(p => p.label === 'phishing').map(p => (
                  <option key={p.id} value={p.id}>{p.subject.substring(0, 32)}...</option>
                ))}
              </optgroup>
              <optgroup label="✅ Legitimate Presets">
                {presets.filter(p => p.label === 'safe').map(p => (
                  <option key={p.id} value={p.id}>{p.subject.substring(0, 32)}...</option>
                ))}
              </optgroup>
            </select>
          </div>
        </div>

        {/* Inputs forms */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="col-span-1 space-y-3">
            <div>
              <label className="block text-[10px] text-slate-500 font-bold mb-1 uppercase tracking-wider">Sender Address (Optional)</label>
              <input
                id="sandbox-sender"
                type="text"
                placeholder="e.g. system-security@netflix.com"
                value={inputSender}
                onChange={(e) => setInputSender(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 placeholder-teal-600 font-mono"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 font-bold mb-1 uppercase tracking-wider">Subject Line (Highly parsed by TF-IDF)</label>
              <input
                id="sandbox-subject"
                type="text"
                placeholder="e.g. Action Required: Your payment billing declined"
                value={inputSubject}
                onChange={(e) => setInputSubject(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 placeholder-teal-600 font-semibold"
              />
            </div>
          </div>
          
          <div className="col-span-1">
            <span className="block text-[10px] text-slate-500 font-bold mb-1 uppercase tracking-wider">Email Text Core Body</span>
            <textarea
              id="sandbox-body"
              rows={5}
              placeholder="Paste email content here. The custom TF-IDF vectorizer and heuristics will scan keywords, links, characters, and urgency signals automatically..."
              value={inputBody}
              onChange={(e) => setInputBody(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 placeholder-teal-600 font-mono leading-relaxed"
            />
          </div>
        </div>

        <div className="flex md:flex-row flex-col justify-end gap-3 pt-2">
          <button
            id="clear-sandbox-btn"
            type="button"
            onClick={() => handlePresetChange('')}
            className="border border-slate-200 hover:bg-slate-50 text-gray-600 rounded-xl px-4 py-2 text-xs font-semibold cursor-pointer"
          >
            Clear Fields
          </button>
          <button
            id="analyze-sandbox-btn"
            type="button"
            disabled={!inputBody}
            onClick={() => triggerAnalysis(inputSender, inputSubject, inputBody)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-5 py-2 text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow disabled:bg-slate-350 disabled:cursor-not-allowed"
          >
            Analyze Email Text
          </button>
        </div>
      </div>

      {/* Analysis Output Dashboard (shows only when predict available) */}
      {prediction && (
        <div id="prediction-response-area" className="grid grid-cols-1 lg:grid-cols-12 gap-6 transition-all duration-300">
          
          {/* Direct Verdict Indicator */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            {/* Verdict Card */}
            <div className={`p-6 border rounded-2xl flex flex-col justify-between shadow-sm flex-1 ${
              prediction.label === 'phishing'
                ? 'bg-rose-50 border-rose-200'
                : 'bg-emerald-50 border-emerald-200'
            }`}>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block">Classifier Verdict</span>
                <div className="flex items-center gap-2 mt-2">
                  {prediction.label === 'phishing' ? (
                    <AlertTriangle className="text-red-600 shrink-0" size={26} />
                  ) : (
                    <ShieldCheck className="text-emerald-600 shrink-0" size={26} />
                  )}
                  <h4 className={`text-xl font-extrabold tracking-tight ${
                    prediction.label === 'phishing' ? 'text-rose-900 animate-pulse' : 'text-emerald-900'
                  }`}>
                    {prediction.label === 'phishing' ? 'FLAGGED PHISHING' : 'VERIFIED SAFE'}
                  </h4>
                </div>
              </div>

              {/* Confidence ring bar */}
              <div className="my-6 text-center">
                <span className="text-gray-400 text-[10px] block font-semibold uppercase tracking-wider">Prediction Confidence Meter</span>
                <span className={`text-4xl font-extrabold font-mono tracking-tighter ${
                  prediction.label === 'phishing' ? 'text-rose-700' : 'text-emerald-700'
                }`}>
                  {(prediction.confidence * 100).toFixed(1)}%
                </span>
                
                <div className="w-full bg-slate-200/60 h-2.5 rounded-full overflow-hidden mt-3 max-w-[12rem] mx-auto">
                  <div className={`h-full rounded-full transition-all duration-500 ${
                    prediction.label === 'phishing' ? 'bg-rose-600' : 'bg-emerald-500'
                  }`} style={{ width: `${prediction.confidence * 100}%` }}></div>
                </div>
              </div>

              <div className="text-[11px] text-gray-500 italic mt-auto leading-relaxed border-t border-slate-200/50 pt-2.5">
                "{prediction.explanation}"
              </div>
            </div>
            
            {/* Run Custom AI consultant block */}
            <div id="ai-consultant-lure" className="bg-slate-900 border border-slate-800 p-5 rounded-2xl text-white space-y-3 flex flex-col justify-between">
              <div>
                <span className="text-amber-400 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider">
                  <Sparkles size={11} className="animate-spin" /> Deep AI Threat Analysis
                </span>
                <h4 className="text-sm font-extrabold mt-1">Audit Social Lures with Gemini</h4>
                <p className="text-gray-400 text-[11px] leading-relaxed mt-1">
                  Connect the email text with Google's Gemini 3.5-flash model to reveal psychological deception, link spoofing vectors, and custom safety steps.
                </p>
              </div>

              <button
                id="fetch-ai-consultant-btn"
                type="button"
                disabled={aiLoading}
                onClick={fetchAiReport}
                className="w-full mt-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-700 text-white py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow"
              >
                {aiLoading ? (
                  <>
                    <RefreshCw className="animate-spin" size={12} /> Fetching report...
                  </>
                ) : (
                  <>Ready | Generate Consultation</>
                )}
              </button>
            </div>
          </div>

          {/* Model word analysis and checklist parameters */}
          <div className="lg:col-span-8 space-y-4">
            
            {/* Word Highlighter weights block */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
              <div>
                <h4 className="font-bold text-gray-900 text-sm">Feature Weight Word Mapping (Explainable AI)</h4>
                <p className="text-gray-500 text-xs">Hover highlighted words below to examine internal weight parameters: <span className="bg-red-50 text-rose-800 font-semibold px-1 py-0.5 rounded">Red elements</span> trigger phishing scores; <span className="bg-emerald-50 text-emerald-800 font-semibold px-1 py-0.5 rounded">Green elements</span> skew safe.</p>
              </div>
              
              {renderHighlightedBody()}
              
              <div className="flex flex-wrap gap-2 pt-1">
                {prediction.extractedFeatures.topTfidfWords.length > 0 && (
                  <>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pt-1 flex items-center font-mono">Dominant Terms:</span>
                    {prediction.extractedFeatures.topTfidfWords.map(tw => (
                      <span key={tw.word} className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-mono font-semibold">
                        {tw.word} ({(tw.value * 10).toFixed(2)})
                      </span>
                    ))}
                  </>
                )}
              </div>
            </div>

            {/* Structured Heuristics Scan checklists */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              
              {/* Core Heuristics Indicators */}
              <div className="md:col-span-6 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3 flex flex-col justify-between">
                <h4 className="font-bold text-gray-900 text-sm">Heuristics Signal Scan</h4>
                
                <div className="space-y-2.5 flex-1 pt-1 justify-around flex flex-col">
                  {/* Keywords */}
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500 font-medium">Suspicious Keywords Match</span>
                    <span className={`font-mono font-bold px-2 py-0.5 rounded ${
                      prediction.extractedFeatures.suspiciousKeywordCount > 1 ? 'bg-red-100 text-red-800 font-bold' : 'bg-slate-100 text-gray-600'
                    }`}>
                      {prediction.extractedFeatures.suspiciousKeywordCount} triggers
                    </span>
                  </div>

                  {/* Link Count */}
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500 font-medium font-sans">Extracted Hyperlinks</span>
                    <span className="font-mono font-bold bg-slate-100 text-gray-650 px-2 py-0.5 rounded">
                      {prediction.extractedFeatures.linkCount} urls
                    </span>
                  </div>

                  {/* Special Char Ratio */}
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500 font-medium">Special Characters Ratio</span>
                    <span className={`font-mono font-bold px-1.5 py-0.5 rounded ${
                      prediction.extractedFeatures.specialCharRatio > 0.04 ? 'bg-orange-100 text-orange-850' : 'bg-slate-100 text-gray-600'
                    }`}>
                      {(prediction.extractedFeatures.specialCharRatio * 100).toFixed(2)}%
                    </span>
                  </div>

                  {/* Urgency panic level */}
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500 font-medium">Urgency & Panic Language</span>
                    <span className={`font-semibold uppercase tracking-wider text-[10px] px-2 py-0.5 rounded ${
                      prediction.extractedFeatures.urgencyLevel === 'high' ? 'bg-red-100 text-red-800 font-bold animate-pulse' :
                      prediction.extractedFeatures.urgencyLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-slate-100 text-gray-650'
                    }`}>
                      {prediction.extractedFeatures.urgencyLevel} threat
                    </span>
                  </div>
                </div>

                {prediction.extractedFeatures.detectedKeywords.length > 0 && (
                  <div className="text-[10px] text-gray-400 font-semibold border-t border-slate-100 pt-2.5 leading-relaxed">
                    Triggers: {prediction.extractedFeatures.detectedKeywords.join(', ')}
                  </div>
                )}
              </div>

              {/* URL Hyperlinks Diagnostic Audit */}
              <div className="md:col-span-6 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3 flex flex-col justify-between">
                <h4 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                  <Link size={14} className="text-slate-500" /> Embedded URLs Safety
                </h4>
                
                <div className="flex-1 overflow-y-auto max-h-40 min-h-[7rem] pr-1 space-y-2 scrollbar-thin">
                  {prediction.linkAnalyses.length === 0 ? (
                    <div className="text-center text-gray-400 text-xs py-8">No links detected in email text.</div>
                  ) : (
                    prediction.linkAnalyses.map((ul, idx) => {
                      const isUnsecure = !ul.isSecure || ul.hasIpAddress || ul.hasDeceptiveWording || ul.hasSuspiciousSubdomain;
                      return (
                        <div key={idx} className="p-2 border border-slate-100 rounded-lg space-y-1.5 text-[11px] bg-slate-50 font-mono">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-700 truncate max-w-[12rem] font-medium" title={ul.url}>{ul.url}</span>
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold tracking-widest uppercase ${
                              isUnsecure ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {isUnsecure ? 'High Risk' : 'Secure SSL'}
                            </span>
                          </div>
                          
                          <div className="flex flex-wrap gap-1">
                            {!ul.isSecure && <span className="bg-rose-50 text-rose-700 px-1 text-[8px] font-sans rounded">⚠ Unsecured HTTP</span>}
                            {ul.hasIpAddress && <span className="bg-red-50 text-red-700 px-1 text-[8px] font-sans rounded">⚠ Raw IP Address</span>}
                            {ul.hasDeceptiveWording && <span className="bg-amber-50 text-amber-700 px-1 text-[8px] font-sans rounded">⚠ Deceptive login keyword</span>}
                            {ul.hasSuspiciousSubdomain && <span className="bg-orange-50 text-orange-700 px-1 text-[8px] font-sans rounded">⚠ Subdomain mimic (brand spoof)</span>}
                            {!isUnsecure && <span className="text-emerald-700 font-sans font-bold flex items-center">✔ Safe domain headers</span>}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

            </div>

          </div>

          {/* AI Security Consultant details panel */}
          {(aiLoading || aiAnalysis || aiError) && (
            <div id="ai-threat-consultant-panel" className="lg:col-span-12 bg-slate-50 border border-indigo-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex justify-between items-start border-b border-indigo-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="bg-slate-900 text-white rounded-lg p-1.5">
                    <Sparkles size={16} className="text-amber-400 shrink-0" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-indigo-950 text-base">Gemini 3.5 Threat Vulnerability Report</h3>
                    <p className="text-slate-500 text-xs">Live contextual inspection of linguistic markers, social hooks, and domain credibility indicators.</p>
                  </div>
                </div>
                
                {aiLoading && (
                  <span className="text-[10px] font-bold font-mono text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded uppercase tracking-widest animate-pulse">
                    Live consulting...
                  </span>
                )}
              </div>

              {aiLoading && (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <div className="relative w-12 h-12">
                    <div className="absolute inset-0 rounded-full border-4 border-slate-200 border-t-indigo-600 animate-spin"></div>
                  </div>
                  <div className="text-center">
                    <span className="text-xs font-bold text-slate-700 block tracking-wider animate-bounce uppercase font-mono">{loadingStep}</span>
                    <span className="text-[10px] text-gray-400 font-medium">Interfacing Google AI Studio server context</span>
                  </div>
                </div>
              )}

              {aiError && (
                <div id="ai-error-box" className="p-4 border border-rose-200 bg-rose-50 text-rose-800 rounded-xl space-y-2 text-xs">
                  <div className="font-bold flex items-center gap-1.5"><AlertOctagon size={14} /> AI Interface Interrupted</div>
                  <p className="font-medium">{aiError}</p>
                  <p className="text-[10px] text-gray-500 font-medium">Please review if you have your GEMINI_API_KEY environment variable provided in the AI Studio platform Secrets menu.</p>
                </div>
              )}

              {aiAnalysis && (
                <div id="ai-markdown-rendered-view" className="bg-white border border-slate-150 p-6 rounded-xl relative text-slate-800">
                  <button
                    onClick={() => setAiAnalysis(null)}
                    className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-xs font-bold font-sans"
                  >
                    ✕ Dismiss Report
                  </button>
                  <div className="space-y-4 max-w-none text-xs">
                    {renderSimpleMarkdown(aiAnalysis)}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      )}

    </div>
  );
}
