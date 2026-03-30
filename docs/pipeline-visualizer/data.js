// Pipeline Visualizer Data — Nexa Agentic Engineering Methodology
// This file contains all diagram definitions and structural data

const PHASES = {
  inception: { name: 'Inception', color: '#6366f1', icon: '&#9670;' },
  elaboration: { name: 'Elaboration', color: '#8b5cf6', icon: '&#9674;' },
  construction: { name: 'Construction', color: '#3b82f6', icon: '&#9632;' },
  verification: { name: 'Verification', color: '#10b981', icon: '&#9654;' },
  transition: { name: 'Transition', color: '#f59e0b', icon: '&#9650;' },
};

const PLUGINS = {
  core: { name: 'nexa-claude-core', label: 'Core (Stack-Agnostic)', color: '#6366f1' },
  nextjs: { name: 'nexa-claude-nextjs', label: 'Next.js (Stack-Specific)', color: '#0ea5e9' },
};

// All skills with metadata
const SKILLS = [
  // Core — Inception
  { id: 'requirements', cmd: '/requirements', plugin: 'core', phase: 'inception',
    label: 'Requirements', desc: 'Gather & document requirements from vision',
    input: 'docs/vision.md', output: 'docs/requirements.md',
    deps: [], artifacts: ['Functional Reqs', 'Non-Functional Reqs', 'Constraints'] },

  // Core — Elaboration
  { id: 'entity-model', cmd: '/entity-model', plugin: 'core', phase: 'elaboration',
    label: 'Entity Model', desc: 'Create ER diagrams & attribute tables',
    input: 'docs/requirements.md', output: 'docs/entity_model.md',
    deps: ['requirements'], artifacts: ['Mermaid ER Diagram', 'Attribute Tables'] },

  { id: 'use-case-diagram', cmd: '/use-case-diagram', plugin: 'core', phase: 'elaboration',
    label: 'Use Case Diagram', desc: 'Map actors to use cases in PlantUML',
    input: 'docs/requirements.md', output: 'docs/use_cases.puml',
    deps: ['requirements'], artifacts: ['PlantUML Diagram', 'Actor-UC Mapping'] },

  // Core — Construction (Design)
  { id: 'use-case-spec', cmd: '/use-case-spec', plugin: 'core', phase: 'construction',
    label: 'Use Case Spec', desc: 'Detailed scenario specifications per UC',
    input: 'docs/use_cases.puml', output: 'docs/use_cases/UC-XXX.md',
    deps: ['entity-model', 'use-case-diagram'], artifacts: ['Scenarios', 'Business Rules', 'Postconditions'] },

  { id: 'technical-task', cmd: '/technical-task', plugin: 'core', phase: 'construction',
    label: 'Technical Task', desc: 'Non-UI engineering task specifications',
    input: 'User request', output: 'docs/technical_tasks/TT-XXX.md',
    deps: [], artifacts: ['Acceptance Criteria', 'Affected Areas'] },

  { id: 'prioritize', cmd: '/prioritize', plugin: 'core', phase: 'construction',
    label: 'Prioritize', desc: 'Recommend implementation order',
    input: 'All specs & tasks', output: 'docs/priority.md',
    deps: ['use-case-spec', 'technical-task'], artifacts: ['Priority Table', 'Dependency Graph'] },

  { id: 'frontend-design', cmd: '/frontend-design', plugin: 'core', phase: 'construction',
    label: 'Frontend Design', desc: 'HTML screen designs from wireframes',
    input: 'UC spec + wireframe', output: 'docs/designs/UC-XXX-design.html',
    deps: ['use-case-spec', 'entity-model'], artifacts: ['Screen Layouts', 'State Variants', 'Data Mappings'] },

  { id: 'refine-use-cases', cmd: '/refine-use-cases', plugin: 'core', phase: 'elaboration',
    label: 'Refine Use Cases', desc: 'Auto-generate specs/designs + GAP analysis',
    input: 'Requirements + Entity Model + Diagram', output: 'docs/gap_analysis_*.md',
    deps: ['requirements', 'entity-model', 'use-case-diagram'], artifacts: ['Missing Specs', 'Missing Designs', 'Gap Report'] },

  // Core — Verification
  { id: 'code-review', cmd: '/code-review', plugin: 'core', phase: 'verification',
    label: 'Code Review', desc: 'Independent code quality review',
    input: 'UC/TT implementation', output: 'Review Report',
    deps: ['implement'], artifacts: ['Findings', 'Security Check', 'Performance Check'], isolated: true },

  { id: 'evaluate', cmd: '/evaluate', plugin: 'core', phase: 'verification',
    label: 'Evaluate', desc: 'Validate implementation vs spec & design',
    input: 'Spec + Design + Implementation', output: 'Evaluation Report',
    deps: ['implement'], artifacts: ['Conformance Tables', 'Verdict', 'Recommendations'], isolated: true },

  { id: 'report-bug', cmd: '/report-bug', plugin: 'core', phase: 'verification',
    label: 'Report Bug', desc: 'Structured bug report documents',
    input: 'Bug description', output: 'docs/bugs/BUG-XXX.md',
    deps: [], artifacts: ['Repro Steps', 'Severity', 'Environment'] },

  // Next.js — Setup
  { id: 'setup-env-profiles', cmd: '/setup-env-profiles', plugin: 'nextjs', phase: 'inception',
    label: 'Env Profiles', desc: 'Set up local/dev/prod/test environments',
    input: 'User prompts', output: '.env.* files',
    deps: [], artifacts: ['.env.local', '.env.dev', '.env.prod', '.env.test'], interactive: true },

  // Next.js — Construction (Infrastructure)
  { id: 'prisma-migration', cmd: '/prisma-migration', plugin: 'nextjs', phase: 'elaboration',
    label: 'Prisma Migration', desc: 'Schema models & DB migrations',
    input: 'docs/entity_model.md', output: 'prisma/schema.prisma + migrations/',
    deps: ['entity-model', 'setup-env-profiles'], artifacts: ['Prisma Models', 'SQL Migrations'] },

  { id: 'build-web-middleware', cmd: '/build-web-middleware', plugin: 'nextjs', phase: 'construction',
    label: 'Web Middleware', desc: 'Auth, RBAC, security headers middleware',
    input: 'Requirements + Entity Model + Prisma', output: 'middleware.ts + lib/auth/*',
    deps: ['prisma-migration'], artifacts: ['Auth Middleware', 'Route Guards', 'Security Headers'] },

  // Next.js — Construction (Implementation)
  { id: 'implement', cmd: '/implement', plugin: 'nextjs', phase: 'construction',
    label: 'Implement', desc: 'Build pages, APIs, components, unit tests',
    input: 'UC/TT/BUG spec + design', output: 'app/ + components/ + tests',
    deps: ['build-web-middleware', 'use-case-spec', 'frontend-design'], artifacts: ['Pages', 'API Routes', 'Server Actions', 'Unit Tests'] },

  { id: 'vitest-test', cmd: '/vitest-test', plugin: 'nextjs', phase: 'construction',
    label: 'Vitest Tests', desc: 'Integration tests with Testcontainers',
    input: 'UC/TT implementation', output: 'src/test/*.test.ts',
    deps: ['implement'], artifacts: ['Integration Tests', 'DB Setup', 'Test Prisma'] },

  { id: 'playwright-test', cmd: '/playwright-test', plugin: 'nextjs', phase: 'construction',
    label: 'Playwright Tests', desc: 'E2E browser tests for user journeys',
    input: 'UC spec + design', output: 'e2e/UC-XXX.spec.ts',
    deps: ['implement', 'frontend-design'], artifacts: ['E2E Specs', 'Test Users', 'Global Setup'] },

  { id: 'code-quality', cmd: '/code-quality', plugin: 'nextjs', phase: 'verification',
    label: 'Code Quality', desc: 'ESLint + Prettier checks & fixes',
    input: 'Source files', output: 'Fixed & formatted code',
    deps: ['implement'], artifacts: ['Lint Fixes', 'Formatting'] },

  // Next.js — Delivery (Orchestrator)
  { id: 'deliver-use-case', cmd: '/deliver-use-case', plugin: 'nextjs', phase: 'construction',
    label: 'Deliver Use Case', desc: 'Full pipeline orchestrator per UC',
    input: 'UC-XXX', output: 'Complete tested implementation',
    deps: ['requirements', 'entity-model'], artifacts: ['Spec', 'Design', 'Implementation', 'Tests', 'Evaluation'],
    orchestrator: true },

  // Next.js — Transition
  { id: 'aws-dockerize', cmd: '/aws-dockerize', plugin: 'nextjs', phase: 'transition',
    label: 'Dockerize', desc: 'Production-ready Dockerfile',
    input: 'Next.js project', output: 'Dockerfile + .dockerignore',
    deps: ['implement'], artifacts: ['Multi-stage Dockerfile', '.dockerignore'] },

  { id: 'aws-setup-apprunner', cmd: '/aws-setup-apprunner', plugin: 'nextjs', phase: 'transition',
    label: 'AWS App Runner', desc: 'Deploy script + GitHub Actions CI/CD',
    input: 'Dockerfile + .env.local', output: 'infra/ + .github/workflows/',
    deps: ['aws-dockerize'], artifacts: ['Deploy Script', 'CI/CD Workflow', 'IAM Roles'], interactive: true },
];

// Dependency edges for the pipeline flow
const EDGES = SKILLS.flatMap(skill =>
  skill.deps.map(dep => ({ from: dep, to: skill.id }))
);

// Deliver Use Case sub-pipeline
const DELIVER_PIPELINE = [
  { step: 1, skill: 'use-case-spec', label: 'Spec', optional: true, note: 'Skip if exists' },
  { step: 2, skill: 'frontend-design', label: 'Design', optional: true, note: 'Skip if exists' },
  { step: 3, skill: null, label: 'Entity Gate', gate: true, note: 'HARD STOP if entities missing' },
  { step: 4, skill: 'implement', label: 'Implement', verify: ['next build', 'vitest run'] },
  { step: 5, skill: 'playwright-test', label: 'E2E Tests', loop: true, maxIter: 3, note: 'Fix loop' },
  { step: 6, skill: null, label: 'E2E Evaluation', loop: true, maxIter: 3, note: 'QA gap analysis loop' },
];

// Repository tree structure
const REPO_TREE = {
  name: 'nexa-claude-skills-marketplace',
  type: 'root',
  children: [
    { name: '.claude-plugin/', type: 'config', children: [
      { name: 'marketplace.json', type: 'config', tag: 'Marketplace Registry' }
    ]},
    { name: 'nexa-claude-core/', type: 'plugin', tag: 'Stack-Agnostic Core', children: [
      { name: '.claude-plugin/', type: 'config', children: [
        { name: 'plugin.json', type: 'config', tag: 'Plugin Metadata' }
      ]},
      { name: '.mcp.json', type: 'config', tag: 'MCP: context7' },
      { name: 'shared/', type: 'folder', children: [
        { name: 'mocking/', type: 'folder', tag: 'Mock Strategies' },
        { name: 'readiness/', type: 'folder', tag: 'DoR/DoD Checklists', children: [
          { name: 'DEFINITION_OF_READY.md', type: 'doc' },
          { name: 'DEFINITION_OF_READY_TT.md', type: 'doc' },
          { name: 'DEFINITION_OF_READY_BUG.md', type: 'doc' },
          { name: 'DEFINITION_OF_DONE.md', type: 'doc' },
          { name: 'DEFINITION_OF_DONE_TT.md', type: 'doc' },
          { name: 'DEFINITION_OF_DONE_BUG.md', type: 'doc' },
        ]},
        { name: 'tracking/', type: 'folder', tag: 'GitHub Issue Tracking' },
      ]},
      { name: 'skills/', type: 'skills', children: [
        { name: 'requirements/', type: 'skill', phase: 'inception', tag: '/requirements' },
        { name: 'entity-model/', type: 'skill', phase: 'elaboration', tag: '/entity-model' },
        { name: 'use-case-diagram/', type: 'skill', phase: 'elaboration', tag: '/use-case-diagram' },
        { name: 'use-case-spec/', type: 'skill', phase: 'construction', tag: '/use-case-spec', children: [
          { name: 'templates/', type: 'template', children: [
            { name: 'use-case.md', type: 'template', tag: 'UC Template' }
          ]}
        ]},
        { name: 'technical-task/', type: 'skill', phase: 'construction', tag: '/technical-task', children: [
          { name: 'templates/', type: 'template', children: [
            { name: 'technical-task.md', type: 'template', tag: 'TT Template' }
          ]}
        ]},
        { name: 'prioritize/', type: 'skill', phase: 'construction', tag: '/prioritize' },
        { name: 'frontend-design/', type: 'skill', phase: 'construction', tag: '/frontend-design' },
        { name: 'refine-use-cases/', type: 'skill', phase: 'elaboration', tag: '/refine-use-cases' },
        { name: 'code-review/', type: 'skill', phase: 'verification', tag: '/code-review' },
        { name: 'evaluate/', type: 'skill', phase: 'verification', tag: '/evaluate' },
        { name: 'report-bug/', type: 'skill', phase: 'verification', tag: '/report-bug', children: [
          { name: 'templates/', type: 'template', children: [
            { name: 'bug-report.md', type: 'template', tag: 'Bug Template' }
          ]}
        ]},
      ]},
    ]},
    { name: 'nexa-claude-nextjs/', type: 'plugin', tag: 'Next.js Stack Plugin', children: [
      { name: '.claude-plugin/', type: 'config', children: [
        { name: 'plugin.json', type: 'config', tag: 'Plugin Metadata' }
      ]},
      { name: '.mcp.json', type: 'config', tag: 'MCP: Playwright' },
      { name: 'skills/', type: 'skills', children: [
        { name: 'setup-env-profiles/', type: 'skill', phase: 'inception', tag: '/setup-env-profiles' },
        { name: 'prisma-migration/', type: 'skill', phase: 'elaboration', tag: '/prisma-migration' },
        { name: 'build-web-middleware/', type: 'skill', phase: 'construction', tag: '/build-web-middleware' },
        { name: 'implement/', type: 'skill', phase: 'construction', tag: '/implement' },
        { name: 'vitest-test/', type: 'skill', phase: 'construction', tag: '/vitest-test', children: [
          { name: 'templates/', type: 'template', children: [
            { name: 'global-setup.ts', type: 'template' },
            { name: 'test-prisma.ts', type: 'template' },
            { name: 'example.test.ts', type: 'template' },
          ]}
        ]},
        { name: 'playwright-test/', type: 'skill', phase: 'construction', tag: '/playwright-test', children: [
          { name: 'templates/', type: 'template', children: [
            { name: 'global-setup.ts', type: 'template' },
            { name: 'global-teardown.ts', type: 'template' },
            { name: 'test-user.ts', type: 'template' },
            { name: 'e2e-users-api.ts', type: 'template' },
            { name: 'example.spec.ts', type: 'template' },
          ]}
        ]},
        { name: 'code-quality/', type: 'skill', phase: 'verification', tag: '/code-quality' },
        { name: 'deliver-use-case/', type: 'skill', phase: 'construction', tag: '/deliver-use-case' },
        { name: 'aws-dockerize/', type: 'skill', phase: 'transition', tag: '/aws-dockerize', children: [
          { name: 'templates/', type: 'template', children: [
            { name: 'Dockerfile.nextjs', type: 'template' },
            { name: 'dockerignore', type: 'template' },
          ]}
        ]},
        { name: 'aws-setup-apprunner/', type: 'skill', phase: 'transition', tag: '/aws-setup-apprunner', children: [
          { name: 'templates/', type: 'template', children: [
            { name: 'deploy-apprunner.sh', type: 'template' },
            { name: 'github-actions/', type: 'folder', children: [
              { name: 'deploy-ecr-apprunner.yml', type: 'template' },
            ]}
          ]}
        ]},
      ]},
    ]},
    { name: 'docs/', type: 'folder', tag: 'Documentation & Analysis', children: [
      { name: 'pipeline-visualizer/', type: 'folder', tag: 'This Visualizer' },
    ]},
    { name: 'CLAUDE.md', type: 'doc', tag: 'Claude Code Instructions' },
    { name: 'README.md', type: 'doc', tag: 'Repository README' },
  ]
};

// Sequence diagram data for deliver-use-case flow
const SEQUENCE_ACTORS = [
  { id: 'user', label: 'User' },
  { id: 'orchestrator', label: '/deliver-use-case' },
  { id: 'spec', label: 'Spec Agent' },
  { id: 'design', label: 'Design Agent' },
  { id: 'impl', label: 'Impl Agent' },
  { id: 'test', label: 'Test Agent' },
  { id: 'qa', label: 'QA Agent' },
  { id: 'github', label: 'GitHub' },
];

const SEQUENCE_MESSAGES = [
  { from: 'user', to: 'orchestrator', label: 'deliver UC-XXX', type: 'request' },
  { from: 'orchestrator', to: 'orchestrator', label: 'Check prerequisites', type: 'self' },
  { from: 'orchestrator', to: 'spec', label: '/use-case-spec UC-XXX', type: 'request', optional: true },
  { from: 'spec', to: 'orchestrator', label: 'UC-XXX.md', type: 'response', optional: true },
  { from: 'orchestrator', to: 'design', label: '/frontend-design UC-XXX', type: 'request', optional: true },
  { from: 'design', to: 'orchestrator', label: 'UC-XXX-design.html', type: 'response', optional: true },
  { from: 'orchestrator', to: 'orchestrator', label: 'Entity Gate Check', type: 'gate' },
  { from: 'orchestrator', to: 'impl', label: '/implement UC-XXX', type: 'request' },
  { from: 'impl', to: 'impl', label: 'Build pages, APIs, tests', type: 'self' },
  { from: 'impl', to: 'impl', label: 'next build + vitest run', type: 'verify' },
  { from: 'impl', to: 'orchestrator', label: 'Implementation complete', type: 'response' },
  { from: 'orchestrator', to: 'test', label: '/playwright-test UC-XXX', type: 'request', isolated: true },
  { from: 'test', to: 'orchestrator', label: 'E2E test specs', type: 'response' },
  { from: 'orchestrator', to: 'orchestrator', label: 'npx playwright test', type: 'verify' },
  { from: 'orchestrator', to: 'github', label: 'Post test results', type: 'request' },
  { from: 'orchestrator', to: 'qa', label: 'Evaluate tests vs spec', type: 'request', isolated: true, loop: true },
  { from: 'qa', to: 'orchestrator', label: 'Gap analysis', type: 'response', loop: true },
  { from: 'orchestrator', to: 'github', label: 'Post gap analysis', type: 'request', loop: true },
  { from: 'orchestrator', to: 'test', label: 'Fix tests from gaps', type: 'request', loop: true },
  { from: 'test', to: 'orchestrator', label: 'Updated tests', type: 'response', loop: true },
  { from: 'orchestrator', to: 'orchestrator', label: 'Re-run & verify', type: 'verify', loop: true },
  { from: 'orchestrator', to: 'github', label: 'Post completion report', type: 'request' },
  { from: 'orchestrator', to: 'user', label: 'Pipeline complete', type: 'response' },
];
