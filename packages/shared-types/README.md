# Shared Types

Shared TypeScript type definitions for the MAAC Research Platform.

## Overview

This package provides common type definitions used across all packages and applications in the monorepo.

## Features

- Cognitive evaluation types
- LLM provider interfaces
- Experiment configuration types
- Shared domain models

## Usage

```typescript
import { CognitiveEvaluation, LLMProvider } from '@maac/types';

const evaluation: CognitiveEvaluation = {
  id: '123',
  timestamp: new Date(),
  metrics: { coherence: 0.85 }
};
```

## License

MIT (Open Source)
