/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ShieldAlert, CheckCircle, Search, HelpCircle, Eye } from 'lucide-react';
import { ModelMetrics, WordFeatureWeight, EmailDatasetItem } from '../types';

interface ModelEvaluationProps {
  metrics: ModelMetrics;
  weights: WordFeatureWeight[];
  activeClassifier: string;
  testSet: EmailDatasetItem[];
  predictionsMap: Record<string, { label: 'phishing' | 'safe'; confidence: number }>;
}

export default function ModelEvaluation({
  metrics,
  weights,
  activeClassifier,
  testSet,
  predictionsMap,
}: ModelEvaluationProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMatrixCell, setSelectedMatrixCell] = useState<{
    key: 'tp' | 'tn' | 'fp' | 'fn';
    title: string;
    description: string;
  } | null>(null);

  // Filter weights based on search term
  const filteredWeights = weights
    .filter(w => w.word.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight));

  // Extract lists of emails for interactive confusion matrix inspection
  const getMatrixEmails = (cellType: 'tp' | 'tn' | 'fp' | 'fn'): EmailDatasetItem[] => {
    return testSet.filter(item => {
      const pred = predictionsMap[item.id];
      if (!pred) return false;
      
      if (cellType === 'tp') return item.label === 'phishing' && pred.label === 'phishing';
      if (cellType === 'tn') return item.label === 'safe' && pred.label === 'safe';
      if (cellType === 'fp') return item.label === 'safe' && pred.label === 'phishing';
      if (cellType === 'fn') return item.label === 'phishing' && pred.label === 'safe';
      return false;
    });
  };

  const matrixInfo = {
    tp: {
      title: 'True Positives (TP)',
      description: 'Emails that are actual Phishing and were correctly flagged as Phishing.',
    },
    tn: {
      title: 'True Negatives (TN)',
      description: 'Emails that are actual Safe and were correctly flagged as Safe.',
    },
    fp: {
      title: 'False Positives (FP) - False Alarms',
      description: 'Emails that are actual Safe but the model incorrectly flagged as Phishing.',
    },
    fn: {
      title: 'False Negatives (FN) - Leaked Threats',
      description: 'Emails that are actual Phishing but the model failed to catch, classifying as Safe.',
    },
  };

  const renderMetricCard = (
    label: string,
    value: number,
    colorClass: string,
    borderColor: string,
    bgProgress: string,
    tooltip: string
  ) => {
    const pct = Math.round(value * 100);
    return (
      <div id={`metric-${label.toLowerCase()}`} className="border border-slate-200 bg-white p-4 rounded-xl flex flex-col justify-between shadow-sm relative group">
        <div className="flex justify-between items-start">
          <span className="text-gray-500 text-xs font-semibold uppercase tracking-wider">{label}</span>
          <div className="text-gray-400 hover:text-gray-600 cursor-help peer">
            <HelpCircle size={14} id={`help-${label.toLowerCase()}`} />
          </div>
          <div className="absolute right-4 top-10 w-64 p-2 bg-slate-900 text-white text-xs rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 pointer-events-none">
            {tooltip}
          </div>
        </div>
        
        <div className="my-3 flex items-baseline">
          <span className={`text-4xl font-extrabold tracking-tight ${colorClass}`}>{pct}%</span>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-500 ${bgProgress}`} style={{ width: `${pct}%` }}></div>
        </div>
      </div>
    );
  };

  const highlightedEmailsOfCell = selectedMatrixCell ? getMatrixEmails(selectedMatrixCell.key) : [];

  return (
    <div id="model-evaluation-dashboard" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Metrics Row */}
      <div className="lg:col-span-12 grid grid-cols-2 md:grid-cols-4 gap-4">
        {renderMetricCard(
          'Accuracy',
          metrics.accuracy,
          'text-indigo-600',
          'border-indigo-100',
          'bg-indigo-600',
          'Overall percentage of correct predictions (both Phishing and Safe) out of total test emails.'
        )}
        {renderMetricCard(
          'Precision',
          metrics.precision,
          'text-emerald-600',
          'border-emerald-100',
          'bg-emerald-600',
          'Out of all emails predicted to be Phishing, how many were actually Phishing? Minimizes False Alarms (False Positives).'
        )}
        {renderMetricCard(
          'Recall',
          metrics.recall,
          'text-rose-600',
          'border-rose-100',
          'bg-rose-600',
          'Out of all actual Phishing emails, how many did the model capture? Minimizes Missed Attacks (False Negatives).'
        )}
        {renderMetricCard(
          'F1 Score',
          metrics.f1,
          'text-amber-600',
          'border-amber-100',
          'bg-amber-600',
          'The harmonic mean of Precision and Recall. High F1 ensures balanced defense, avoiding blind spots.'
        )}
      </div>

      {/* Confusion Matrix Visual */}
      <div id="confusion-matrix-panel" className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="font-bold text-gray-900 text-lg">Confusion Matrix</h3>
            <p className="text-gray-500 text-xs">Analyze exact classifier predictions on the Test set. Hover or click a quadrant to inspect classified emails.</p>
          </div>
          <span className="text-xs px-2.5 py-1 font-semibold rounded-full bg-slate-100 text-slate-700 capitalize font-mono">
            {activeClassifier.replace('_', ' ')}
          </span>
        </div>

        {/* Matrix Grid Representation */}
        <div className="relative border border-slate-200 rounded-xl overflow-hidden bg-slate-50 p-6 grid grid-cols-12 gap-4">
          
          {/* Label Columns */}
          <div className="col-span-12 grid grid-cols-12 mb-1 text-center font-semibold text-xs text-gray-500">
            <div className="col-span-3"></div>
            <div className="col-span-9 grid grid-cols-2">
              <div className="text-rose-600 uppercase tracking-wider font-mono">Predicted Phishing</div>
              <div className="text-emerald-600 uppercase tracking-wider font-mono">Predicted Safe</div>
            </div>
          </div>

          <div className="col-span-3 flex flex-col justify-around text-right pr-2 text-xs font-semibold text-gray-500 uppercase tracking-wider font-mono py-8 h-full">
            <div className="text-rose-700">Actual Phishing</div>
            <div className="text-emerald-700">Actual Safe</div>
          </div>

          <div className="col-span-9 grid grid-cols-2 gap-4">
            {/* True Positive (TP) */}
            <button
              id="quadrant-tp"
              onClick={() => setSelectedMatrixCell({ key: 'tp', ...matrixInfo.tp })}
              className={`p-6 bg-red-50 hover:bg-red-100 border-2 rounded-xl flex flex-col justify-between text-left transition-all cursor-pointer ${
                selectedMatrixCell?.key === 'tp' ? 'border-rose-500 ring-2 ring-rose-200 shadow-md' : 'border-red-200 hover:scale-[1.02]'
              }`}
            >
              <div className="flex md:flex-row flex-col justify-between items-start w-full gap-2">
                <span className="text-rose-800 text-xs font-bold uppercase tracking-wide">True Positive (TP)</span>
                <span className="text-xs text-rose-500 flex items-center bg-red-100 px-1.5 py-0.5 rounded gap-1"><Eye size={10} /> Inspect</span>
              </div>
              <div className="mt-4 flex items-baseline justify-between w-full">
                <span className="text-4xl font-extrabold text-rose-700 font-mono">{metrics.confusionMatrix.tp}</span>
                <span className="text-xs text-gray-400">Captured Phish</span>
              </div>
            </button>

            {/* False Negative (FN) - Risk! */}
            <button
              id="quadrant-fn"
              onClick={() => setSelectedMatrixCell({ key: 'fn', ...matrixInfo.fn })}
              className={`p-6 bg-rose-50 hover:bg-rose-100 border-2 rounded-xl flex flex-col justify-between text-left transition-all cursor-pointer ${
                selectedMatrixCell?.key === 'fn' ? 'border-red-600 ring-2 ring-rose-300 shadow-md animate-pulse' : 'border-red-300 border-dashed hover:scale-[1.02]'
              }`}
            >
              <div className="flex md:flex-row flex-col justify-between items-start w-full gap-2">
                <span className="text-rose-900 text-xs font-bold uppercase tracking-wide">False Negative (FN)</span>
                <span className="text-xs text-rose-600 flex items-center bg-rose-200 px-1.5 py-0.5 rounded gap-1"><Eye size={10} /> Inspect</span>
              </div>
              <div className="mt-4 flex items-baseline justify-between w-full">
                <span className="text-4xl font-extrabold text-rose-800 font-mono">{metrics.confusionMatrix.fn}</span>
                <span className="text-xs text-rose-600 font-semibold bg-red-100 px-1.5 py-0.5 rounded">Critical Threat!</span>
              </div>
            </button>

            {/* False Positive (FP) - False Alarm */}
            <button
              id="quadrant-fp"
              onClick={() => setSelectedMatrixCell({ key: 'fp', ...matrixInfo.fp })}
              className={`p-6 bg-slate-50 hover:bg-zinc-100 border-2 rounded-xl flex flex-col justify-between text-left transition-all cursor-pointer ${
                selectedMatrixCell?.key === 'fp' ? 'border-yellow-400 ring-1 ring-yellow-200 shadow-md' : 'border-slate-200 hover:scale-[1.02]'
              }`}
            >
              <div className="flex md:flex-row flex-col justify-between items-start w-full gap-2">
                <span className="text-slate-800 text-xs font-bold uppercase tracking-wide">False Positive (FP)</span>
                <span className="text-xs text-gray-500 flex items-center bg-slate-200 px-1.5 py-0.5 rounded gap-1"><Eye size={10} /> Inspect</span>
              </div>
              <div className="mt-4 flex items-baseline justify-between w-full">
                <span className="text-4xl font-extrabold text-slate-700 font-mono">{metrics.confusionMatrix.fp}</span>
                <span className="text-xs text-slate-500">False Alarm</span>
              </div>
            </button>

            {/* True Negative (TN) - Success */}
            <button
              id="quadrant-tn"
              onClick={() => setSelectedMatrixCell({ key: 'tn', ...matrixInfo.tn })}
              className={`p-6 bg-emerald-50 hover:bg-emerald-100 border-2 rounded-xl flex flex-col justify-between text-left transition-all cursor-pointer ${
                selectedMatrixCell?.key === 'tn' ? 'border-emerald-500 ring-2 ring-emerald-200 shadow-md' : 'border-emerald-200 hover:scale-[1.02]'
              }`}
            >
              <div className="flex md:flex-row flex-col justify-between items-start w-full gap-2">
                <span className="text-emerald-800 text-xs font-bold uppercase tracking-wide">True Negative (TN)</span>
                <span className="text-xs text-emerald-500 flex items-center bg-emerald-100 px-1.5 py-0.5 rounded gap-1"><Eye size={10} /> Inspect</span>
              </div>
              <div className="mt-4 flex items-baseline justify-between w-full">
                <span className="text-4xl font-extrabold text-emerald-700 font-mono">{metrics.confusionMatrix.tn}</span>
                <span className="text-xs text-gray-400">Protected Safe</span>
              </div>
            </button>
          </div>
        </div>

        {/* Matrix Detail Inspector */}
        {selectedMatrixCell && (
          <div id="confusion-matrix-inspector" className="mt-6 border border-slate-200 rounded-xl bg-slate-50 p-4 relative">
            <button
              onClick={() => setSelectedMatrixCell(null)}
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-xs font-bold"
            >
              ✕ Close
            </button>
            <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${
                selectedMatrixCell.key === 'tp' ? 'bg-rose-500' :
                selectedMatrixCell.key === 'tn' ? 'bg-emerald-500' :
                selectedMatrixCell.key === 'fp' ? 'bg-amber-400' : 'bg-red-600'
              }`}></span>
              {selectedMatrixCell.title}
            </h4>
            <p className="text-gray-500 text-xs mt-1">{selectedMatrixCell.description}</p>
            
            <div className="mt-3 max-h-56 overflow-y-auto space-y-2">
              {highlightedEmailsOfCell.length === 0 ? (
                <div className="text-center text-xs text-gray-400 py-6">No test emails matched this block. Re-train with different splits to test other examples!</div>
              ) : (
                highlightedEmailsOfCell.map(email => {
                  const details = predictionsMap[email.id];
                  return (
                    <div key={email.id} className="bg-white p-3 rounded-lg border border-slate-200 text-xs">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-semibold text-gray-800 truncate max-w-[12rem]">{email.sender}</span>
                        <div className="flex gap-1">
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-gray-500">Actual: {email.label}</span>
                          <span className={`px-1.5 py-0.5 rounded font-semibold ${email.label === 'phishing' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                            Pred: {details?.label} ({(details?.confidence * 100).toFixed(0)}%)
                          </span>
                        </div>
                      </div>
                      <div className="text-gray-600 font-medium truncate mb-1">Subject: {email.subject}</div>
                      <div className="text-gray-400 line-clamp-2 italic">"{email.body}"</div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Model Weights List */}
      <div id="feature-weights-panel" className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col h-[525px]">
        <div>
          <h3 className="font-bold text-gray-900 text-lg">TF-IDF & Heuristic Features</h3>
          <p className="text-gray-500 text-xs">View ranked keywords and metrics displaying mathematical correlations to Phishing (Red) vs. Safe (Green) classes.</p>
        </div>

        {/* Search Bar */}
        <div className="relative mt-4 mb-3">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
            <Search size={14} />
          </span>
          <input
            id="feature-weight-search"
            type="text"
            placeholder="Search keywords..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-800 placeholder-teal-600 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all font-mono"
          />
        </div>

        {/* Weights List Container */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 h-full scrollbar-thin">
          {filteredWeights.length === 0 ? (
            <div className="text-center text-gray-400 text-xs py-10">No matching features found.</div>
          ) : (
            filteredWeights.map((w, index) => {
              const isPhishAffinity = w.weight > 0;
              const absWt = Math.abs(w.weight);
              // Max weight for scaling visual meter widths
              const maxWt = Math.max(...weights.map(item => Math.abs(item.weight))) || 1.0;
              const barWidth = Math.min((absWt / maxWt) * 100, 100);

              return (
                <div key={w.word} className="flex flex-col p-2 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors">
                  <div className="flex justify-between items-center text-xs font-mono mb-1">
                    <span className="font-semibold text-gray-700">{w.word}</span>
                    <span className={`font-bold ${isPhishAffinity ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {w.weight > 0 ? '+' : ''}{w.weight.toFixed(3)}
                    </span>
                  </div>
                  
                  {/* Visual split bar */}
                  <div className="w-full h-1.5 bg-slate-100 rounded-full flex overflow-hidden">
                    {isPhishAffinity ? (
                      <div className="w-1/2 h-full bg-slate-100"></div>
                    ) : (
                      <div className="w-1/2 h-full flex justify-end">
                        <div className="h-full bg-emerald-500 rounded-full transition-all duration-300" style={{ width: `${barWidth}%` }}></div>
                      </div>
                    )}
                    
                    {isPhishAffinity ? (
                      <div className="w-1/2 h-full flex justify-start">
                        <div className="h-full bg-rose-500 rounded-full transition-all duration-300" style={{ width: `${barWidth}%` }}></div>
                      </div>
                    ) : (
                      <div className="w-1/2 h-full bg-slate-100"></div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
