/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface EmailDatasetItem {
  id: string;
  sender: string;
  subject: string;
  body: string;
  label: 'phishing' | 'safe';
  isCustom?: boolean;
}

export type ClassifierType = 'naive_bayes' | 'logistic_regression' | 'decision_tree';

export interface ModelMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
  confusionMatrix: {
    tp: number; // True Positive (Actual Phishing, predicted Phishing)
    tn: number; // True Negative (Actual Safe, predicted Safe)
    fp: number; // False Positive (Actual Safe, predicted Phishing)
    fn: number; // False Negative (Actual Phishing, predicted Safe)
  };
}

export interface TrainingProgress {
  epoch: number;
  loss: number;
}

export interface WordFeatureWeight {
  word: string;
  weight: number; // positive for phishing, negative for safe, or relative conditional probability ratio
}

export interface LinkAnalysisResult {
  url: string;
  hasIpAddress: boolean;
  hasSuspiciousSubdomain: boolean;
  hasDeceptiveWording: boolean;
  isSecure: boolean;
}

export interface PredictionResult {
  label: 'phishing' | 'safe';
  confidence: number;
  extractedFeatures: {
    suspiciousKeywordCount: number;
    detectedKeywords: string[];
    linkCount: number;
    suspiciousLinkCount: number;
    specialCharRatio: number;
    urgencyLevel: 'high' | 'medium' | 'low';
    topTfidfWords: { word: string; value: number }[];
  };
  linkAnalyses: LinkAnalysisResult[];
  explanation: string;
}
