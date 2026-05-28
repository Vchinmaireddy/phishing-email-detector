/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Play, Plus, Trash2, Search, Sliders, Database, Info, Layers } from 'lucide-react';
import { EmailDatasetItem, ClassifierType } from '../types';

interface TrainingDashboardProps {
  dataset: EmailDatasetItem[];
  activeClassifier: ClassifierType;
  trainRatio: number;
  epochs: number;
  featuresCount: number;
  onClassifierChange: (c: ClassifierType) => void;
  onTrainRatioChange: (r: number) => void;
  onEpochsChange: (e: number) => void;
  onFeaturesCountChange: (f: number) => void;
  onAddEmail: (email: EmailDatasetItem) => void;
  onDeleteEmail: (id: string) => void;
  onTriggerRebuild: () => void;
  logs: { epoch: number; loss: number }[];
  trainCount: number;
  testCount: number;
}

export default function TrainingDashboard({
  dataset,
  activeClassifier,
  trainRatio,
  epochs,
  featuresCount,
  onClassifierChange,
  onTrainRatioChange,
  onEpochsChange,
  onFeaturesCountChange,
  onAddEmail,
  onDeleteEmail,
  onTriggerRebuild,
  logs,
  trainCount,
  testCount,
}: TrainingDashboardProps) {
  // Local state for the insert form
  const [formSender, setFormSender] = useState('');
  const [formSubject, setFormSubject] = useState('');
  const [formBody, setFormBody] = useState('');
  const [formLabel, setFormLabel] = useState<'phishing' | 'safe'>('phishing');
  const [corpusSearch, setCorpusSearch] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const handleSubmitCustomEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSender || !formSubject || !formBody) return;

    const newEmail: EmailDatasetItem = {
      id: `custom-${Date.now()}`,
      sender: formSender,
      subject: formSubject,
      body: formBody,
      label: formLabel,
      isCustom: true,
    };

    onAddEmail(newEmail);
    
    // Clear form
    setFormSender('');
    setFormSubject('');
    setFormBody('');
    setShowAddForm(false);
  };

  const filteredDataset = dataset.filter(item => {
    const term = corpusSearch.toLowerCase();
    return (
      item.sender.toLowerCase().includes(term) ||
      item.subject.toLowerCase().includes(term) ||
      item.body.toLowerCase().includes(term)
    );
  });

  return (
    <div id="training-controls-dashboard" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* Hyperparameters Pane */}
      <div id="hyperparameters-panel" className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-5">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Sliders className="text-indigo-600" size={18} />
          <h3 className="font-bold text-gray-900 text-base">Model Hyperparameters</h3>
        </div>

        {/* Algorithm Selection */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-700 uppercase tracking-widest flex items-center gap-1.5">
            <Layers size={12} /> Classification Algorithm
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              id="classifier-nb-btn"
              type="button"
              onClick={() => onClassifierChange('naive_bayes')}
              className={`p-2.5 text-xs font-bold rounded-xl border text-center transition-all ${
                activeClassifier === 'naive_bayes'
                  ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-sm font-semibold'
                  : 'bg-white border-slate-200 text-gray-600 hover:bg-slate-50'
              }`}
            >
              Naive Bayes
            </button>
            <button
              id="classifier-lr-btn"
              type="button"
              onClick={() => onClassifierChange('logistic_regression')}
              className={`p-2.5 text-xs font-bold rounded-xl border text-center transition-all ${
                activeClassifier === 'logistic_regression'
                  ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-sm font-semibold'
                  : 'bg-white border-slate-200 text-gray-600 hover:bg-slate-50'
              }`}
            >
              Logistic Reg.
            </button>
            <button
              id="classifier-dt-btn"
              type="button"
              onClick={() => onClassifierChange('decision_tree')}
              className={`p-2.5 text-xs font-bold rounded-xl border text-center transition-all ${
                activeClassifier === 'decision_tree'
                  ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-sm font-semibold'
                  : 'bg-white border-slate-200 text-gray-600 hover:bg-slate-50'
              }`}
            >
              Decision Tree
            </button>
          </div>
          <p className="text-[10px] text-gray-400 font-medium">
            {activeClassifier === 'naive_bayes' && 'Uses joint conditional probabilities of words to predict phishing. Fast & robust.'}
            {activeClassifier === 'logistic_regression' && 'Uses sigmoid log-loss on TF-IDF + Heuristic vectors via gradient descent optimization.'}
            {activeClassifier === 'decision_tree' && 'Splits nodes visually based on entropy gain metrics of key terms and link scores.'}
          </p>
        </div>

        {/* Sliders */}
        <div id="sliders-controls" className="space-y-4 pt-1">
          {/* Train Split Ratio */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-gray-700">Train/Test Split Ratio</span>
              <span className="font-mono font-bold text-indigo-600">{(trainRatio * 100).toFixed(0)}% Train / {Math.round(100 - trainRatio * 100)}% Test</span>
            </div>
            <input
              id="train-split-slider"
              type="range"
              min="0.5"
              max="0.9"
              step="0.05"
              value={trainRatio}
              onChange={(e) => onTrainRatioChange(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <div className="flex justify-between text-[9px] text-gray-400 font-mono font-bold">
              <span>50/50</span>
              <span>70/30</span>
              <span>80/20</span>
              <span>90/10</span>
            </div>
          </div>

          {/* Vocabulary / Feature Count */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-gray-700">Vocabulary Size (TF-IDF Features)</span>
              <span className="font-mono font-bold text-indigo-600">{featuresCount} Terms</span>
            </div>
            <input
              id="vocab-size-slider"
              type="range"
              min="40"
              max="120"
              step="5"
              value={featuresCount}
              onChange={(e) => onFeaturesCountChange(parseInt(e.target.value))}
              className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <div className="flex justify-between text-[9px] text-gray-400 font-mono font-bold">
              <span>40 words</span>
              <span>80 words</span>
              <span>120 words</span>
            </div>
          </div>

          {/* Epoch Slider (For Logistic Regression) */}
          {activeClassifier === 'logistic_regression' && (
            <div className="space-y-1.5 transition-all duration-300">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-gray-700">Gradient Descent Epochs</span>
                <span className="font-mono font-bold text-indigo-600">{epochs} Epochs</span>
              </div>
              <input
                id="epochs-slider"
                type="range"
                min="10"
                max="150"
                step="10"
                value={epochs}
                onChange={(e) => onEpochsChange(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <div className="flex justify-between text-[9px] text-gray-400 font-mono font-bold">
                <span>10 iterations</span>
                <span>80 iterations</span>
                <span>150 iterations</span>
              </div>
            </div>
          )}
        </div>

        {/* Training Log Graph Mini (For SGD convergence) */}
        {activeClassifier === 'logistic_regression' && logs.length > 0 && (
          <div className="bg-slate-50 border border-slate-150 p-3 rounded-xl">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1">
              <Info size={11} /> Cross Entropy Loss Trajectory
            </span>
            <div className="h-16 flex items-end gap-0.5 mt-2 overflow-hidden border-b border-l border-slate-200 pl-1">
              {logs.map((log, i) => {
                // Determine heights relative to max loss
                const maxLoss = Math.max(...logs.map(l => l.loss)) || 1.0;
                const hPct = `${(log.loss / maxLoss) * 100}%`;
                return (
                  <div
                    key={log.epoch}
                    title={`Epoch ${log.epoch}: Loss ${log.loss.toFixed(4)}`}
                    className="flex-1 bg-indigo-500 hover:bg-rose-500 transition-colors"
                    style={{ height: hPct }}
                  ></div>
                );
              })}
            </div>
            <div className="flex justify-between text-[8px] text-gray-400 font-mono mt-1 font-semibold">
              <span>Epoch 1</span>
              <span>Loss: {logs[logs.length-1]?.loss.toFixed(3)}</span>
              <span>Epoch {logs.length}</span>
            </div>
          </div>
        )}

        {/* Trigger Train Button */}
        <button
          id="train-model-rebuild-btn"
          type="button"
          onClick={onTriggerRebuild}
          className="w-full bg-slate-900 border border-transparent hover:bg-slate-850 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow"
        >
          <Play size={15} /> Re-Train classification model
        </button>

        <div className="flex justify-around items-center pt-2 text-center text-xs bg-slate-50 p-2.5 rounded-xl border border-dashed border-slate-200">
          <div>
            <span className="text-gray-400 block uppercase font-mono font-bold text-[8px]">Train Sample</span>
            <span className="text-base font-extrabold text-slate-800">{trainCount} emails</span>
          </div>
          <div className="w-px h-8 bg-slate-200"></div>
          <div>
            <span className="text-gray-400 block uppercase font-mono font-bold text-[8px]">Test Sample</span>
            <span className="text-base font-extrabold text-slate-800">{testCount} emails</span>
          </div>
        </div>
      </div>

      {/* Dataset & Database Explorer */}
      <div id="dataset-explorer" className="lg:col-span-12 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex md:flex-row flex-col justify-between md:items-center gap-4 mb-4 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Database className="text-indigo-600" size={18} />
            <div>
              <h3 className="font-bold text-gray-900 text-base">Labeled Training Corpus</h3>
              <p className="text-gray-500 text-xs">Review or search through the current set of training emails. Delete samples to watch model accuracy change.</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 shrink-0">
            {/* Search Corpus */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-gray-400">
                <Search size={12} />
              </span>
              <input
                id="corpus-search"
                type="text"
                placeholder="Search corpus..."
                value={corpusSearch}
                onChange={(e) => setCorpusSearch(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
              />
            </div>
            
            {/* Toggle Add Email Form */}
            <button
              id="toggle-add-form-btn"
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-2.5 py-1 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shadow"
            >
              <Plus size={12} /> {showAddForm ? 'Hide Form' : 'Add Sample'}
            </button>
          </div>
        </div>

        {/* Inline Custom Add Form */}
        {showAddForm && (
          <form id="add-email-form" onSubmit={handleSubmitCustomEmail} className="bg-slate-50 border border-indigo-100 rounded-xl p-4 mb-5 space-y-3 transition-all duration-300">
            <h4 className="font-bold text-xs text-indigo-900 uppercase tracking-wider">Feed Custom Clean / Phishing data</h4>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              <div className="md:col-span-4">
                <label className="block text-[10px] text-slate-500 font-semibold mb-1 uppercase">Sender Address</label>
                <input
                  id="form-sender-input"
                  type="text"
                  required
                  placeholder="e.g., support@netflix-billing.com"
                  value={formSender}
                  onChange={(e) => setFormSender(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div className="md:col-span-5">
                <label className="block text-[10px] text-slate-500 font-semibold mb-1 uppercase">Subject Line</label>
                <input
                  id="form-subject-input"
                  type="text"
                  required
                  placeholder="e.g., Immediate Account Password Expired Alert"
                  value={formSubject}
                  onChange={(e) => setFormSubject(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div className="md:col-span-3">
                <label className="block text-[10px] text-slate-500 font-semibold mb-1 uppercase">Label Classification</label>
                <div className="flex gap-4 h-9 items-center">
                  <label className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer">
                    <input
                      id="form-label-phish"
                      type="radio"
                      name="formLabel"
                      checked={formLabel === 'phishing'}
                      onChange={() => setFormLabel('phishing')}
                      className="text-pink-600 focus:ring-pink-500"
                    />
                    <span className="text-red-700">Phishing</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer">
                    <input
                      id="form-label-safe"
                      type="radio"
                      name="formLabel"
                      checked={formLabel === 'safe'}
                      onChange={() => setFormLabel('safe')}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-emerald-700">Safe Email</span>
                  </label>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-slate-500 font-semibold mb-1 uppercase">Full Body Content</label>
              <textarea
                id="form-body-text"
                required
                rows={3}
                placeholder="Paste the email content, links, and keywords here..."
                value={formBody}
                onChange={(e) => setFormBody(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
              />
            </div>

            <button
              id="submit-model-add-btn"
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-4 py-2 text-xs font-bold transition-all cursor-pointer shadow-sm"
            >
              Add to Corpus and Recompile Features
            </button>
          </form>
        )}

        {/* Corpus Table and List */}
        <div id="corpus-list-container" className="max-h-80 overflow-y-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 text-[10px] font-bold uppercase font-mono tracking-wider">
                <th className="p-3 w-40">Sender</th>
                <th className="p-3 w-56">Subject</th>
                <th className="p-3 hidden md:table-cell">Body Snippet</th>
                <th className="p-3 w-28 text-center">Label</th>
                <th className="p-3 w-16 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredDataset.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center text-gray-400 py-10">No items match your search.</td>
                </tr>
              ) : (
                filteredDataset.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                    {/* Sender */}
                    <td className="p-3 text-gray-700 font-mono font-medium truncate max-w-[10rem]" title={item.sender}>
                      {item.sender}
                    </td>
                    
                    {/* Subject */}
                    <td className="p-3 text-gray-900 font-semibold truncate max-w-[14rem]" title={item.subject}>
                      {item.subject}
                    </td>
                    
                    {/* Snippet */}
                    <td className="p-3 text-gray-500 hidden md:table-cell truncate max-w-sm font-medium" title={item.body}>
                      {item.body}
                    </td>
                    
                    {/* label */}
                    <td className="p-3 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase inline-block ${
                        item.label === 'phishing'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}>
                        {item.label}
                      </span>
                    </td>
                    
                    {/* Actions */}
                    <td className="p-3 text-center">
                      <button
                        id={`delete-btn-${item.id}`}
                        type="button"
                        onClick={() => onDeleteEmail(item.id)}
                        className="text-gray-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-all cursor-pointer inline-flex"
                        title="Delete from training dataset"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
