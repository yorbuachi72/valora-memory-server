# 🔧 GitHub Actions Workflows

This directory contains all GitHub Actions workflows for the Valora Memory Container Protocol (MCP) Server project.

## 📋 Available Workflows

### 🔄 CI/CD Pipeline
- **[`ci.yml`](ci.yml)** - Continuous Integration
  - Runs on every push and pull request
  - Node.js testing, linting, and building
  - Cross-platform testing (Node.js 18.x, 20.x)

### 🧹 Code Quality & Security
- **[`code-quality.yml`](code-quality.yml)** - Comprehensive Quality Checks
  - ESLint, Prettier, TypeScript validation
  - Security scanning with Trivy and CodeQL
  - Performance monitoring with Lighthouse
  - Coverage reporting (optional: requires CODECOV_TOKEN)

### 🚀 Release Management
- **[`release.yml`](release.yml)** - Automated Release Pipeline
  - Semantic versioning with conventional commits
  - Automated changelog generation
  - Multi-platform publishing (optional secrets required):
    - **NPM_TOKEN**: For npm package publishing
    - **DOCKER_USERNAME/DOCKER_PASSWORD**: For Docker Hub publishing
    - **SLACK_WEBHOOK_URL**: For release notifications

### 📚 Documentation
- **[`docs-deploy.yml`](docs-deploy.yml)** - Documentation Deployment
  - Automated GitHub Pages deployment
  - API documentation generation
  - Documentation previews for pull requests

### 📊 Repository Analytics
- **[`repository-metrics.yml`](repository-metrics.yml)** - Repository Insights
  - Automated metrics generation
  - Community analytics and activity tracking
  - Optional integrations:
    - **PAGESPEED_TOKEN**: For performance monitoring
    - **WAKATIME_TOKEN**: For coding time analytics

### 📋 Issue & PR Management
- **[`issue-management.yml`](issue-management.yml)** - Automation Hub
  - Smart issue labeling and categorization
  - Automated reviewer assignment
  - Stale issue management
  - Weekly activity summaries

### 🏷️ Repository Management
- **[`label-sync.yml`](label-sync.yml)** - Label Management
  - Automated synchronization of repository labels
  - Configuration-driven label management

## 🔐 Required Secrets

Some workflows require optional secrets for full functionality:

### NPM Publishing
```bash
# Repository Settings → Secrets and variables → Actions
NPM_TOKEN=your_npm_token_here
```

### Docker Publishing
```bash
DOCKER_USERNAME=your_docker_username
DOCKER_PASSWORD=your_docker_password
```

### Code Coverage
```bash
CODECOV_TOKEN=your_codecov_token_here
```

### Performance Monitoring
```bash
PAGESPEED_TOKEN=your_pagespeed_token_here
WAKATIME_TOKEN=your_wakatime_token_here
```

### Release Notifications
```bash
SLACK_WEBHOOK_URL=your_slack_webhook_url
```

## 🚀 Usage

### Manual Workflow Triggers
Some workflows support manual execution:

1. **Release Management**: Go to Actions → Release Management → Run workflow
2. **Repository Metrics**: Go to Actions → Repository Metrics & Insights → Run workflow
3. **Code Quality**: Runs automatically on push/PR

### Workflow Status
Monitor workflow status in the Actions tab:
- ✅ **Green**: All checks passed
- ⚠️ **Yellow**: Warnings (non-blocking)
- ❌ **Red**: Failed checks (blocking)

## 🔧 Configuration

### Customizing Workflows
1. Edit workflow files in `.github/workflows/`
2. Update schedules, conditions, or steps as needed
3. Test changes with pull requests

### Adding New Secrets
1. Go to Repository Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Add secret name and value
4. Reference in workflows as `${{ secrets.SECRET_NAME }}`

## 📊 Monitoring & Debugging

### Workflow Logs
- View detailed logs in Actions tab
- Check step outputs and error messages
- Use debug logging for troubleshooting

### Common Issues
- **Missing Secrets**: Workflows skip optional steps gracefully
- **Dependency Issues**: Check Node.js version compatibility
- **Permission Errors**: Verify repository permissions

## 🎯 Best Practices

1. **Keep Secrets Optional**: Workflows should work without all secrets
2. **Use Descriptive Names**: Clear step names for easy debugging
3. **Handle Failures**: Use `continue-on-error` for non-critical steps
4. **Regular Updates**: Keep actions and dependencies updated
5. **Documentation**: Update this README when adding new workflows

## 📞 Support

For workflow issues:
1. Check workflow logs in Actions tab
2. Verify secret configuration
3. Review recent changes to workflow files
4. Create an issue with detailed error information

---

**Note**: Most workflow warnings are informational and don't prevent execution. Only severity 8 errors will block workflow runs.
