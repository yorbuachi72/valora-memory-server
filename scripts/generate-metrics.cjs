#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function generateMetrics() {
  console.log('📊 Generating repository metrics...');

  const metricsDir = path.join(__dirname, '..', 'docs', 'metrics');
  if (!fs.existsSync(metricsDir)) {
    fs.mkdirSync(metricsDir, { recursive: true });
  }

  const metrics = {
    generatedAt: new Date().toISOString(),
    repository: {
      name: 'Valora',
      description: 'Enterprise-grade memory container with PostgreSQL backend',
      version: getPackageVersion(),
      lastCommit: getLastCommit(),
      contributors: getContributors(),
    },
    codebase: {
      totalFiles: countFiles(),
      linesOfCode: countLinesOfCode(),
      languages: getLanguageStats(),
    },
    dependencies: {
      total: getDependencyCount(),
      dev: getDevDependencyCount(),
      major: getMajorVersionDeps(),
    },
    coverage: getTestCoverage(),
  };

  // Generate metrics JSON
  fs.writeFileSync(
    path.join(metricsDir, 'metrics.json'),
    JSON.stringify(metrics, null, 2)
  );

  // Generate human-readable report
  const report = generateReport(metrics);
  fs.writeFileSync(
    path.join(metricsDir, 'report.md'),
    report
  );

  console.log('✅ Metrics generated successfully!');
  console.log(`📁 Metrics saved to: ${metricsDir}`);
}

function getPackageVersion() {
  try {
    const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
    return packageJson.version;
  } catch {
    return 'unknown';
  }
}

function getLastCommit() {
  try {
    return execSync('git log -1 --format="%H %s"').toString().trim();
  } catch {
    return 'unknown';
  }
}

function getContributors() {
  try {
    const output = execSync('git shortlog -sn --no-merges | wc -l').toString().trim();
    return parseInt(output) || 1;
  } catch {
    return 1;
  }
}

function countFiles() {
  try {
    const output = execSync('find src -type f -name "*.ts" -o -name "*.js" | wc -l').toString().trim();
    return parseInt(output) || 0;
  } catch {
    return 0;
  }
}

function countLinesOfCode() {
  try {
    const output = execSync('find src -name "*.ts" -exec wc -l {} + | tail -1 | awk \'{print $1}\'').toString().trim();
    return parseInt(output) || 0;
  } catch {
    return 0;
  }
}

function getLanguageStats() {
  const stats = {};

  try {
    // TypeScript files
    const tsFiles = execSync('find src -name "*.ts" | wc -l').toString().trim();
    stats.typescript = parseInt(tsFiles) || 0;

    // JavaScript files
    const jsFiles = execSync('find . -name "*.js" -not -path "./node_modules/*" | wc -l').toString().trim();
    stats.javascript = parseInt(jsFiles) || 0;

    // JSON files
    const jsonFiles = execSync('find . -name "*.json" -not -path "./node_modules/*" | wc -l').toString().trim();
    stats.json = parseInt(jsonFiles) || 0;

  } catch {
    // Fallback
    stats.unknown = 1;
  }

  return stats;
}

function getDependencyCount() {
  try {
    const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
    return Object.keys(packageJson.dependencies || {}).length;
  } catch {
    return 0;
  }
}

function getDevDependencyCount() {
  try {
    const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
    return Object.keys(packageJson.devDependencies || {}).length;
  } catch {
    return 0;
  }
}

function getMajorVersionDeps() {
  try {
    const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

    return Object.entries(deps).filter(([name, version]) => {
      // Check if version starts with major version patterns like ^1., ~2., 3.
      return /^[\^~]?(\d+)\./.test(version);
    }).length;
  } catch {
    return 0;
  }
}

function getTestCoverage() {
  try {
    // Try to read coverage from coverage directory
    const coveragePath = path.join(__dirname, '..', 'coverage', 'coverage-summary.json');
    if (fs.existsSync(coveragePath)) {
      const coverage = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
      return {
        lines: coverage.total.lines.pct,
        functions: coverage.total.functions.pct,
        branches: coverage.total.branches.pct,
        statements: coverage.total.statements.pct,
      };
    }
  } catch {
    // Coverage not available
  }

  return {
    lines: 0,
    functions: 0,
    branches: 0,
    statements: 0,
  };
}

function generateReport(metrics) {
  return `# 📊 Repository Metrics Report

Generated on: ${new Date(metrics.generatedAt).toLocaleString()}

## 📋 Repository Information
- **Name:** ${metrics.repository.name}
- **Description:** ${metrics.repository.description}
- **Version:** ${metrics.repository.version}
- **Contributors:** ${metrics.repository.contributors}
- **Last Commit:** ${metrics.repository.lastCommit.split(' ')[0]}

## 💻 Codebase Statistics
- **Total Source Files:** ${metrics.codebase.totalFiles}
- **Lines of Code:** ${metrics.codebase.linesOfCode}
- **Languages:**
${Object.entries(metrics.codebase.languages).map(([lang, count]) => `  - ${lang}: ${count} files`).join('\n')}

## 📦 Dependencies
- **Runtime Dependencies:** ${metrics.dependencies.total}
- **Development Dependencies:** ${metrics.dependencies.dev}
- **Major Version Dependencies:** ${metrics.dependencies.major}

## 🧪 Test Coverage
- **Lines:** ${metrics.coverage.lines}%
- **Functions:** ${metrics.coverage.functions}%
- **Branches:** ${metrics.coverage.branches}%
- **Statements:** ${metrics.coverage.statements}%

---
*This report is automatically generated. Last updated: ${new Date().toISOString()}*
`;
}

if (require.main === module) {
  generateMetrics();
}

module.exports = { generateMetrics };
