<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" class="logo" width="120"/>

# N8N Webhook Architecture Expert Analysis

## Executive Summary

Based on comprehensive research of n8n's webhook architecture and production deployment patterns, **Option B: Single Webhook with Input Routing** emerges as the optimal solution for your 5-phase animatic generation system. This architecture provides the best balance of cost efficiency, maintainability, and scalability while preserving your existing TESTA_ANIMATIC workflow.

## 1. Architecture Recommendation

### Recommended Architecture: Option B - Single Webhook Hub with Enhanced Routing

**Primary Structure:**

```
Single Webhook Hub: /animatic-workflow-hub
├── Input: { "phase": "script_interpretation|element_generation|scene_generation|video_generation|final_assembly", "data": {...} }
├── Switch Node routing based on phase parameter  
├── Phase 1: Script interpretation logic
├── Phase 2: Element generation logic
├── Phase 3: Execute existing TESTA_ANIMATIC workflow via HTTP Request
├── Phase 4: Video generation logic
└── Phase 5: Final assembly logic
```


### Technical Justification

1. **Cost Optimization**: Single active workflow vs. 5 separate workflows saves significant costs on n8n pricing tiers[1][2]. Pro plan allows 15 active workflows, so conserving workflow count is crucial.
2. **Centralized Management**: All phase logic in one place simplifies debugging, monitoring, and maintenance[3][4].
3. **Flexible Scaling**: Easy to add new phases or modify existing logic without creating additional workflows[5][6].
4. **Preserved Integration**: Maintains your proven TESTA_ANIMATIC workflow through HTTP Request node calls[7].

## 2. Implementation Details

### Core Webhook Configuration

**Webhook Node Setup:**

```json
{
  "path": "/animatic-workflow-hub",
  "httpMethod": "POST",
  "responseMode": "responseNode",
  "options": {
    "noResponseBody": false,
    "rawBody": false,
    "allowedOrigins": "*"
  }
}
```

**Input Validation Pattern:**

```javascript
// Function Node - Input Validation
const { phase, data, jobId } = $input.all()[0].json;

const validPhases = ['script_interpretation', 'element_generation', 'scene_generation', 'video_generation', 'final_assembly'];

if (!validPhases.includes(phase)) {
  throw new Error(`Invalid phase: ${phase}`);
}

if (!jobId) {
  throw new Error('jobId is required for tracking');
}

return [{
  json: {
    phase,
    data,
    jobId,
    timestamp: new Date().toISOString()
  }
}];
```


### Switch Node Routing Configuration

**Switch Node Setup:**

```json
{
  "mode": "rules",
  "rules": [
    {
      "operation": "equal",
      "value1": "={{ $json.phase }}",
      "value2": "script_interpretation",
      "outputKey": "0"
    },
    {
      "operation": "equal", 
      "value1": "={{ $json.phase }}",
      "value2": "element_generation",
      "outputKey": "1"
    },
    {
      "operation": "equal",
      "value1": "={{ $json.phase }}",
      "value2": "scene_generation", 
      "outputKey": "2"
    },
    {
      "operation": "equal",
      "value1": "={{ $json.phase }}",
      "value2": "video_generation",
      "outputKey": "3"
    },
    {
      "operation": "equal",
      "value1": "={{ $json.phase }}",
      "value2": "final_assembly",
      "outputKey": "4"
    }
  ],
  "fallbackOutput": "extra"
}
```


### Phase 3 Integration Pattern

**TESTA_ANIMATIC Integration:**

```json
{
  "method": "POST",
  "url": "https://your-n8n-instance.com/webhook/a1dbfc3a-b5fa-41be-9720-13960051b88d",
  "headers": {
    "Content-Type": "application/json",
    "X-Source": "animatic-hub"
  },
  "body": {
    "data": "={{ $json.data }}",
    "jobId": "={{ $json.jobId }}",
    "parentWorkflow": "animatic-hub"
  }
}
```


## 3. Performance \& Cost Analysis

### Resource Usage Comparison

| Metric | Multiple Webhooks | Single Hub | Hybrid |
| :-- | :-- | :-- | :-- |
| Active Workflows | 5 | 1 | 2 |
| Memory Usage | Higher | Lower | Medium |
| Execution Tracking | Complex | Simplified | Medium |
| Debugging Complexity | High | Low | Medium |
| Cost (Pro Plan) | 33% quota used | 7% quota used | 13% quota used |

### N8N Pricing Implications

- **Pro Plan**: €50/month, 15 active workflows[8][9]
- **Current Usage**: 5 workflows = 33% of quota
- **Recommended Usage**: 1 workflow = 7% of quota
- **Savings**: 26% quota freed for future expansion


### Concurrent Request Handling

N8N handles webhook requests in parallel by default[10][11]. Single webhook architecture:

- **Advantage**: Centralized queuing and status tracking
- **Performance**: No degradation vs. multiple webhooks[12][4]
- **Monitoring**: Unified execution logs and error tracking


## 4. Error Handling \& Status Updates

### Robust Error Handling Pattern

**Error Workflow Configuration:**

```json
{
  "errorTrigger": {
    "settings": {
      "errorWorkflow": "animatic-error-handler"
    }
  },
  "errorHandling": {
    "continueOnFail": true,
    "retryAttempts": 3,
    "retryDelay": 30
  }
}
```

**Phase-Specific Error Recovery:**

```javascript
// Error Handler Function
const { phase, jobId, error } = $input.all()[0].json;

// Update Supabase with error status
const updateData = {
  job_id: jobId,
  phase: phase,
  status: 'error',
  error_message: error.message,
  retry_count: (data.retry_count || 0) + 1,
  updated_at: new Date().toISOString()
};

// Determine if retry is appropriate
const maxRetries = {
  'script_interpretation': 3,
  'element_generation': 2, 
  'scene_generation': 1,
  'video_generation': 2,
  'final_assembly': 3
};

const shouldRetry = updateData.retry_count <= maxRetries[phase];

return [{
  json: {
    ...updateData,
    shouldRetry,
    nextAction: shouldRetry ? 'retry' : 'notify_failure'
  }
}];
```


### Real-Time Status Updates

**Supabase Integration Pattern:**

```javascript
// Status Update Function
const statusUpdate = {
  job_id: $json.jobId,
  phase: $json.phase,
  status: 'processing', // 'queued', 'processing', 'completed', 'error'
  progress_percentage: calculateProgress($json.phase),
  current_step: $json.currentStep,
  estimated_completion: calculateETA($json.phase),
  updated_at: new Date().toISOString()
};

return [{ json: statusUpdate }];
```

**WebSocket Status Broadcasting:**

```javascript
// Real-time notification to React app
const notification = {
  type: 'status_update',
  jobId: $json.jobId,
  phase: $json.phase,
  status: $json.status,
  message: generateStatusMessage($json),
  timestamp: new Date().toISOString()
};

// Broadcast via webhook to your React app
return [{ json: notification }];
```


## 5. Async Processing Patterns

### Long-Running Task Management

**Async Processing Pattern:**

```json
{
  "immediateResponse": {
    "status": "accepted",
    "jobId": "{{ $json.jobId }}",
    "phase": "{{ $json.phase }}",
    "estimatedDuration": "{{ calculateDuration($json.phase) }}"
  },
  "backgroundProcessing": {
    "continueInBackground": true,
    "statusEndpoint": "/status/{{ $json.jobId }}",
    "webhookCallback": "{{ $json.callbackUrl }}"
  }
}
```

**Phase Duration Management:**

```javascript
// Duration estimates for each phase
const phaseDurations = {
  'script_interpretation': 60, // 1 minute
  'element_generation': 300, // 5 minutes  
  'scene_generation': 900, // 15 minutes (TESTA_ANIMATIC)
  'video_generation': 600, // 10 minutes
  'final_assembly': 180 // 3 minutes
};

// Calculate progress and ETA
function calculateProgress(currentPhase, phases) {
  const phaseOrder = ['script_interpretation', 'element_generation', 'scene_generation', 'video_generation', 'final_assembly'];
  const currentIndex = phaseOrder.indexOf(currentPhase);
  return ((currentIndex + 1) / phaseOrder.length) * 100;
}
```


## 6. Integration Roadmap

### Preserving TESTA_ANIMATIC Workflow

**Integration Strategy:**

1. **Keep Existing Workflow**: Maintain current TESTA_ANIMATIC as-is[7]
2. **HTTP Request Integration**: Call existing workflow via HTTP Request node
3. **Status Bridging**: Map TESTA_ANIMATIC responses to unified status format
4. **Error Propagation**: Forward errors from TESTA_ANIMATIC to main error handler

**Migration Steps:**

1. **Phase 1**: Deploy single hub workflow alongside existing system
2. **Phase 2**: Route new requests through hub while maintaining direct TESTA_ANIMATIC access
3. **Phase 3**: Update React app to use single endpoint
4. **Phase 4**: Deprecate direct TESTA_ANIMATIC calls once testing is complete

### Database Integration Patterns

**Supabase Schema Recommendations:**

```sql
-- Job tracking table
CREATE TABLE animatic_jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id VARCHAR UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  status VARCHAR NOT NULL DEFAULT 'queued',
  current_phase VARCHAR,
  phase_data JSONB,
  error_log JSONB,
  completion_percentage INTEGER DEFAULT 0
);

-- Phase execution tracking
CREATE TABLE phase_executions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id VARCHAR REFERENCES animatic_jobs(job_id),
  phase_name VARCHAR NOT NULL,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  status VARCHAR NOT NULL,
  input_data JSONB,
  output_data JSONB,
  execution_time_seconds INTEGER
);
```


## 7. Alternative Approaches \& Best Practices

### Alternative Pattern: Queue-Based Architecture

For future scaling beyond current requirements:

```javascript
// Redis Queue Integration
const queueJob = {
  type: 'animatic_generation',
  priority: calculatePriority($json.phase),
  delay: 0,
  attempts: 3,
  data: {
    jobId: $json.jobId,
    phase: $json.phase,
    inputData: $json.data
  }
};
```


### Monitoring \& Observability

**Key Metrics to Track:**

- Phase execution times
- Error rates by phase
- Concurrent job processing
- Queue depth and processing lag
- Resource utilization per phase

**Implementation:**

```javascript
// Metrics collection
const metrics = {
  execution_id: $execution.id,
  workflow_name: $workflow.name,
  phase: $json.phase,
  duration_seconds: calculateDuration(),
  memory_usage: getMemoryUsage(),
  status: 'completed',
  timestamp: new Date().toISOString()
};
```


## Conclusion

The **Single Webhook Hub with Input Routing** architecture provides the optimal foundation for your 5-phase animatic generation system. It maximizes cost efficiency, simplifies maintenance, and provides robust scalability while preserving your proven TESTA_ANIMATIC workflow.

**Immediate Next Steps:**

1. Implement the single webhook hub workflow using the provided configurations
2. Set up Supabase integration for job tracking and status updates
3. Deploy error handling workflows for robust production operation
4. Update React application to use the unified endpoint
5. Monitor performance and iterate based on production usage patterns

This architecture positions your system for future growth while maintaining the reliability and functionality of your current TESTA_ANIMATIC workflow.

