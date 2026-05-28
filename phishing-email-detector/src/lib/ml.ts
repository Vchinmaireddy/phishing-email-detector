/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { EmailDatasetItem, ClassifierType, ModelMetrics, WordFeatureWeight, PredictionResult, LinkAnalysisResult } from '../types';

// Stopwords lists for general clean TF-IDF term mapping
export const STOPWORDS = new Set([
  'the', 'and', 'for', 'you', 'your', 'with', 'this', 'that', 'from', 'have', 'are', 
  'was', 'were', 'but', 'not', 'has', 'had', 'been', 'will', 'would', 'can', 'should', 
  'about', 'their', 'they', 'our', 'out', 'one', 'all', 'any', 'who', 'get', 'which', 
  'what', 'how', 'when', 'there', 'some', 'than', 'into', 'them', 'just', 'more', 'their',
  'him', 'her', 'its', 'them', 'she', 'his', 'they', 'our'
]);

// Phishing keywords list
export const PHISHING_KEYWORDS = [
  'verify', 'account', 'urgent', 'click here', 'free', 'password', 'security', 
  'update', 'login', 'suspended', 'unusual activity', 'action required', 'bank',
  'winner', 'gift card', 'immediate', 'restricted', 'expire', 'billing', 'verify account',
  'claim', 'behalf', 'credit card', 'refund', 'social security', 'inheritance'
];

/**
 * Clean text and extract lowercase alphanumeric word tokens
 */
export function tokenize(text: string): string[] {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !STOPWORDS.has(word));
}

/**
 * Analyze links embedded in modern text
 */
export function extractAndAnalyzeLinks(text: string): LinkAnalysisResult[] {
  if (!text) return [];
  const results: LinkAnalysisResult[] = [];
  
  // Regex to extract URLs (simple and robust)
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;
  const urls = text.match(urlRegex) || [];
  
  // Deduplicate URLs
  const uniqueUrls = Array.from(new Set(urls));
  
  for (const url of uniqueUrls) {
    const cleanUrl = url.toLowerCase();
    
    // Check for IP address in URL
    const hasIpAddress = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/.test(cleanUrl);
    
    // Check for suspicious subdomains or weird patterns
    const hasSuspiciousSubdomain = /paypal|netflix|amazon|google|apple|facebook|microsoft|wellsfargo|chase|bankofamerica/g.test(cleanUrl) && 
                                   !(cleanUrl.includes('paypal.com') || 
                                     cleanUrl.includes('netflix.com') || 
                                     cleanUrl.includes('amazon.com') || 
                                     cleanUrl.includes('google.com') || 
                                     cleanUrl.includes('apple.com') || 
                                     cleanUrl.includes('facebook.com') || 
                                     cleanUrl.includes('microsoft.com') || 
                                     cleanUrl.includes('wellsfargo.com') || 
                                     cleanUrl.includes('chase.com') || 
                                     cleanUrl.includes('bankofamerica.com'));
                                     
    // Check for deceptive wording like "login-update", "verify-account", "free-claim"
    const hasDeceptiveWording = /login|verify|account|update|secure|claim|gift|free-/.test(cleanUrl) && !cleanUrl.includes('https');
    
    const isSecure = cleanUrl.startsWith('https://');
    
    results.push({
      url,
      hasIpAddress,
      hasSuspiciousSubdomain,
      hasDeceptiveWording,
      isSecure,
    });
  }
  
  return results;
}

/**
 * Calculate special characters ratio
 */
export function getSpecialCharRatio(text: string): number {
  if (!text) return 0;
  const specialChars = text.replace(/[\w\s]/g, '');
  return parseFloat((specialChars.length / text.length).toFixed(4));
}

/**
 * TF-IDF Vectorizer
 */
export class TfidfVectorizer {
  public vocabulary: string[] = [];
  private idfMap: Map<string, number> = new Map();

  /**
   * Fit the vectorizer on a collection of documents to extract top terms and compile IDFs
   */
  public fit(documents: string[], maxFeatures: number = 80) {
    const termDocCounts: Map<string, number> = new Map();
    const documentTokens = documents.map(doc => {
      const tokens = tokenize(doc);
      // Unique tokens in this doc
      const uniqueTokens = Array.from(new Set(tokens));
      uniqueTokens.forEach(token => {
        termDocCounts.set(token, (termDocCounts.get(token) || 0) + 1);
      });
      return tokens;
    });

    const N = documents.length;
    if (N === 0) return;

    // Filter terms and get the most frequent terms across the corpus
    const termOverallCounts: Map<string, number> = new Map();
    documentTokens.forEach(tokens => {
      tokens.forEach(token => {
        termOverallCounts.set(token, (termOverallCounts.get(token) || 0) + 1);
      });
    });

    // Sort terms by raw frequency to make the vocabulary
    const sortedTerms = Array.from(termOverallCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(entry => entry[0])
      .slice(0, maxFeatures);

    this.vocabulary = sortedTerms;

    // Calculate IDF for vocabulary
    this.idfMap.clear();
    this.vocabulary.forEach(term => {
      const docCount = termDocCounts.get(term) || 0;
      // IDF calculation with smoothing (add 1 to prevent division by zero)
      const idf = Math.log((1 + N) / (1 + docCount)) + 1;
      this.idfMap.set(term, idf);
    });
  }

  /**
   * Transform a document into a TF-IDF vector
   */
  public transform(text: string): number[] {
    const tokens = tokenize(text);
    const termCounts: Map<string, number> = new Map();
    tokens.forEach(token => {
      termCounts.set(token, (termCounts.get(token) || 0) + 1);
    });

    const totalWords = tokens.length || 1;
    const vector = this.vocabulary.map(term => {
      const count = termCounts.get(term) || 0;
      const tf = count / totalWords;
      const idf = this.idfMap.get(term) || 0;
      return tf * idf;
    });

    return vector;
  }
}

/**
 * Helper to combine TF-IDF and structured heuristic features
 */
export function extractAllFeatures(text: string, vectorizer: TfidfVectorizer): { vector: number[]; labels: string[] } {
  const tfidfVec = vectorizer.transform(text);
  
  // Custom Heuristics
  const links = extractAndAnalyzeLinks(text);
  const suspiciousKeywordsList = PHISHING_KEYWORDS.filter(kw => text.toLowerCase().includes(kw));
  
  const linkCount = links.length;
  const suspiciousLinkCount = links.filter(l => l.hasIpAddress || l.hasSuspiciousSubdomain || l.hasDeceptiveWording || !l.isSecure).length;
  const specialCharRatio = getSpecialCharRatio(text);
  
  // Urgency indicator
  const lowUrgentWords = ['info', 'update', 'notice'];
  const highUrgentWords = ['immediate', 'urgent', 'action required', 'suspended', 'restrict', 'expire'];
  const lowercaseText = text.toLowerCase();
  let urgency = 0.0;
  if (highUrgentWords.some(w => lowercaseText.includes(w))) {
    urgency = 1.0; // High urgency
  } else if (lowUrgentWords.some(w => lowercaseText.includes(w))) {
    urgency = 0.5; // Medium urgency
  }

  // Suspicious keywords ratio
  const keywordRatio = Math.min(suspiciousKeywordsList.length / 5, 1.0);

  // Combine
  const combinedVector = [
    ...tfidfVec,
    keywordRatio,                    // Index: vocab.length
    Math.min(linkCount / 4, 1.0),    // Index: vocab.length + 1
    Math.min(suspiciousLinkCount / 3, 1.0), // Index: vocab.length + 2
    Math.min(specialCharRatio * 5, 1.0), // Index: vocab.length + 3
    urgency,                         // Index: vocab.length + 4
  ];

  // Feature labels for inspectability
  const labels = [
    ...vectorizer.vocabulary,
    'Phishing Keyword Matches',
    'Email Link Count',
    'Suspicious Link Flag',
    'Special Character %',
    'Urgency Signal'
  ];

  return { vector: combinedVector, labels };
}

/**
 * Base Abstract Classifier to standardize predictions
 */
export abstract class BaseClassifier {
  public abstract train(trainingData: { vector: number[]; label: 'phishing' | 'safe' }[]): void;
  public abstract predict(vector: number[]): { label: 'phishing' | 'safe'; confidence: number };
  public abstract getWeights(featureLabels: string[]): WordFeatureWeight[];
}

/**
 * 1. Naive Bayes Classifier (Multinomial with Laplace Smoothing)
 */
export class NaiveBayesClassifier extends BaseClassifier {
  private classPriors: Map<'phishing' | 'safe', number> = new Map();
  // Map of <featureIndex, prob> for each class
  private featureProbs: Map<'phishing' | 'safe', number[]> = new Map();

  public train(trainingData: { vector: number[]; label: 'phishing' | 'safe' }[]) {
    const phishingIdxs = trainingData.filter(d => d.label === 'phishing');
    const safeIdxs = trainingData.filter(d => d.label === 'safe');

    const totalDocs = trainingData.length || 1;
    
    // Class Priors
    this.classPriors.set('phishing', (phishingIdxs.length + 0.5) / (totalDocs + 1));
    this.classPriors.set('safe', (safeIdxs.length + 0.5) / (totalDocs + 1));

    const numFeatures = trainingData[0]?.vector.length || 0;
    
    // Initialize term sums
    const phishingFeatureSum = new Array(numFeatures).fill(0);
    const safeFeatureSum = new Array(numFeatures).fill(0);
    
    let totalPhishingWeightSum = 0;
    let totalSafeWeightSum = 0;

    phishingIdxs.forEach(d => {
      d.vector.forEach((val, i) => {
        phishingFeatureSum[i] += val;
        totalPhishingWeightSum += val;
      });
    });

    safeIdxs.forEach(d => {
      d.vector.forEach((val, i) => {
        safeFeatureSum[i] += val;
        totalSafeWeightSum += val;
      });
    });

    // Calculate conditional probabilities with Laplace smoothing
    const phishingProbs = phishingFeatureSum.map(sum => (sum + 1) / (totalPhishingWeightSum + numFeatures));
    const safeProbs = safeFeatureSum.map(sum => (sum + 1) / (totalSafeWeightSum + numFeatures));

    this.featureProbs.set('phishing', phishingProbs);
    this.featureProbs.set('safe', safeProbs);
  }

  public predict(vector: number[]): { label: 'phishing' | 'safe'; confidence: number } {
    const priorPhishing = this.classPriors.get('phishing') ?? 0.5;
    const priorSafe = this.classPriors.get('safe') ?? 0.5;

    const probsPhishing = this.featureProbs.get('phishing') ?? [];
    const probsSafe = this.featureProbs.get('safe') ?? [];

    let logPhishing = Math.log(priorPhishing);
    let logSafe = Math.log(priorSafe);

    vector.forEach((val, i) => {
      if (val > 0) {
        logPhishing += val * Math.log(probsPhishing[i] || 1e-10);
        logSafe += val * Math.log(probsSafe[i] || 1e-10);
      }
    });

    // Subtract max to avoid underflow
    const maxLog = Math.max(logPhishing, logSafe);
    const expPhish = Math.exp(logPhishing - maxLog);
    const expSafe = Math.exp(logSafe - maxLog);
    const totalExp = expPhish + expSafe;

    const confidencePhishing = expPhish / (totalExp || 1e-10);
    
    if (confidencePhishing >= 0.5) {
      return { label: 'phishing', confidence: confidencePhishing };
    } else {
      return { label: 'safe', confidence: 1 - confidencePhishing };
    }
  }

  public getWeights(featureLabels: string[]): WordFeatureWeight[] {
    const phishingProbs = this.featureProbs.get('phishing') ?? [];
    const safeProbs = this.featureProbs.get('safe') ?? [];

    return featureLabels.map((lbl, i) => {
      const pRatio = Math.log((phishingProbs[i] || 1e-10) / (safeProbs[i] || 1e-10));
      return {
        word: lbl,
        weight: pRatio, // Highly positive means Phishing; negative means Safe
      };
    });
  }
}

/**
 * 2. Logistic Regression Classifier (Stochastic Gradient Descent)
 */
export class LogisticRegressionClassifier extends BaseClassifier {
  private weights: number[] = [];
  private bias: number = 0;
  public trainingLog: { epoch: number; loss: number }[] = [];

  private sigmoid(z: number): number {
    return 1 / (1 + Math.exp(-Math.max(-20, Math.min(20, z))));
  }

  public train(
    trainingData: { vector: number[]; label: 'phishing' | 'safe' }[],
    epochs: number = 60,
    learningRate: number = 0.2
  ) {
    const numFeatures = trainingData[0]?.vector.length || 0;
    this.weights = new Array(numFeatures).fill(0).map(() => (Math.random() - 0.5) * 0.1);
    this.bias = 0.0;
    this.trainingLog = [];

    for (let epoch = 1; epoch <= epochs; epoch++) {
      let totalLoss = 0;
      
      trainingData.forEach(d => {
        const x = d.vector;
        const y = d.label === 'phishing' ? 1 : 0;

        // Compute prediction (forward pass)
        let z = this.bias;
        for (let i = 0; i < numFeatures; i++) {
          z += x[i] * this.weights[i];
        }
        const pred = this.sigmoid(z);

        // Loss (Binary Cross Entropy)
        const loss = -(y * Math.log(pred + 1e-15) + (1 - y) * Math.log(1 - pred + 1e-15));
        totalLoss += loss;

        // Compute derivation (backward pass)
        const diff = pred - y;

        // Gradient Descent Weight Updates
        for (let i = 0; i < numFeatures; i++) {
          this.weights[i] -= learningRate * diff * x[i];
        }
        this.bias -= learningRate * diff;
      });

      this.trainingLog.push({ epoch, loss: totalLoss / (trainingData.length || 1) });
    }
  }

  public predict(vector: number[]): { label: 'phishing' | 'safe'; confidence: number } {
    let z = this.bias;
    vector.forEach((val, i) => {
      z += val * (this.weights[i] || 0);
    });
    
    const confidence = this.sigmoid(z);
    if (confidence >= 0.5) {
      return { label: 'phishing', confidence: confidence };
    } else {
      return { label: 'safe', confidence: 1 - confidence };
    }
  }

  public getWeights(featureLabels: string[]): WordFeatureWeight[] {
    return featureLabels.map((lbl, i) => ({
      word: lbl,
      weight: this.weights[i] || 0, // Weights directly denote class affinity (positive phish, negative safe)
    }));
  }
}

/**
 * 3. Decision Tree Classifier (ID3-like Simple Classifier for Visual Splitting Explanations)
 */
interface DecisionTreeNode {
  featureIdx?: number;
  splitValue?: number;
  label?: 'phishing' | 'safe';
  left?: DecisionTreeNode;
  right?: DecisionTreeNode;
  impurity?: number;
  totalSamples?: number;
  featureLabel?: string;
}

export class DecisionTreeClassifier extends BaseClassifier {
  private root: DecisionTreeNode | null = null;
  private featureWeightsMap: Map<string, number> = new Map();

  private entropy(samples: { vector: number[]; label: 'phishing' | 'safe' }[]): number {
    const len = samples.length;
    if (len === 0) return 0;
    const phishCount = samples.filter(s => s.label === 'phishing').length;
    const p1 = phishCount / len;
    const p0 = 1 - p1;
    let h = 0;
    if (p1 > 0) h -= p1 * Math.log2(p1);
    if (p0 > 0) h -= p0 * Math.log2(p0);
    return h;
  }

  private buildTree(
    samples: { vector: number[]; label: 'phishing' | 'safe' }[],
    featureLabels: string[],
    currentDepth: number,
    maxDepth: number = 4
  ): DecisionTreeNode {
    const node: DecisionTreeNode = { 
      totalSamples: samples.length,
      impurity: this.entropy(samples) 
    };

    if (samples.length === 0) {
      node.label = 'safe';
      return node;
    }

    const phishCount = samples.filter(s => s.label === 'phishing').length;
    const allPhishing = phishCount === samples.length;
    const allSafe = phishCount === 0;

    // Base cases
    if (allPhishing) {
      node.label = 'phishing';
      return node;
    }
    if (allSafe) {
      node.label = 'safe';
      return node;
    }
    if (currentDepth >= maxDepth) {
      node.label = phishCount >= samples.length / 2 ? 'phishing' : 'safe';
      return node;
    }

    // Find the best split
    const numFeatures = samples[0]?.vector.length || 0;
    let bestGain = -1;
    let bestFeatureIdx = -1;
    let bestSplitVal = 0.0;
    let bestLeft: typeof samples = [];
    let bestRight: typeof samples = [];

    const parentEntropy = this.entropy(samples);

    for (let f = 0; f < numFeatures; f++) {
      // Find candidate split values from actual data
      const values = Array.from(new Set(samples.map(s => s.vector[f])));
      // Sort and map split thresholds midpoint-style
      const candidates = values.length <= 1 ? values : values.sort((a,b) => a-b).slice(0, -1).map((val, idx) => (val + values[idx+1])/2);

      candidates.forEach(threshold => {
        const left = samples.filter(s => s.vector[f] <= threshold);
        const right = samples.filter(s => s.vector[f] > threshold);

        if (left.length === 0 || right.length === 0) return;

        const leftWeight = left.length / samples.length;
        const rightWeight = right.length / samples.length;
        const gain = parentEntropy - (leftWeight * this.entropy(left) + rightWeight * this.entropy(right));

        if (gain > bestGain) {
          bestGain = gain;
          bestFeatureIdx = f;
          bestSplitVal = threshold;
          bestLeft = left;
          bestRight = right;
        }
      });
    }

    // If no meaningful gain, assign majority label
    if (bestGain <= 0.0001 || bestFeatureIdx === -1) {
      node.label = phishCount >= samples.length / 2 ? 'phishing' : 'safe';
      return node;
    }

    // Update node with splits
    node.featureIdx = bestFeatureIdx;
    node.featureLabel = featureLabels[bestFeatureIdx] || `Feature_#${bestFeatureIdx}`;
    node.splitValue = bestSplitVal;

    // Track feature importance for weighting panels
    this.featureWeightsMap.set(
      node.featureLabel, 
      (this.featureWeightsMap.get(node.featureLabel) || 0) + bestGain
    );

    node.left = this.buildTree(bestLeft, featureLabels, currentDepth + 1, maxDepth);
    node.right = this.buildTree(bestRight, featureLabels, currentDepth + 1, maxDepth);

    return node;
  }

  public train(trainingData: { vector: number[]; label: 'phishing' | 'safe' }[]) {
    // We will extract feature labels during compilation
    this.featureWeightsMap.clear();
    const dummyLabels = new Array(trainingData[0]?.vector.length || 0).fill('').map((_, i) => `Feature_#${i}`);
    this.root = this.buildTree(trainingData, dummyLabels, 0, 4);
  }

  // Visual custom train that binds feature names
  public trainWithLabels(trainingData: { vector: number[]; label: 'phishing' | 'safe' }[], labels: string[]) {
    this.featureWeightsMap.clear();
    this.root = this.buildTree(trainingData, labels, 0, 4);
  }

  private predictNode(node: DecisionTreeNode, vector: number[]): { label: 'phishing' | 'safe'; confidence: number } {
    if (node.label) {
      return { label: node.label, confidence: 0.90 }; // High model leaf confidence
    }

    if (node.featureIdx !== undefined && node.splitValue !== undefined) {
      const featVal = vector[node.featureIdx] || 0.0;
      if (featVal <= node.splitValue) {
        return node.left ? this.predictNode(node.left, vector) : { label: 'safe', confidence: 0.5 };
      } else {
        return node.right ? this.predictNode(node.right, vector) : { label: 'phishing', confidence: 0.5 };
      }
    }

    return { label: 'safe', confidence: 0.5 };
  }

  public predict(vector: number[]): { label: 'phishing' | 'safe'; confidence: number } {
    if (!this.root) return { label: 'safe', confidence: 0.5 };
    return this.predictNode(this.root, vector);
  }

  public getWeights(featureLabels: string[]): WordFeatureWeight[] {
    // Generate feature weights by returning entropy gains or class splits
    return featureLabels.map(lbl => {
      const gain = this.featureWeightsMap.get(lbl) || 0;
      // Synthesize phishing correlation from training label heuristic maps
      // If keyword/character splits are high, mark positively as phishing indicators, else low
      const isUrgentProne = /Phishing|Link|Urgency|Suspicious|verify|login|urgent/i.test(lbl);
      return {
        word: lbl,
        weight: gain * (isUrgentProne ? 4.5 : -1.5),
      };
    });
  }

  public getTreeRepresentation(): DecisionTreeNode | null {
    return this.root;
  }
}

/**
 * Split dataset into training and testing
 */
export function trainTestSplit(
  data: EmailDatasetItem[],
  trainRatio: number = 0.8
): { train: EmailDatasetItem[]; test: EmailDatasetItem[] } {
  // Simple deterministic split to prevent fluctuating stats during small visual updates,
  // but respects ratio perfectly.
  const shuffled = [...data];
  // Sort deterministic-shuffled style by ID lengths, character hashes
  shuffled.sort((a,b) => {
    const hashA = a.body.charCodeAt(0) + a.subject.charCodeAt(a.subject.length - 1 || 0);
    const hashB = b.body.charCodeAt(0) + b.subject.charCodeAt(b.subject.length - 1 || 0);
    return hashA - hashB;
  });

  const splitIdx = Math.floor(shuffled.length * trainRatio);
  return {
    train: shuffled.slice(0, splitIdx),
    test: shuffled.slice(splitIdx),
  };
}

/**
 * Train whole pipeline and return trained model + evaluation metrics!
 */
export function trainModelPipeline(
  dataset: EmailDatasetItem[],
  classifierType: ClassifierType,
  trainRatio: number = 0.8,
  epochs: number = 60,
  featuresCount: number = 80
): {
  classifier: BaseClassifier;
  vectorizer: TfidfVectorizer;
  featureLabels: string[];
  metrics: ModelMetrics;
  trainingLog: { epoch: number; loss: number }[];
  trainCount: number;
  testCount: number;
} {
  const { train, test } = trainTestSplit(dataset, trainRatio);

  // 1. Fit Vectorizer on Training
  const vectorizer = new TfidfVectorizer();
  const trainBodies = train.map(item => `${item.subject} ${item.body}`);
  vectorizer.fit(trainBodies, featuresCount);

  // 2. Extract Features for Training Data
  const trainFeatures = train.map(item => {
    const textContent = `${item.subject} ${item.body}`;
    const { vector } = extractAllFeatures(textContent, vectorizer);
    return { vector, label: item.label };
  });

  // Dummy extract to get labels
  const firstText = trainBodies[0] || '';
  const { labels: featureLabels } = extractAllFeatures(firstText, vectorizer);

  // 3. Initialize & Train Classifier
  let classifier: BaseClassifier;
  let log: { epoch: number; loss: number }[] = [];

  if (classifierType === 'naive_bayes') {
    classifier = new NaiveBayesClassifier();
    classifier.train(trainFeatures);
  } else if (classifierType === 'logistic_regression') {
    const lr = new LogisticRegressionClassifier();
    lr.train(trainFeatures, epochs, 0.25);
    classifier = lr;
    log = lr.trainingLog;
  } else {
    const dt = new DecisionTreeClassifier();
    dt.trainWithLabels(trainFeatures, featureLabels);
    classifier = dt;
  }

  // 4. Evaluate Test Dataset
  let tp = 0; // Phishing as Phishing
  let tn = 0; // Safe as Safe
  let fp = 0; // Safe as Phishing
  let fn = 0; // Phishing as Safe

  test.forEach(item => {
    const textContent = `${item.subject} ${item.body}`;
    const { vector } = extractAllFeatures(textContent, vectorizer);
    const predResult = classifier.predict(vector);
    
    if (item.label === 'phishing') {
      if (predResult.label === 'phishing') {
        tp++;
      } else {
        fn++;
      }
    } else {
      if (predResult.label === 'phishing') {
        fp++;
      } else {
        tn++;
      }
    }
  });

  // Calculate scores
  const totalTest = test.length || 1;
  const accuracy = (tp + tn) / totalTest;
  
  const precision = (tp + fp) > 0 ? tp / (tp + fp) : 0;
  const recall = (tp + fn) > 0 ? tp / (tp + fn) : 0;
  const f1 = (precision + recall) > 0 ? (2 * precision * recall) / (precision + recall) : 0;

  const metrics: ModelMetrics = {
    accuracy,
    precision,
    recall,
    f1,
    confusionMatrix: { tp, tn, fp, fn }
  };

  return {
    classifier,
    vectorizer,
    featureLabels,
    metrics,
    trainingLog: log,
    trainCount: train.length,
    testCount: test.length
  };
}
