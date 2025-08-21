# Patient Data Export Service - Refactored Architecture

## Overview

This directory contains the refactored PatientDataExportService, broken down into specialized, maintainable components following the Single Responsibility Principle.

## Architecture

### Core Service

- `patient-export.service.ts` - Main orchestrator (minimal, focused)

### Data Collectors

- `collectors/` - Specialized data collection services
  - `medical-records.collector.ts` - Medical history and lab results
  - `appointments.collector.ts` - Appointments and vital signs
  - `prescriptions.collector.ts` - Prescriptions, allergies, immunizations
  - `procedures.collector.ts` - Procedures, diagnoses, clinical notes
  - `documents.collector.ts` - Images and documents
  - `billing.collector.ts` - Billing and consents
  - `audit.collector.ts` - Audit logs

### Export Generators

- `generators/` - Format-specific export generation
  - `json.generator.ts` - JSON format export
  - `pdf.generator.ts` - PDF format export
  - `csv.generator.ts` - CSV format export
  - `zip.generator.ts` - ZIP archive export
  - `fhir.generator.ts` - FHIR R4 format export

### Security & Compliance

- `security/` - HIPAA compliance and security services
  - `access-control.service.ts` - Permission verification
  - `encryption.service.ts` - File encryption
  - `audit-logger.service.ts` - HIPAA audit logging
  - `compliance-validator.service.ts` - Compliance validation

### Request Management

- `requests/` - Export request lifecycle management
  - `request-manager.service.ts` - Request creation and validation
  - `status-updater.service.ts` - Status updates
  - `notification.service.ts` - User notifications

### File Operations

- `files/` - File system operations
  - `file-manager.service.ts` - File operations
  - `cleanup.service.ts` - Automated cleanup

## Migration Strategy

- **Phase 1**: Extract collectors (backward compatible)
- **Phase 2**: Extract generators and security
- **Phase 3**: Extract request management
- **Phase 4**: Refactor main service

## Quality Metrics

- **Target**: <200 lines per file
- **Complexity**: LOW cyclomatic complexity
- **Coverage**: >95% test coverage
- **Performance**: <30% of original execution time
