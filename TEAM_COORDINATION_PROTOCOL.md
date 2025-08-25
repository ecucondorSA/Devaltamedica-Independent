# 🤖 TEAM AI COORDINATION PROTOCOL

## 🏗️ ARQUITECTURA DEL EQUIPO

```
┌─────────────────────────────────────────────────────────────────────┐
│                    🏥 ALTAMEDICA AI TEAM                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  🔵 CLAUDE (Sonnet-4)    🟢 GEMINI           🟠 CHATGPT-5          │
│  ├─ packages/* (26)      ├─ apps/* (7)       ├─ QA & Testing       │
│  ├─ Types & Contracts    ├─ User Interfaces  ├─ Architecture        │
│  ├─ Medical Services     ├─ Business Logic   ├─ Integration         │
│  └─ Build Infrastructure └─ User Experience  └─ DevOps & CI/CD      │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## 🎯 DIVISION DE RESPONSABILIDADES

### 🔵 **CLAUDE TERRITORY (packages/*)**
- **Core Packages**: UI, Types, Hooks, Medical, Auth, Database  
- **Build System**: tsup configs, exports, TypeScript declarations
- **Medical Services**: HIPAA-compliant implementations
- **Shared Infrastructure**: Utils, configs, common patterns
- **Status**: 95% completado, 100+ componentes UI exportados

### 🟢 **GEMINI TERRITORY (apps/*)**  
- **Applications**: 7 frontend apps + backend services
- **User Flows**: Registration, appointments, consultations
- **Business Logic**: Medical workflows, admin dashboards
- **Integration**: Consuming Claude packages in real apps
- **Status**: Trabajando en admin dashboard (40% → 70%)

### 🟠 **CHATGPT-5 TERRITORY (QA/DevOps)**
- **Quality Assurance**: Integration testing, E2E validation  
- **Architecture Review**: Design patterns, code quality
- **DevOps**: CI/CD, deployments, monitoring, performance
- **Coordination**: Cross-team integration, task management
- **Status**: Nuevo miembro del equipo

## 🔄 COMMUNICATION CHANNELS

### 📡 **PRIMARY COMMUNICATION: GEMINI-CLAUDE-SYNC.md**

```markdown
## [AI_NAME] [ACTION] - [TIMESTAMP]

### Status:
[Current work description]

### Blockers:
[Issues preventing progress]  

### Requests:
[Help needed from other AIs]

### Deliverables:
[What was completed]

---
```

### 📊 **REAL-TIME MONITORING: AI_NOTIFICATIONS.jsonl**

```json
{"timestamp": "2025-08-25T13:00:00Z", "ai": "claude", "event": "PACKAGE_BUILD_SUCCESS", "details": {"package": "ui", "size": "1.05MB"}}
{"timestamp": "2025-08-25T13:01:00Z", "ai": "gemini", "event": "APP_COMPILATION_PROGRESS", "details": {"app": "admin", "progress": "65%"}}
{"timestamp": "2025-08-25T13:02:00Z", "ai": "chatgpt5", "event": "INTEGRATION_TEST_RESULT", "details": {"status": "passed", "coverage": "87%"}}
```

### 🤖 **AUTO-SYNC MONITORING**

- **Frequency**: Every 30 seconds
- **Detection**: File changes, build status, git activity  
- **Alerts**: Critical errors, blockers, integration failures
- **Health Check**: System-wide status every 5 minutes

## 🛠️ WORKFLOW PROTOCOLS

### ⚡ **DAILY WORKFLOW**

1. **Morning Sync** (5 min):
   - Check GEMINI-CLAUDE-SYNC.md for overnight updates
   - Run quick health check
   - Update personal status

2. **Active Development** (Throughout day):
   - Work in assigned territory
   - Update status every major milestone
   - Alert team of blockers immediately

3. **Evening Wrap-up** (5 min):
   - Commit and push changes
   - Update completion status  
   - Set context for next day

### 🚨 **ESCALATION PROTOCOL**

**Level 1: Self-Resolution** (10 min)
- Try standard fixes (rebuild, cache clear, restart)
- Check documentation and common issues

**Level 2: Cross-AI Collaboration** (30 min)  
- Post in GEMINI-CLAUDE-SYNC.md with specific request
- Provide context: what was attempted, error messages, environment
- Other AIs respond within 30 minutes during active hours

**Level 3: Human Escalation** (60 min)
- Critical system failures that block multiple AIs
- Security vulnerabilities discovered
- Architecture decisions requiring business input

### 🎯 **TASK COORDINATION**

**Before Starting Major Work:**
1. Post intent in GEMINI-CLAUDE-SYNC.md
2. Check for conflicts with other AIs' work
3. Confirm no dependencies blocking progress

**During Complex Tasks:**
1. Update progress every 30-60 minutes
2. Share intermediate results/findings
3. Ask for quick reviews on critical decisions

**After Completion:**
1. Document changes and impact
2. Run affected tests/builds
3. Notify team of completion + next steps

## 📋 INTEGRATION CHECKPOINTS

### 🔍 **DAILY HEALTH CHECKS**

**Claude Responsibilities:**
```bash
# Verify packages building
pnpm --filter './packages/*' build

# Check exports integrity  
node verify-package-exports.js

# Validate types consistency
pnpm type-check
```

**Gemini Responsibilities:**
```bash
# Verify apps compiling
pnpm --filter './apps/*' type-check

# Test app starts without errors
pnpm --filter './apps/admin' dev --port 3005

# Validate user flows
npm run test:e2e:critical
```

**ChatGPT-5 Responsibilities:**
```bash
# Integration health check
node integration-health-check.cjs

# Performance validation
npm run perf:benchmark

# Security scan
npm run security:audit

# CI/CD pipeline check
gh run list --status failure
```

### 🎯 **WEEKLY COORDINATION MEETINGS**

**Virtual "Stand-up" Protocol:**

1. **Status Round-Robin** (5 min each AI):
   - What was completed this week
   - Current blockers or challenges
   - Next week's primary objectives

2. **Integration Review** (10 min):
   - Cross-team dependencies resolved
   - New integration points identified  
   - Performance and quality metrics review

3. **Strategic Planning** (10 min):
   - Architecture decisions needed
   - Technical debt prioritization
   - Feature roadmap alignment

## 🚀 PERFORMANCE TARGETS

### 📊 **TEAM SUCCESS METRICS**

```javascript
const teamKPIs = {
  // Development Velocity
  featuresDeliveredWeekly: '>5',
  bugsResolvedWeekly: '>10', 
  techDebtReduced: '>20%',
  
  // Quality Gates
  buildSuccessRate: '>98%',
  testCoverage: '>85%',
  typeScriptErrors: '0',
  securityVulns: '0',
  
  // Integration Health  
  packageAppsCompatibility: '100%',
  e2eTestsPassRate: '>95%',
  performanceBudgetsMet: '100%',
  
  // Team Coordination
  blockerResolutionTime: '<2hrs',
  crossAICollaboration: 'Daily',
  communicationEfficiency: 'High',
  
  // Business Impact
  userFlowsWorking: '100%',
  hipaaCompliance: '100%',
  productionReadiness: '>90%'
};
```

### ⚡ **SPRINT VELOCITY TRACKING**

**Story Points by AI:**
- Claude (packages): 20-25 points/week
- Gemini (apps): 15-20 points/week  
- ChatGPT-5 (QA): 10-15 points/week

**Collaboration Multiplier:** +30% velocity when working together vs individually

## 🛡️ CONFLICT RESOLUTION

### ⚙️ **TECHNICAL CONFLICTS**

**Scenario**: Two AIs modify the same file simultaneously

**Resolution Protocol:**
1. Auto-detection via git conflicts
2. Both AIs coordinate in GEMINI-CLAUDE-SYNC.md
3. Senior AI (based on file ownership) makes final call
4. Document decision rationale for future reference

**Ownership Priority:**
- `packages/*` → Claude has final authority
- `apps/*` → Gemini has final authority  
- `CI/CD, docs, configs` → ChatGPT-5 has final authority

### 🎯 **PRIORITY CONFLICTS**

**Scenario**: Limited resources, multiple high-priority tasks

**Resolution Protocol:**
1. Document all competing priorities
2. Each AI presents impact assessment
3. Vote on priority order (majority rules)  
4. Human escalation if no consensus after 1 hour

## 🔄 CONTINUOUS IMPROVEMENT

### 📈 **WEEKLY RETROSPECTIVES**

**What Went Well:**
- Successful collaborations
- Efficient problem solving
- Quality improvements

**What Could Be Better:**  
- Communication gaps
- Process inefficiencies
- Technical bottlenecks

**Action Items:**
- Process adjustments
- Tool improvements  
- Skill development areas

### 🎯 **TEAM EVOLUTION**

The team will adapt and improve coordination over time:

- **Week 1**: Learning each other's patterns
- **Week 2**: Optimizing communication protocols  
- **Week 3**: Achieving peak collaboration efficiency
- **Month 1+**: Self-organizing, highly efficient team

---

## 🎖️ TEAM MISSION

**Build a world-class medical platform through AI collaboration that demonstrates the future of software development: multiple AI systems working together seamlessly to create something no single AI could build alone.**

**Success = Claude + Gemini + ChatGPT-5 > Sum of Individual Contributions** 🚀