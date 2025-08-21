# 🤖 GPT-5 Optimized Prompts for AltaMedica

## 📋 Overview

This directory contains optimized prompt templates based on OpenAI's GPT-5 best practices, specifically tailored for the AltaMedica medical platform. These prompts are designed to maximize performance, accuracy, and compliance in healthcare development.

## 🎯 Available Prompt Templates

### 1. `REAL-FUNCTIONALITY-AUDIT.xml` ⭐ **NUEVO - CRÍTICO**
**Purpose**: Auditoría REAL de funcionalidad - NO teoría  
**Best For**: 
- Identificar problemas FUNCIONALES reales
- Probar aplicaciones REALES, no solo leer código
- Priorizar lo que NO FUNCIONA sobre lo que está "bien documentado"
- Auditoría de sistemas críticos rotos

**Key Optimizations**:
- `reasoning_effort: high` para diagnóstico preciso
- `tool_budget: unlimited` para auditoría completa
- Prioridad: FUNCIONALIDAD > COMPLIANCE
- Enfoque en errores 500, build failures, dependencias rotas

### 1.b `AUDITORIA-ARQUITECTONICA.md` ⭐ **NUEVO**
Guía operativa para auditar, corregir y agregar nuevos códigos sin duplicar archivos en el monorepo. Define tareas, reglas, criterios de aceptación y prioridades (P0–P2).

### 2. `CRITICAL-SYSTEM-REPAIR.xml` ⭐ **NUEVO - CRÍTICO**
**Purpose**: Reparación RÁPIDA de sistemas críticos - NO optimización  
**Best For**:
- Reparar sistemas de autenticación rotos
- Arreglar build systems corruptos
- Resolver dependencias irresolubles
- Parches rápidos para funcionalidad básica

**Key Optimizations**:
- `reasoning_effort: high` para reparación precisa
- `tool_budget: unlimited` para reparación completa
- Prioridad: FUNCIONAMIENTO > PERFECCIÓN
- Enfoque en parches rápidos, no refactorización

### 3. `medical-features.xml`
**Purpose**: Medical feature development with HIPAA compliance  
**Best For**: 
- Implementing new medical functionality
- PHI data handling features
- Clinical calculations and algorithms
- Patient management systems

**Key Optimizations**:
- `reasoning_effort: high` for medical accuracy
- Strict PHI handling protocols
- Audit trail requirements
- Double validation for critical calculations

### 4. `telemedicine-webrtc.xml`
**Purpose**: WebRTC and real-time medical communications  
**Best For**:
- Video consultation features
- WebRTC debugging and optimization
- Real-time data synchronization
- Quality of Service (QoS) monitoring

**Key Optimizations**:
- `reasoning_effort: medium` for balanced performance
- Unlimited tool budget for debugging
- Connection flow patterns
- Media stream cleanup protocols

### 5. `compliance-hipaa.xml`
**Purpose**: HIPAA compliance and security implementation  
**Best For**:
- Security audits
- Regulatory compliance features
- Data encryption implementation
- Access control systems

**Key Optimizations**:
- `reasoning_effort: high` for compliance accuracy
- Confirmation required for all PHI operations
- Comprehensive audit logging
- Argentina + HIPAA dual compliance

## 🚨 **ESTADO ACTUAL DEL SISTEMA - CRÍTICO**

### **GAPs REALES Identificados:**
1. **GAP-REAL-001**: Sistema de autenticación completamente roto (ERROR 500 en todas las rutas)
2. **GAP-REAL-002**: Sistema de build completamente roto (imposible compilar)
3. **GAP-REAL-003**: Configuración de paquetes completamente corrupta
4. **GAP-REAL-004**: Sistema de TypeScript corrupto
5. **GAP-REAL-005**: Sistema de dependencias completamente roto

### **Prioridad INMEDIATA:**
- **REPARAR FUNCIONALIDAD BÁSICA ANTES DE HIPAA**
- **Sistema completamente inutilizable actualmente**
- **Tiempo estimado de reparación: 12-20 horas**

## 🚀 Quick Start

### Using with Scripts

```powershell
# Launch a critical system repair session
powershell -File scripts/gpt5-session.ps1 -Profile critical-repair -ShowMetrics

# Launch a real functionality audit
powershell -File scripts/gpt5-session.ps1 -Profile real-audit -ShowMetrics

# Launch a medical development session
powershell -File scripts/gpt5-session.ps1 -Profile medical -ShowMetrics

# Optimize an existing prompt
powershell -File scripts/gpt5-metaprompt.ps1 -PromptFile medical-features.xml -OptimizeFor accuracy
```

### Using in VS Code

Press `Ctrl+Shift+P` → `Tasks: Run Task` → Select:
- 🚨 **GPT-5 Critical System Repair** ⭐ **NUEVO**
- 🔍 **GPT-5 Real Functionality Audit** ⭐ **NUEVO**
- 🤖 GPT-5 Medical Session
- 🎥 GPT-5 Telemedicine Session
- 🔒 GPT-5 Compliance Session
- 🧪 GPT-5 Testing Session
- 🔄 GPT-5 Metaprompt Optimizer

## 📊 GPT-5 Configuration Parameters

### reasoning_effort
Controls the depth of model reasoning:
- `low`: Fast responses, routine tasks
- `medium`: Balanced performance
- `high`: Maximum accuracy for critical operations

### verbosity
Controls response length:
- `low`: Concise responses
- `medium`: Moderate detail
- `high`: Comprehensive explanations

### Tool Budget
Limits tool calls to prevent over-exploration:
- Emergency operations: `unlimited`
- Routine operations: `5` calls
- Sensitive operations: `2` calls before confirmation

## 🎯 Optimization Strategies

### 1. Context Gathering
```xml
<context_gathering>
  Goal: Get enough context fast
  Method:
  - Start broad, then focus
  - Parallelize discovery
  - Cache results, don't repeat
  Early stop: When you can name exact files
</context_gathering>
```

### 2. Tool Preambles
```xml
<tool_preambles>
  <before_operation>
    Plan: [Step 1] → [Step 2] → [Step 3]
  </before_operation>
  <progress_update>
    ✅ Done: [Previous]
    🔄 Current: [Now]
  </progress_update>
</tool_preambles>
```

### 3. Medical Persistence
```xml
<medical_persistence>
  <emergency_mode>
    reasoning_effort: high
    confirmation: never
    tool_budget: unlimited
  </emergency_mode>
</medical_persistence>
```

## 📈 Expected Performance Improvements

Using these optimized prompts with GPT-5:

| Metric | Improvement |
|--------|------------|
| Development Speed | +40% |
| Error Reduction | -60% |
| Compliance Score | 95%+ |
| Code Quality | +30% |
| Time to Deploy | -40% |

## 🔄 Metaprompting

Use GPT-5 to optimize its own prompts:

```powershell
# Interactive optimization
powershell -File scripts/gpt5-metaprompt.ps1 `
  -PromptFile medical-features.xml `
  -Interactive

# Automated optimization
powershell -File scripts/gpt5-metaprompt.ps1 `
  -PromptFile telemedicine-webrtc.xml `
  -OptimizeFor speed `
  -SaveOptimized
```

## 📝 Creating Custom Prompts

### Template Structure
```xml
<?xml version="1.0" encoding="UTF-8"?>
<domain_context>
  <reasoning_configuration>
    <reasoning_effort>medium</reasoning_effort>
    <verbosity>low</verbosity>
  </reasoning_configuration>
  
  <context_gathering>
    <!-- Discovery strategy -->
  </context_gathering>
  
  <implementation_patterns>
    <!-- Domain-specific patterns -->
  </implementation_patterns>
  
  <tool_preambles>
    <!-- User communication -->
  </tool_preambles>
</domain_context>
```

### Best Practices
1. **Be Specific**: Clear, unambiguous instructions
2. **Avoid Contradictions**: Review for conflicting directives
3. **Set Boundaries**: Define tool budgets and stop conditions
4. **Include Examples**: Provide code patterns when relevant
5. **Test Iteratively**: Use metaprompting to refine

## 🛠️ Troubleshooting

### Prompt Too Verbose
- Set `verbosity: low` globally
- Override with `verbosity_override` for code only

### Too Many Tool Calls
- Set explicit `tool_budget` limits
- Add `early_stop_criteria`
- Use `reasoning_effort: medium` instead of `high`

### Slow Performance
- Use `reasoning_effort: low` for routine tasks
- Enable Responses API with `-UseResponsesAPI`
- Limit context gathering depth

## 📚 Additional Resources

- [GPT-5 Official Guide](https://platform.openai.com/docs/guides/gpt5)
- [CLAUDE.md](../CLAUDE.md) - Project-specific instructions
- [Scripts Documentation](../scripts/README.md)
- [VS Code Tasks](./.vscode/tasks.json)
- [Auditoría GAPS Real](../auditoria-gaps-mvp.json) ⭐ **NUEVO**

## 🤝 Contributing

When adding new prompt templates:
1. Follow the XML structure convention
2. Include comprehensive documentation
3. Test with the metaprompt optimizer
4. Update this README with usage examples
5. Add corresponding VS Code task if applicable

## 📄 License

These prompts are part of the AltaMedica platform and follow the same licensing terms.