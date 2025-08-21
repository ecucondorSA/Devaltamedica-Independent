#!/usr/bin/env node

/**
 * Performance Analysis Script for AltaMedica Homepage
 * Analyzes page metrics, resources, and performance indicators
 */

const http = require('http');
const https = require('https');
const { URL } = require('url');
const { performance } = require('perf_hooks');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m',
};

class PerformanceAnalyzer {
  constructor(url = 'http://localhost:3000') {
    this.url = url;
    this.metrics = {
      responseTime: 0,
      headerSize: 0,
      bodySize: 0,
      resources: [],
      headers: {},
      statusCode: 0,
      contentType: '',
      encoding: '',
      cache: '',
      timing: {
        dns: 0,
        tcp: 0,
        ttfb: 0,
        download: 0,
        total: 0,
      }
    };
  }

  async analyze() {
    console.log(`\n${colors.cyan}${colors.bright}🔍 AltaMedica Homepage Performance Analysis${colors.reset}`);
    console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);
    console.log(`📍 Target URL: ${colors.blue}${this.url}${colors.reset}\n`);

    try {
      // Test main page
      await this.testMainPage();
      
      // Test critical resources
      await this.testCriticalResources();
      
      // Generate report
      this.generateReport();
      
    } catch (error) {
      console.error(`${colors.red}❌ Error during analysis:${colors.reset}`, error.message);
      process.exit(1);
    }
  }

  testMainPage() {
    return new Promise((resolve, reject) => {
      const startTime = performance.now();
      const parsedUrl = new URL(this.url);
      const client = parsedUrl.protocol === 'https:' ? https : http;

      const options = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
        path: parsedUrl.pathname,
        method: 'GET',
        headers: {
          'User-Agent': 'AltaMedica-Performance-Analyzer/1.0',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'es-AR,es;q=0.9,en;q=0.8',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
        }
      };

      const req = client.request(options, (res) => {
        let body = '';
        let bodySize = 0;

        // Calculate TTFB
        const ttfb = performance.now() - startTime;
        this.metrics.timing.ttfb = ttfb;

        res.on('data', (chunk) => {
          body += chunk;
          bodySize += chunk.length;
        });

        res.on('end', () => {
          const endTime = performance.now();
          const totalTime = endTime - startTime;

          this.metrics.responseTime = totalTime;
          this.metrics.timing.total = totalTime;
          this.metrics.timing.download = totalTime - ttfb;
          this.metrics.statusCode = res.statusCode;
          this.metrics.headers = res.headers;
          this.metrics.contentType = res.headers['content-type'] || '';
          this.metrics.encoding = res.headers['content-encoding'] || 'none';
          this.metrics.cache = res.headers['cache-control'] || 'none';
          this.metrics.bodySize = bodySize;
          this.metrics.headerSize = JSON.stringify(res.headers).length;

          // Parse HTML to find resources
          this.parseResources(body);

          resolve();
        });
      });

      req.on('error', reject);
      req.setTimeout(10000, () => {
        req.abort();
        reject(new Error('Request timeout'));
      });

      req.end();
    });
  }

  parseResources(html) {
    // Find critical resources in HTML
    const resources = [];

    // Find CSS files
    const cssPattern = /<link[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["']/gi;
    let match;
    while ((match = cssPattern.exec(html)) !== null) {
      resources.push({ type: 'css', url: match[1], critical: true });
    }

    // Find JS files
    const jsPattern = /<script[^>]*src=["']([^"']+)["']/gi;
    while ((match = jsPattern.exec(html)) !== null) {
      resources.push({ type: 'js', url: match[1], critical: false });
    }

    // Find preload/prefetch
    const preloadPattern = /<link[^>]*rel=["']preload["'][^>]*href=["']([^"']+)["']/gi;
    while ((match = preloadPattern.exec(html)) !== null) {
      resources.push({ type: 'preload', url: match[1], critical: true });
    }

    // Find images
    const imgPattern = /<img[^>]*src=["']([^"']+)["']/gi;
    while ((match = imgPattern.exec(html)) !== null) {
      resources.push({ type: 'image', url: match[1], critical: false });
    }

    // Find videos
    const videoPattern = /<video[^>]*src=["']([^"']+)["']|<source[^>]*src=["']([^"']+)["']/gi;
    while ((match = videoPattern.exec(html)) !== null) {
      const videoUrl = match[1] || match[2];
      if (videoUrl) {
        resources.push({ type: 'video', url: videoUrl, critical: false });
      }
    }

    this.metrics.resources = resources;
  }

  async testCriticalResources() {
    const criticalPaths = [
      '/api/font-css',
      '/manifest.json',
      '/api/health',
      '/_next/static/css/',
      '/_next/static/chunks/',
    ];

    console.log(`${colors.cyan}Testing critical resources...${colors.reset}\n`);

    for (const path of criticalPaths) {
      try {
        const testUrl = `${this.url}${path}`;
        const result = await this.testResource(testUrl);
        
        const emoji = result.success ? '✅' : '❌';
        const color = result.success ? colors.green : colors.red;
        
        console.log(`${emoji} ${path}: ${color}${result.status} - ${result.time.toFixed(2)}ms${colors.reset}`);
      } catch (error) {
        console.log(`❌ ${path}: ${colors.red}Failed${colors.reset}`);
      }
    }
    console.log();
  }

  testResource(url) {
    return new Promise((resolve) => {
      const startTime = performance.now();
      const parsedUrl = new URL(url);
      const client = parsedUrl.protocol === 'https:' ? https : http;

      const options = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
        path: parsedUrl.pathname,
        method: 'HEAD',
        timeout: 5000,
      };

      const req = client.request(options, (res) => {
        const endTime = performance.now();
        resolve({
          success: res.statusCode >= 200 && res.statusCode < 400,
          status: res.statusCode,
          time: endTime - startTime,
        });
      });

      req.on('error', () => {
        resolve({
          success: false,
          status: 0,
          time: 0,
        });
      });

      req.on('timeout', () => {
        req.abort();
        resolve({
          success: false,
          status: 0,
          time: 5000,
        });
      });

      req.end();
    });
  }

  generateReport() {
    console.log(`${colors.cyan}${colors.bright}📊 Performance Report${colors.reset}`);
    console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);

    // Response metrics
    console.log(`${colors.bright}Response Metrics:${colors.reset}`);
    console.log(`  Status Code: ${this.getStatusColor(this.metrics.statusCode)}${this.metrics.statusCode}${colors.reset}`);
    console.log(`  Content Type: ${this.metrics.contentType}`);
    console.log(`  Encoding: ${this.metrics.encoding}`);
    console.log(`  Cache Control: ${this.metrics.cache}`);
    console.log();

    // Timing metrics
    console.log(`${colors.bright}Timing Metrics:${colors.reset}`);
    console.log(`  TTFB: ${this.getTimeColor(this.metrics.timing.ttfb)}${this.metrics.timing.ttfb.toFixed(2)}ms${colors.reset}`);
    console.log(`  Download: ${this.metrics.timing.download.toFixed(2)}ms`);
    console.log(`  Total: ${this.getTimeColor(this.metrics.timing.total)}${this.metrics.timing.total.toFixed(2)}ms${colors.reset}`);
    console.log();

    // Size metrics
    console.log(`${colors.bright}Size Metrics:${colors.reset}`);
    console.log(`  HTML Size: ${this.formatBytes(this.metrics.bodySize)}`);
    console.log(`  Headers Size: ${this.formatBytes(this.metrics.headerSize)}`);
    console.log();

    // Resources
    console.log(`${colors.bright}Resources Found:${colors.reset}`);
    const resourceTypes = {};
    this.metrics.resources.forEach(r => {
      resourceTypes[r.type] = (resourceTypes[r.type] || 0) + 1;
    });
    
    Object.entries(resourceTypes).forEach(([type, count]) => {
      const icon = this.getResourceIcon(type);
      console.log(`  ${icon} ${type}: ${count}`);
    });
    console.log();

    // Performance rating
    this.generatePerformanceRating();
  }

  generatePerformanceRating() {
    console.log(`${colors.cyan}${colors.bright}🎯 Performance Rating${colors.reset}`);
    console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);

    const ratings = {
      'TTFB': this.rateTTFB(this.metrics.timing.ttfb),
      'Response Time': this.rateResponseTime(this.metrics.timing.total),
      'HTML Size': this.rateSize(this.metrics.bodySize),
      'Caching': this.rateCaching(this.metrics.cache),
      'Compression': this.rateCompression(this.metrics.encoding),
    };

    Object.entries(ratings).forEach(([metric, rating]) => {
      const emoji = this.getRatingEmoji(rating.score);
      const color = this.getRatingColor(rating.score);
      console.log(`  ${emoji} ${metric}: ${color}${rating.label}${colors.reset} ${rating.detail}`);
    });

    // Overall score
    const avgScore = Object.values(ratings).reduce((sum, r) => sum + r.score, 0) / Object.keys(ratings).length;
    const overallEmoji = this.getRatingEmoji(avgScore);
    const overallColor = this.getRatingColor(avgScore);
    
    console.log(`\n${colors.bright}Overall Score: ${overallEmoji} ${overallColor}${(avgScore * 100).toFixed(0)}/100${colors.reset}\n`);

    // Recommendations
    this.generateRecommendations(ratings);
  }

  generateRecommendations(ratings) {
    const recommendations = [];

    if (ratings['TTFB'].score < 0.8) {
      recommendations.push('⚡ Optimize server response time (consider caching, CDN, or server upgrade)');
    }
    if (ratings['HTML Size'].score < 0.8) {
      recommendations.push('📦 Reduce HTML size (minify, remove inline styles/scripts)');
    }
    if (ratings['Caching'].score < 0.8) {
      recommendations.push('💾 Implement proper cache headers for static assets');
    }
    if (ratings['Compression'].score < 0.8) {
      recommendations.push('🗜️ Enable gzip/brotli compression on server');
    }

    if (recommendations.length > 0) {
      console.log(`${colors.yellow}${colors.bright}💡 Recommendations:${colors.reset}`);
      recommendations.forEach(rec => console.log(`  ${rec}`));
      console.log();
    } else {
      console.log(`${colors.green}${colors.bright}✨ Excellent! No major issues detected.${colors.reset}\n`);
    }
  }

  // Rating functions
  rateTTFB(ttfb) {
    if (ttfb < 200) return { score: 1, label: 'Excellent', detail: `(${ttfb.toFixed(0)}ms < 200ms)` };
    if (ttfb < 500) return { score: 0.8, label: 'Good', detail: `(${ttfb.toFixed(0)}ms < 500ms)` };
    if (ttfb < 1000) return { score: 0.5, label: 'Needs Improvement', detail: `(${ttfb.toFixed(0)}ms < 1000ms)` };
    return { score: 0.2, label: 'Poor', detail: `(${ttfb.toFixed(0)}ms > 1000ms)` };
  }

  rateResponseTime(time) {
    if (time < 1000) return { score: 1, label: 'Excellent', detail: `(${time.toFixed(0)}ms < 1s)` };
    if (time < 3000) return { score: 0.8, label: 'Good', detail: `(${time.toFixed(0)}ms < 3s)` };
    if (time < 5000) return { score: 0.5, label: 'Needs Improvement', detail: `(${time.toFixed(0)}ms < 5s)` };
    return { score: 0.2, label: 'Poor', detail: `(${time.toFixed(0)}ms > 5s)` };
  }

  rateSize(size) {
    if (size < 50000) return { score: 1, label: 'Excellent', detail: `(${this.formatBytes(size)} < 50KB)` };
    if (size < 100000) return { score: 0.8, label: 'Good', detail: `(${this.formatBytes(size)} < 100KB)` };
    if (size < 200000) return { score: 0.5, label: 'Needs Improvement', detail: `(${this.formatBytes(size)} < 200KB)` };
    return { score: 0.2, label: 'Poor', detail: `(${this.formatBytes(size)} > 200KB)` };
  }

  rateCaching(cache) {
    if (cache.includes('max-age') || cache.includes('s-maxage')) {
      return { score: 1, label: 'Configured', detail: `(${cache})` };
    }
    return { score: 0.3, label: 'Not Configured', detail: '(no cache headers)' };
  }

  rateCompression(encoding) {
    if (encoding.includes('br')) return { score: 1, label: 'Brotli', detail: '(best compression)' };
    if (encoding.includes('gzip')) return { score: 0.9, label: 'Gzip', detail: '(good compression)' };
    if (encoding.includes('deflate')) return { score: 0.7, label: 'Deflate', detail: '(basic compression)' };
    return { score: 0.3, label: 'None', detail: '(no compression)' };
  }

  // Helper functions
  getStatusColor(status) {
    if (status >= 200 && status < 300) return colors.green;
    if (status >= 300 && status < 400) return colors.yellow;
    return colors.red;
  }

  getTimeColor(time) {
    if (time < 500) return colors.green;
    if (time < 1500) return colors.yellow;
    return colors.red;
  }

  getRatingEmoji(score) {
    if (score >= 0.9) return '🟢';
    if (score >= 0.7) return '🟡';
    if (score >= 0.5) return '🟠';
    return '🔴';
  }

  getRatingColor(score) {
    if (score >= 0.9) return colors.green;
    if (score >= 0.7) return colors.yellow;
    return colors.red;
  }

  getResourceIcon(type) {
    const icons = {
      css: '🎨',
      js: '📜',
      image: '🖼️',
      video: '🎬',
      preload: '⚡',
    };
    return icons[type] || '📄';
  }

  formatBytes(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const url = args[0] || 'http://localhost:3000';
  
  const analyzer = new PerformanceAnalyzer(url);
  await analyzer.analyze();
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = PerformanceAnalyzer;