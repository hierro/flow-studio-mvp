# FLOW.STUDIO Prompt Formatting Guide

## For Web Brother Development Team

### 🎯 **Critical Information for LLM Configuration Management**

## **Database Storage Format**

When retrieving LLM configurations from the database, prompts are stored with **actual line breaks** in JSONB:

```json
{
  "start_frame_prompt_generation": {
    "system_prompt": "You are the Lead Storyboard Artist...\n\nCORE METHODOLOGY:\nYou receive scene data...",
    "user_prompt": "Scene {{$json.scene_id}} - {{$json.action_summary}}\n\nNARRATIVE FOUNDATION:\n\"{{$json.natural_description}}\""
  }
}
```

### ✅ **Ready for Direct LLM Consumption**
- **No processing needed** - use retrieved strings directly
- **Actual line breaks** (`\n`) preserved for proper formatting
- **Variable placeholders** (`{{$json.field}}`) ready for injection

## **Configuration Retrieval**

```typescript
// Get configuration from database
const config = await getAppConfiguration();

// Direct usage - no formatting needed
const systemPrompt = config.start_frame_prompt_generation?.system_prompt;
const userPrompt = config.start_frame_prompt_generation?.user_prompt;

// Ready for LLM API calls
const llmRequest = {
  messages: [
    { role: "system", content: systemPrompt },
    { role: "user", content: processedUserPrompt }
  ]
};
```

## **Variable Injection Process**

### **Step 1: Prepare Scene Data (Flatten for Injection)**
```typescript
// Example: Flatten scene data for variable injection
const sceneData = {
  scene_id: 1,
  action_summary: "Introduction of the setting and characters",
  natural_description: "The spot opens in a magnificent circular environment...",
  camera_type: "wide establishing shot",
  image_engine: "FLUX DEV",
  max_prompt_length: 800,
  aspect_ratio: "16:9",
  // ... all other scene properties flattened
};
```

### **Step 2: Process Template with Variable Injection**
```typescript
import { VariableInjection } from '../utils/VariableInjection';

// Process user prompt template
const processedPrompt = VariableInjection.processTemplate(userPrompt, { 
  masterJSON: {}, // Not used in simple mode
  sceneId: "scene_1",
  currentScene: sceneData // Flattened scene data
});

// Result: All {{$json.field}} replaced with actual values
```

## **Example Complete Workflow**

```typescript
async function generateScenePrompt(sceneId: string, masterJSON: any) {
  // 1. Get LLM configuration
  const config = await getAppConfiguration();
  const systemPrompt = config.start_frame_prompt_generation?.system_prompt;
  const userPromptTemplate = config.start_frame_prompt_generation?.user_prompt;
  
  // 2. Flatten scene data for injection
  const sceneData = {
    scene_id: sceneId.replace('scene_', ''),
    ...masterJSON.scenes[sceneId],
    ...masterJSON.extraction_metadata,
    // Include any global properties needed
  };
  
  // 3. Process template with variable injection
  const processedUserPrompt = VariableInjection.processTemplate(
    userPromptTemplate, 
    { masterJSON, sceneId, currentScene: sceneData }
  );
  
  // 4. Send to LLM (no additional formatting needed)
  const response = await llmAPI.generate({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: processedUserPrompt }
    ]
  });
  
  return response;
}
```

## **Key Points for Web Brother**

### ✅ **What Works (Do This)**
- **Direct retrieval**: Use database strings as-is for LLM consumption
- **Simple variable injection**: Replace `{{$json.field}}` with flat data properties
- **No escape processing**: Content is already properly formatted

### ❌ **What to Avoid**
- **Don't process `\n` escapes** - they're actual line breaks in storage
- **Don't re-format content** - it's LLM-ready from database
- **Don't modify prompt structure** - use configuration as stored

### 🎯 **Testing Verification**
```typescript
// Quick test to verify configuration format
console.log('System prompt preview:', systemPrompt.slice(0, 100));
// Should show: "You are the Lead Storyboard Artist at a premium animation..."
// NOT: "You are the Lead Storyboard Artist at a premium animation\\n\\n..."
```

## **Configuration Schema Reference**

```typescript
interface LLMConfiguration {
  start_frame_prompt_generation: {
    system_prompt: string;    // LLM-ready with actual line breaks
    user_prompt: string;      // Template with {{$json.field}} variables
  };
  llm_providers: {
    [provider: string]: {
      model: string;
      max_tokens: number;
      temperature: number;
    };
  };
  image_generation: { /* API configs */ };
  video_generation: { /* API configs */ };
}
```

## **Variable Reference**

### **Available Variables in Templates**
```typescript
// Scene-specific variables
{{$json.scene_id}}           // Scene number (1, 2, 3...)
{{$json.action_summary}}     // Brief scene description
{{$json.natural_description}} // Narrative description
{{$json.camera_type}}        // Camera angle/type
{{$json.locations_text}}     // Location descriptions
{{$json.characters_text}}    // Character descriptions
{{$json.props_text}}         // Props descriptions
{{$json.actions_text}}       // Action descriptions
{{$json.interactions_text}}  // Element interactions

// Technical specifications
{{$json.image_engine}}       // AI model name
{{$json.max_prompt_length}}  // Character limit
{{$json.aspect_ratio}}       // Image dimensions

// Style properties
{{$json.overall_mood}}       // Scene mood
{{$json.color_primary}}      // Primary color
{{$json.line_work}}          // Line style
{{$json.shading}}           // Shading style
{{$json.framing}}           // Frame style
```

---

**Last Updated**: 2025-01-24  
**Version**: 2.0  
**Status**: Production Ready ✅