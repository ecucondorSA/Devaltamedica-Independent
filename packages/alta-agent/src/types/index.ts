/**
 * Types for PackageExpertAgent
 */

export interface PackageInfo {
  purpose: string;
  location: string;
  mainExports?: string[];
  dependencies?: string[];
  whenToUse?: string;
  keyFiles?: string[];
  commonIssues?: string[];
  bestPractices?: string[];
  storybook?: string;
  critical?: string[];
  utilities?: string[];
  features?: string[];
  usage?: string;
  patterns?: string[];
  subExports?: string[];
  queryProvider?: {
    import: string;
    configs: string[];
    utils: string;
  };
}

export interface PackageQuery {
  type: 'info' | 'usage' | 'troubleshoot' | 'recommend';
  query: string;
  context?: string;
}

export interface PackageRecommendation {
  package: string;
  reason: string;
  info: PackageInfo;
}

export interface DuplicationCheck {
  functionality: string;
  existingPackages: string[];
  isDuplicate: boolean;
  recommendation: string;
}

export interface TroubleshootResult {
  problem: string;
  solutions: string[];
  relatedPackages: string[];
}