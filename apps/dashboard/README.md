# Dashboard

Open source Next.js monitoring dashboard for the MAAC Research Platform.

## Overview

This is the monitoring and visualization dashboard for the MAAC Research Platform. It provides:

- Real-time experiment monitoring
- Statistical analysis visualization
- Cognitive evaluation results
- System health monitoring

## Development

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start
```

## Features

- **Real-time Monitoring**: Live updates of experiment status
- **Data Visualization**: Charts and graphs for statistical analysis
- **Experiment Management**: View and manage research experiments
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- Next.js 14
- React 18
- TypeScript
- Shared types from `@maac/types`

## Environment Variables

The dashboard connects to the API server. Configure the API URL in your environment:

```
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## License

MIT (Open Source)
