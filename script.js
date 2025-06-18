class AccessibilityAnalyzer {
    constructor() {
        this.issues = [];
        this.setupEventListeners();
        this.initializeRules();
    }

    setupEventListeners() {
        document.getElementById('analyzeBtn').addEventListener('click', () => {
            this.analyzeCode();
        });

        // Auto-analyze on language change
        document.getElementById('languageSelect').addEventListener('change', () => {
            const code = document.getElementById('codeInput').value.trim();
            if (code) {
                setTimeout(() => this.analyzeCode(), 100);
            }
        });
    }

    initializeRules() {
        this.rules = {
            missingAltText: {
                patterns: [
                    /<img(?![^>]*alt\s*=)[^>]*>/gi,
                    /<Image(?![^>]*alt\s*=)[^>]*\/?>|<Image[^>]*>(?![^<]*alt)/gi,
                    /\.jpg|\.jpeg|\.png|\.gif|\.svg|\.webp/gi
                ],
                severity: 'error',
                category: 'Images',
                title: 'Missing Alt Text',
                description: 'Images should have descriptive alt text for screen readers.'
            },

            
            unlabeledInputs: {
                patterns: [
                    /<input(?![^>]*aria-label)(?![^>]*aria-labelledby)(?!.*<label[^>]*for\s*=\s*["\'][^"\']*["\'][^>]*>)/gi,
                    /<Input(?![^>]*aria-label)(?![^>]*label)/gi
                ],
                severity: 'error',
                category: 'Forms',
                title: 'Unlabeled Form Inputs',
                description: 'Form inputs should have associated labels or aria-label attributes.'
            },

            
            emptyButtons: {
                patterns: [
                    /<button[^>]*>\s*<\/button>/gi,
                    /<button[^>]*\/>/gi,
                    /onClick|click.*function.*\(\)\s*{\s*}/gi
                ],
                severity: 'warning',
                category: 'Interactive Elements',
                title: 'Empty or Unlabeled Buttons',
                description: 'Buttons should have descriptive text or aria-label attributes.'
            },

          
            vagueLinks: {
                patterns: [
                    /<a[^>]*>\s*(click here|read more|more|here|link)\s*<\/a>/gi,
                    /href\s*=\s*["\']#["\'](?![^>]*aria-label)/gi
                ],
                severity: 'warning',
                category: 'Navigation',
                title: 'Vague Link Text',
                description: 'Links should have descriptive text that explains their purpose.'
            },

            
            divButtons: {
                patterns: [
                    /<div[^>]*onclick/gi,
                    /<div[^>]*cursor:\s*pointer/gi,
                    /className.*button.*onClick/gi
                ],
                severity: 'warning',
                category: 'Semantic HTML',
                title: 'Non-semantic Interactive Elements',
                description: 'Use proper button elements instead of divs for interactive content.'
            },

           
            skippedHeadings: {
                patterns: [
                    /<h[1-6]/gi
                ],
                severity: 'info',
                category: 'Document Structure',
                title: 'Heading Structure',
                description: 'Check that headings follow proper hierarchical order (h1, h2, h3, etc.).',
                customCheck: true
            },

            
            colorOnlyInfo: {
                patterns: [
                    /color:\s*red|background.*red/gi,
                    /required.*color|error.*color/gi,
                    /style.*color.*red/gi
                ],
                severity: 'warning',
                category: 'Visual Design',
                title: 'Color-Only Information',
                description: 'Don\'t rely solely on color to convey important information.'
            },

            
            redundantAria: {
                patterns: [
                    /<button[^>]*role\s*=\s*["\']button["\']|<a[^>]*role\s*=\s*["\']link["\']/gi,
                    /<input[^>]*role\s*=\s*["\']textbox["\']|<textarea[^>]*role\s*=\s*["\']textbox["\']/gi
                ],
                severity: 'info',
                category: 'ARIA',
                title: 'Redundant ARIA Roles',
                description: 'Remove redundant ARIA roles on semantic HTML elements.'
            },

          
            noFocusStyles: {
                patterns: [
                    /outline:\s*none|outline:\s*0/gi,
                    /:focus\s*{\s*outline:\s*none/gi
                ],
                severity: 'error',
                category: 'Keyboard Navigation',
                title: 'Missing Focus Styles',
                description: 'Provide visible focus indicators for keyboard navigation.'
            },

          
            autoplayMedia: {
                patterns: [
                    /<video[^>]*autoplay|<audio[^>]*autoplay/gi,
                    /autoplay.*true|autoPlay.*true/gi
                ],
                severity: 'warning',
                category: 'Media',
                title: 'Auto-playing Media',
                description: 'Avoid auto-playing media as it can be disorienting and problematic.'
            },

         
            missingLang: {
                patterns: [
                    /<html(?![^>]*lang\s*=)/gi,
                    /<Html(?![^>]*lang)/gi
                ],
                severity: 'warning',
                category: 'Document Structure',
                title: 'Missing Language Declaration',
                description: 'HTML documents should declare their primary language.'
            }
        };
    }

    analyzeCode() {
        const code = document.getElementById('codeInput').value.trim();
        const language = document.getElementById('languageSelect').value;

        if (!code) {
            this.showEmptyState();
            return;
        }

        this.showLoading();
        this.issues = [];

        
        setTimeout(() => {
            this.performAnalysis(code, language);
            this.displayResults();
        }, 800);
    }

    performAnalysis(code, language) {
        
        const processedCode = this.preprocessCode(code, language);

        Object.keys(this.rules).forEach(ruleKey => {
            const rule = this.rules[ruleKey];

            if (rule.customCheck) {
                this.performCustomCheck(ruleKey, processedCode, rule);
            } else {
                rule.patterns.forEach(pattern => {
                    const matches = processedCode.match(pattern) || [];
                    matches.forEach(match => {
                        this.addIssue(rule, match, this.getLineNumber(code, match));
                    });
                });
            }
        });

        
        this.performLanguageSpecificChecks(code, language);
    }

    preprocessCode(code, language) {
        
        let processed = code;

        switch (language) {
            case 'react':
                processed = processed.replace(/className/g, 'class');
                processed = processed.replace(/onClick/g, 'onclick');
                processed = processed.replace(/htmlFor/g, 'for');
                break;
            case 'vue':
                processed = processed.replace(/@click/g, 'onclick');
                processed = processed.replace(/v-bind:/g, '');
                break;
            case 'angular':
                processed = processed.replace(/\(click\)/g, 'onclick');
                processed = processed.replace(/\[attr\./g, '');
                break;
        }

        return processed;
    }

    performCustomCheck(ruleKey, code, rule) {
        if (ruleKey === 'skippedHeadings') {
            const headings = code.match(/<h([1-6])/gi) || [];
            const levels = headings.map(h => parseInt(h.match(/\d/)[0]));

            for (let i = 1; i < levels.length; i++) {
                if (levels[i] - levels[i - 1] > 1) {
                    this.addIssue(rule, `h${levels[i - 1]} to h${levels[i]}`, i + 1);
                }
            }
        }
    }

    performLanguageSpecificChecks(code, language) {
        
        switch (language) {
            case 'react':
                this.checkReactSpecific(code);
                break;
            case 'vue':
                this.checkVueSpecific(code);
                break;
            case 'angular':
                this.checkAngularSpecific(code);
                break;
        }
    }

    checkReactSpecific(code) {
        
        if (code.includes('.map(') && !code.includes('key=')) {
            this.addIssue({
                severity: 'warning',
                category: 'React',
                title: 'Missing Key Props',
                description: 'List items should have unique key props for proper rendering.'
            }, '.map() without key', 0);
        }

        if (code.includes('document.getElementById') || code.includes('querySelector')) {
            this.addIssue({
                severity: 'info',
                category: 'React',
                title: 'Direct DOM Manipulation',
                description: 'Use React refs instead of direct DOM manipulation for better accessibility.'
            }, 'Direct DOM access', 0);
        }
    }

    checkVueSpecific(code) {
       
        if (code.includes('v-model') && !code.includes('aria-')) {
            this.addIssue({
                severity: 'info',
                category: 'Vue.js',
                title: 'Custom Input Components',
                description: 'Custom input components with v-model should include proper ARIA attributes.'
            }, 'v-model usage', 0);
        }
    }

    checkAngularSpecific(code) {
       
        if (code.includes('formControl') && !code.includes('aria-describedby')) {
            this.addIssue({
                severity: 'warning',
                category: 'Angular',
                title: 'Form Validation Accessibility',
                description: 'Form controls should use aria-describedby to reference error messages.'
            }, 'FormControl without aria-describedby', 0);
        }
    }

    addIssue(rule, match, lineNumber) {
        this.issues.push({
            ...rule,
            match,
            line: lineNumber
        });
    }

    getLineNumber(code, match) {
        const index = code.indexOf(match);
        if (index === -1) return 1;
        return code.substring(0, index).split('\n').length;
    }

    showLoading() {
        document.getElementById('resultsPanel').innerHTML = `
                    <div class="loading">
                        <div class="loading-spinner"></div>
                        <h3>Analyzing your code...</h3>
                        <p>Checking for accessibility issues across all patterns and frameworks.</p>
                    </div>
                `;
    }

    showEmptyState() {
        document.getElementById('resultsPanel').innerHTML = `
                    <div class="empty-state">
                        <svg viewBox="0 0 20 20" fill="currentColor">
                            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                        <h3>Ready to analyze your code!</h3>
                        <p>Paste your code above and click the analyze button to get started.</p>
                    </div>
                `;
    }

    displayResults() {
        const resultsPanel = document.getElementById('resultsPanel');
        const totalIssues = this.issues.length;
        const errors = this.issues.filter(i => i.severity === 'error').length;
        const warnings = this.issues.filter(i => i.severity === 'warning').length;
        const infos = this.issues.filter(i => i.severity === 'info').length;

        
        const score = Math.max(0, 100 - (errors * 15) - (warnings * 8) - (infos * 3));
        const scoreClass = score >= 80 ? 'score-excellent' : score >= 60 ? 'score-good' : 'score-poor';
        const scoreLabel = score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : 'Needs Work';

        
        const categories = {};
        this.issues.forEach(issue => {
            if (!categories[issue.category]) {
                categories[issue.category] = [];
            }
            categories[issue.category].push(issue);
        });

        let html = `
                    <div class="results-header">
                        <h2>
                            <svg class="icon" viewBox="0 0 20 20">
                                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                            </svg>
                            Analysis Results
                        </h2>
                        <div class="score-display">
                            <div class="score-circle ${scoreClass}">
                                ${score}
                            </div>
                            <div>
                                <div style="font-weight: 600; color: #374151;">${scoreLabel}</div>
                                <div style="font-size: 0.875rem; color: #6b7280;">Accessibility Score</div>
                            </div>
                        </div>
                    </div>

                    <div class="stats-bar">
                        <div class="stat-item">
                            <div class="stat-number">${totalIssues}</div>
                            <div class="stat-label">Total Issues</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-number" style="color: #ef4444;">${errors}</div>
                            <div class="stat-label">Errors</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-number" style="color: #f59e0b;">${warnings}</div>
                            <div class="stat-label">Warnings</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-number" style="color: #3b82f6;">${infos}</div>
                            <div class="stat-label">Info</div>
                        </div>
                    </div>
                `;

        if (totalIssues === 0) {
            html += `
                        <div style="text-align: center; padding: 40px; color: #10b981;">
                            <svg style="width: 60px; height: 60px; margin-bottom: 20px;" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"/>
                            </svg>
                            <h3>🎉 Great job!</h3>
                            <p>No accessibility issues found in your code. Your implementation follows accessibility best practices!</p>
                        </div>
                    `;
        } else {
            html += '<div class="issue-categories">';

            Object.keys(categories).forEach(categoryName => {
                const categoryIssues = categories[categoryName];
                html += `
                            <div class="category" onclick="this.classList.toggle('expanded')">
                                <div class="category-header">
                                    <span class="category-title">${categoryName}</span>
                                    <span class="issue-count">${categoryIssues.length}</span>
                                </div>
                                <div class="category-content">
                        `;

                categoryIssues.forEach(issue => {
                    const severityClass = issue.severity === 'error' ? '' : issue.severity;
                    html += `
                                <div class="issue-item ${severityClass}">
                                    <div class="issue-title">${issue.title}</div>
                                    <div class="issue-description">${issue.description}</div>
                                    <div class="issue-location">Line ${issue.line}: ${this.escapeHtml(issue.match.substring(0, 80))}${issue.match.length > 80 ? '...' : ''}</div>
                                </div>
                            `;
                });

                html += `
                                </div>
                            </div>
                        `;
            });

            html += '</div>';
        }

        resultsPanel.innerHTML = html;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}


document.addEventListener('DOMContentLoaded', () => {
    new AccessibilityAnalyzer();
});


const sampleCodes = {
    html: `<div class="card">
  <img src="product.jpg">
  <h3>Product Name</h3>
  <p>Product description here</p>
  <button onclick="addToCart()">Add to Cart</button>
</div>

<form>
  <input type="text" placeholder="Enter your name">
  <input type="email" placeholder="Enter your email">
  <button type="submit">Submit</button>
</form>`,

    react: `function ProductCard({ product }) {
  return (
    <div className="card">
      <img src={product.image} />
      <h3>{product.name}</h3>
      <p>{product.description}</p>
      <button onClick={() => addToCart(product.id)}>
        Add to Cart
      </button>
    </div>
  );
}

function ContactForm() {
  return (
    <form>
      <input type="text" placeholder="Name" />
      <input type="email" placeholder="Email" />
      <button type="submit">Submit</button>
    </form>
  );
}`,

    vue: `<template>
  <div class="card">
    <img :src="product.image" />
    <h3>{{ product.name }}</h3>
    <p>{{ product.description }}</p>
    <button @click="addToCart(product.id)">
      Add to Cart
    </button>
  </div>
  
  <form @submit="handleSubmit">
    <input v-model="name" placeholder="Name" />
    <input v-model="email" placeholder="Email" />
    <button type="submit">Submit</button>
  </form>
</template>`,

    angular: `<div class="card">
  <img [src]="product.image">
  <h3>{{ product.name }}</h3>
  <p>{{ product.description }}</p>
  <button (click)="addToCart(product.id)">
    Add to Cart
  </button>
</div>

<form [formGroup]="contactForm" (ngSubmit)="onSubmit()">
  <input formControlName="name" placeholder="Name">
  <input formControlName="email" placeholder="Email">
  <button type="submit">Submit</button>
</form>`
};


document.getElementById('languageSelect').addEventListener('change', function () {
    const selectedLanguage = this.value;
    const codeInput = document.getElementById('codeInput');

    if (codeInput.value.trim() === '' && sampleCodes[selectedLanguage]) {
        codeInput.value = sampleCodes[selectedLanguage];
        codeInput.placeholder = `Sample ${selectedLanguage.toUpperCase()} code loaded. Modify or replace with your own code.`;
    }
});


document.addEventListener('keydown', function (e) {
    if (e.ctrlKey && e.key === 'Enter') {
        document.getElementById('analyzeBtn').click();
    }
});

const codeInput = document.getElementById('codeInput');
codeInput.addEventListener('input', function () {
    this.style.height = 'auto';
    this.style.height = Math.max(400, this.scrollHeight) + 'px';
});


const tooltips = {
    'error': 'Critical accessibility issues that must be fixed',
    'warning': 'Important accessibility concerns that should be addressed',
    'info': 'Accessibility improvements and best practices'
};


let analysisTimeout;
function debounceAnalysis() {
    clearTimeout(analysisTimeout);
    analysisTimeout = setTimeout(() => {
        if (document.getElementById('codeInput').value.trim()) {
            document.querySelector('.accessibility-analyzer')?.analyzeCode();
        }
    }, 1000);
}


document.getElementById('codeInput').addEventListener('input', debounceAnalysis);