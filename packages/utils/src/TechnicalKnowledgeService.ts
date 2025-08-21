import fetch from 'node-fetch';

// Simple logger implementation to avoid circular dependencies
const logger = {
  info: (message: string, data?: any) => {
    if (typeof console !== 'undefined' && process.env.NODE_ENV !== 'production') {
      console.log(message, data);
    }
  },
  error: (message: string, data?: any) => {
    if (typeof console !== 'undefined') {
      console.error(message, data);
    }
  }
};
export interface TechnicalSolution {
  title: string;
  excerpt: string;
  url: string;
  score: number;
  tags: string[];
  isAccepted: boolean;
}

export interface CodeExample {
  name: string;
  description: string;
  url: string;
  stars: number;
  language: string;
  lastUpdate: string;
}

export interface PackageAnalysis {
  name: string;
  version: string;
  description: string;
  dependencies: Record<string, string>;
  vulnerabilities: VulnerabilityInfo[];
  metrics: {
    downloads: number;
    stars: number;
    issues: number;
    maintainability: string;
  };
}

export interface VulnerabilityInfo {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  fixedIn?: string;
}

export class TechnicalKnowledgeService {
  private readonly apis = {
    stackoverflow: 'https://api.stackexchange.com/2.3',
    github: 'https://api.github.com',
    mdn: 'https://developer.mozilla.org/en-US/search.json',
    npm: 'https://registry.npmjs.org',
    snyk: 'https://api.snyk.io/v1',
    bundlephobia: 'https://bundlephobia.com/api'
  };

  private readonly headers: Record<string, Record<string, string>> = {
    github: {
      'Authorization': `token ${process.env.GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json'
    },
    snyk: {
      'Authorization': `token ${process.env.SNYK_API_KEY}`,
      'Content-Type': 'application/json'
    }
  };

  /**
   * Buscar soluciones técnicas en Stack Overflow
   */
  async searchTechnicalSolution(
    query: string, 
    tags: string[] = [],
    maxResults: number = 10
  ): Promise<TechnicalSolution[]> {
    try {
      const tagFilter = tags.length > 0 ? `&tagged=${tags.join(';')}` : '';
      const url = `${this.apis.stackoverflow}/search/advanced?order=desc&sort=votes&q=${encodeURIComponent(query)}${tagFilter}&site=stackoverflow&pagesize=${maxResults}`;
      
      const response = await fetch(url);
      const data = await response.json() as any;
      
      return (data.items || []).map((item: any) => ({
        title: item.title,
        excerpt: item.excerpt || '',
        url: item.link,
        score: item.score,
        tags: item.tags || [],
        isAccepted: item.is_answered && item.accepted_answer_id > 0
      }));
    } catch (error) {
      logger.error('Error buscando solución técnica:', error);
      return [];
    }
  }

  /**
   * Obtener ejemplos de código de GitHub
   */
  async getCodeExamples(
    language: string, 
    topic: string,
    maxResults: number = 10
  ): Promise<CodeExample[]> {
    try {
      const query = `${topic} language:${language}`;
      const url = `${this.apis.github}/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=${maxResults}`;
      
      const response = await fetch(url, { headers: this.headers.github });
      const data = await response.json() as any;
      
      return (data.items || []).map((item: any) => ({
        name: item.name,
        description: item.description || '',
        url: item.html_url,
        stars: item.stargazers_count,
        language: item.language,
        lastUpdate: item.updated_at
      }));
    } catch (error) {
      logger.error('Error obteniendo ejemplos de código:', error);
      return [];
    }
  }

  /**
   * Analizar un paquete npm
   */
  async analyzePackage(packageName: string): Promise<PackageAnalysis | null> {
    try {
      // Obtener información del paquete
      const npmResponse = await fetch(`${this.apis.npm}/${packageName}`);
      const npmData = await npmResponse.json() as any;

      // Obtener métricas de descarga
      const downloadsResponse = await fetch(`https://api.npmjs.org/downloads/point/last-month/${packageName}`);
      const downloadsData = await downloadsResponse.json() as any;

      // Obtener información de GitHub si existe
      let githubMetrics = { stars: 0, issues: 0 };
      if (npmData.repository?.url) {
        const repoUrl = npmData.repository.url.replace(/^git\+/, '').replace(/\.git$/, '');
        const repoMatch = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
        if (repoMatch) {
          const [, owner, repo] = repoMatch;
          try {
            const githubResponse = await fetch(`${this.apis.github}/repos/${owner}/${repo}`, { headers: this.headers.github });
            const githubData = await githubResponse.json() as any;
            githubMetrics.stars = githubData.stargazers_count || 0;
            githubMetrics.issues = githubData.open_issues_count || 0;
          } catch (err) {
            logger.warn(`No se pudo obtener métricas de GitHub para ${packageName}`);
          }
        }
      }

      // Verificar vulnerabilidades
      const vulnerabilities = await this.checkVulnerabilities(packageName);

      return {
        name: npmData.name,
        version: npmData['dist-tags']?.latest || '',
        description: npmData.description || '',
        dependencies: npmData.dependencies || {},
        vulnerabilities,
        metrics: {
          downloads: downloadsData.downloads || 0,
          stars: githubMetrics.stars,
          issues: githubMetrics.issues,
          maintainability: this.calculateMaintainability(npmData, githubMetrics)
        }
      };
    } catch (error) {
      logger.error('Error analizando paquete:', error);
      return null;
    }
  }

  /**
   * Verificar vulnerabilidades con Snyk
   */
  async checkVulnerabilities(packageName: string): Promise<VulnerabilityInfo[]> {
    try {
      if (!process.env.SNYK_API_KEY) {
        logger.warn('SNYK_API_KEY no configurado, saltando verificación de vulnerabilidades');
        return [];
      }

      const response = await fetch(`${this.apis.snyk}/test/npm/${packageName}`, {
        headers: this.headers.snyk
      });

      if (!response.ok) {
        return [];
      }

      const data = await response.json() as any;
      
      return (data.issues?.vulnerabilities || []).map((vuln: any) => ({
        id: vuln.id,
        severity: vuln.severity,
        title: vuln.title,
        description: vuln.description,
        fixedIn: vuln.fixedIn?.[0]
      }));
    } catch (error) {
      logger.error('Error verificando vulnerabilidades:', error);
      return [];
    }
  }

  /**
   * Buscar documentación en MDN
   */
  async searchMDNDocumentation(query: string): Promise<any[]> {
    try {
      const response = await fetch(`${this.apis.mdn}?q=${encodeURIComponent(query)}`);
      const data = await response.json() as any;
      
      return data.documents || [];
    } catch (error) {
      logger.error('Error buscando documentación MDN:', error);
      return [];
    }
  }

  /**
   * Obtener tamaño del bundle de un paquete
   */
  async getBundleSize(packageName: string): Promise<any> {
    try {
      const response = await fetch(`${this.apis.bundlephobia}/size?package=${packageName}`);
      return await response.json();
    } catch (error) {
      logger.error('Error obteniendo tamaño del bundle:', error);
      return null;
    }
  }

  /**
   * Calcular score de mantenibilidad
   */
  private calculateMaintainability(npmData: any, githubMetrics: any): string {
    let score = 0;
    
    // Factores positivos
    if (npmData.maintainers?.length > 0) score += 20;
    if (npmData.license) score += 10;
    if (npmData.homepage) score += 10;
    if (npmData.repository) score += 15;
    if (githubMetrics.stars > 100) score += 20;
    if (githubMetrics.issues < 10) score += 15;
    if (npmData.keywords?.length > 0) score += 10;

    // Factores negativos
    const lastPublish = new Date(npmData.time?.modified || 0);
    const monthsOld = (Date.now() - lastPublish.getTime()) / (1000 * 60 * 60 * 24 * 30);
    if (monthsOld > 12) score -= 20;
    if (monthsOld > 24) score -= 30;

    if (score >= 80) return 'excellent';
    if (score >= 60) return 'good';
    if (score >= 40) return 'fair';
    return 'poor';
  }

  /**
   * Obtener recomendaciones basadas en contexto
   */
  async getContextualRecommendations(context: {
    problem: string;
    language: string;
    framework?: string;
    tags: string[];
  }): Promise<{
    solutions: TechnicalSolution[];
    examples: CodeExample[];
    documentation: any[];
  }> {
    const [solutions, examples, documentation] = await Promise.all([
      this.searchTechnicalSolution(context.problem, context.tags, 5),
      this.getCodeExamples(context.language, context.problem, 3),
      this.searchMDNDocumentation(context.problem)
    ]);

    return {
      solutions,
      examples,
      documentation
    };
  }
}
