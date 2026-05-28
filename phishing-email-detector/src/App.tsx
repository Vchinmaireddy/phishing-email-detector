/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Shield, Sparkles, LayoutDashboard, Sliders, Database, Cpu } from 'lucide-react';
import { DEFAULT_EMAIL_DATASET } from './lib/dataset';
import { EmailDatasetItem, ClassifierType, ModelMetrics, WordFeatureWeight } from './types';
import { trainModelPipeline, trainTestSplit, extractAllFeatures, TfidfVectorizer } from './lib/ml';
import TrainingDashboard from './components/TrainingDashboard';
import ModelEvaluation from './components/ModelEvaluation';
import EmailAnalyzer from './components/EmailAnalyzer';

export default function App() {
  // Labeled training corpus state
  const [corpus, setCorpus] = useState<EmailDatasetItem[]>(DEFAULT_EMAIL_DATASET);
  
  // Model hyperparameters
  const [activeClassifier, setActiveClassifier] = useState<ClassifierType>('naive_bayes');
  const [trainRatio, setTrainRatio] = useState<number>(0.8);
  const [epochs, setEpochs] = useState<number>(60);
  const [featuresCount, setFeaturesCount] = useState<number>(75);

  // Trained items state
  const [trainedModel, setTrainedModel] = useState<any>(null);
  const [vectorizer, setVectorizer] = useState<TfidfVectorizer>(new TfidfVectorizer());
  const [featureLabels, setFeatureLabels] = useState<string[]>([]);
  const [metrics, setMetrics] = useState<ModelMetrics | null>(null);
  const [weightsList, setWeightsList] = useState<WordFeatureWeight[]>([]);
  const [trainingLogs, setTrainingLogs] = useState<{ epoch: number; loss: number }[]>([]);
  const [trainCount, setTrainCount] = useState(0);
  const [testCount, setTestCount] = useState(0);

  // Active workspace tab
  const [activeTab, setActiveTab] = useState<'analyzer' | 'metrics' | 'training'>('analyzer');

  // Triggered during initial boot and whenever database or params alter
  const triggerModelRebuild = () => {
    try {
      const pipeline = trainModelPipeline(
        corpus,
        activeClassifier,
        trainRatio,
        epochs,
        featuresCount
      );

      // Extract model outputs
      setTrainedModel(pipeline.classifier);
      setVectorizer(pipeline.vectorizer);
      setFeatureLabels(pipeline.featureLabels);
      setMetrics(pipeline.metrics);
      setTrainingLogs(pipeline.trainingLog);
      setTrainCount(pipeline.trainCount);
      setTestCount(pipeline.testCount);

      // Map Word Weights for search lists
      const rawWeights = pipeline.classifier.getWeights(pipeline.featureLabels);
      setWeightsList(rawWeights);
    } catch (err) {
      console.error('Failed to train model pipeline:', err);
    }
  };

  useEffect(() => {
    triggerModelRebuild();
  }, [corpus, activeClassifier, trainRatio, epochs, featuresCount]);

  // Predict custom text callback for sandbox
  const handlePredictSandbox = (text: string) => {
    if (!trainedModel || !trainedModel.predict) {
      return { label: 'safe' as const, confidence: 1.0 };
    }
    const { vector } = extractAllFeatures(text, vectorizer);
    return trainedModel.predict(vector);
  };

  // Dataset manipulation handlers
  const handleAddEmailSample = (newEmail: EmailDatasetItem) => {
    setCorpus(prev => [newEmail, ...prev]);
  };

  const handleDeleteEmailSample = (id: string) => {
    setCorpus(prev => prev.filter(item => item.id !== id));
  };

  // Compile standard predictions map for the test set to power the interactive confusion matrix
  const getConfusionPredictionsMap = (): Record<string, { label: 'phishing' | 'safe'; confidence: number }> => {
    if (!trainedModel) return {};
    const testEmails = trainTestSplit(corpus, trainRatio).test;
    const records: Record<string, { label: 'phishing' | 'safe'; confidence: number }> = {};
    
    testEmails.forEach(item => {
      const text = `${item.subject} ${item.body}`;
      const { vector } = extractAllFeatures(text, vectorizer);
      records[item.id] = trainedModel.predict(vector);
    });
    return records;
  };

  // Convert weights list array to standard fast lookup object
  const getWeightsLookupMap = (): Record<string, number> => {
    const map: Record<string, number> = {};
    weightsList.forEach(w => {
      map[w.word] = w.weight;
    });
    return map;
  };

  const testSetOfSplit = trainTestSplit(corpus, trainRatio).test;

  return (
    <div id="phishing-application-root" className="min-h-screen bg-[#F8FAFC] text-slate-800 antialiased font-sans flex flex-col">
      
      {/* Header Bar */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-40 shadow-sm shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          
          <div className="flex items-center gap-2.5">
            <div className="bg-slate-900 border border-slate-850 p-2.5 rounded-xl text-white shadow-md flex items-center justify-center">
              <Shield className="text-rose-500 animate-pulse" size={20} />
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                Phishing Email Detection System
              </h1>
              <p className="text-gray-405 text-xs font-semibold flex items-center gap-1">
                <Cpu size={12} className="text-indigo-600" /> Interactive Machine Learning (Scikit-Learn Equivalent) Laboratory
              </p>
            </div>
          </div>

          {/* Tab Navigation Menu */}
          <nav className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-inner">
            <button
              id="tab-sandbox-btn"
              onClick={() => setActiveTab('analyzer')}
              className={`px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'analyzer'
                  ? 'bg-white text-slate-900 shadow-md border border-slate-200/50'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <LayoutDashboard size={14} /> Predictive Sandbox
            </button>
            <button
              id="tab-metrics-btn"
              onClick={() => setActiveTab('metrics')}
              className={`px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'metrics'
                  ? 'bg-white text-slate-900 shadow-md border border-slate-200/50'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Cpu size={14} /> Performance Evaluation
            </button>
            <button
              id="tab-training-btn"
              onClick={() => setActiveTab('training')}
              className={`px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'training'
                  ? 'bg-white text-slate-900 shadow-md border border-slate-200/50'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Database size={14} /> Labeled Corpus Editor
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content Workspace viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 h-full">
        {activeTab === 'analyzer' ? (
          /* PLAYGROUND PREDICTIVE SANDBOX VIEW */
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-slate-900 to-indigo-950 rounded-2xl p-6 text-white shadow-lg space-y-2">
              <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded text-[10px] font-bold tracking-widest uppercase">Live Sandbox Simulator</span>
              <h2 className="text-xl font-extrabold tracking-tight">Evaluate Threat Vectors & Hyperlinks</h2>
              <p className="text-slate-350 text-xs leading-relaxed max-w-2xl">
                Paste raw electronic mail wording inside the prediction matrix below. Our client-end Naive Bayes / SGD algorithms will run real-time term frequency mappings with instant visual highlights and explainable weight breakdowns.
              </p>
            </div>
            
            <EmailAnalyzer
              presets={corpus}
              vectorizer={vectorizer} // pass reference to pull vocab indices
              activeClassifierName={activeClassifier}
              modelWeights={getWeightsLookupMap()}
              onPredict={handlePredictSandbox}
            />
          </div>
        ) : activeTab === 'metrics' ? (
          /* CLASSIFIER EVALUATION VIEW */
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-lg space-y-2">
              <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded text-[10px] font-bold tracking-widest uppercase">Statistical Metrics Report</span>
              <h2 className="text-xl font-extrabold tracking-tight">Classifier Matrix & Model Coefficients</h2>
              <p className="text-indigo-200 text-xs leading-relaxed max-w-2xl">
                Inspect accuracy performance outputs tested against your configured {(100 - trainRatio * 100)}% valuation split. Drill down into quadrant samples or look up dominant keywords inside the features listing.
              </p>
            </div>

            {metrics ? (
              <ModelEvaluation
                metrics={metrics}
                weights={weightsList}
                activeClassifier={activeClassifier}
                testSet={testSetOfSplit}
                predictionsMap={getConfusionPredictionsMap()}
              />
            ) : (
              <div className="text-center py-20 bg-white border border-slate-200 rounded-2xl text-gray-400 text-xs">
                Generating model compilation metrics...
              </div>
            )}
          </div>
        ) : (
          /* TRAINING SCHEMA & HYPERPARAMETERS VIEW */
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-slate-900 to-emerald-950 rounded-2xl p-6 text-white shadow-lg space-y-2">
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded text-[10px] font-bold tracking-widest uppercase">Model Customization Console</span>
              <h2 className="text-xl font-extrabold tracking-tight">Expand Learning Capabilities</h2>
              <p className="text-slate-350 text-xs leading-relaxed max-w-2xl">
                Control classification mathematics directly. Modify training splits, epochs, and features thresholds. Insert real-life lures or remove safe receipts to observe the impact on precision margins.
              </p>
            </div>

            <TrainingDashboard
              dataset={corpus}
              activeClassifier={activeClassifier}
              trainRatio={trainRatio}
              epochs={epochs}
              featuresCount={featuresCount}
              onClassifierChange={setActiveClassifier}
              onTrainRatioChange={setTrainRatio}
              onEpochsChange={setEpochs}
              onFeaturesCountChange={setFeaturesCount}
              onAddEmail={handleAddEmailSample}
              onDeleteEmail={handleDeleteEmailSample}
              onTriggerRebuild={triggerModelRebuild}
              logs={trainingLogs}
              trainCount={trainCount}
              testCount={testCount}
            />
          </div>
        )}
      </main>

      {/* Footer information section */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-12 shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-semibold text-slate-400">
          <div className="flex items-center gap-1.5">
            <Shield size={12} className="text-indigo-500" />
            <span>Phishing Email Detection Model • Corporate Security MVP</span>
          </div>
          <div className="font-mono flex gap-4">
            <span>Classifiers: Multinomial Naive Bayes, SGD Logistic Regression, Decision Tree (ID3)</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
