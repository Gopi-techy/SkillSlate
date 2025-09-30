# SkillSlate JavaScript Frontend

A pure JavaScript implementation of the SkillSlate AI Portfolio-as-a-Service frontend, built without React or TypeScript for simplicity and performance.

## Features

- **Pure JavaScript**: No frameworks, just vanilla ES6+ JavaScript
- **Component-based Architecture**: Modular design with reusable components
- **Responsive Design**: Built with Tailwind CSS for mobile-first design
- **Modern UI/UX**: Clean, professional interface matching the React version
- **Interactive Elements**: Full portfolio creation workflow with step-by-step process
- **Template Gallery**: Browse and select from multiple portfolio templates
- **GitHub Integration**: Connect GitHub account for automatic project import
- **One-Click Deployment**: Deploy portfolios to Vercel or Netlify

## Project Structure

```
apps/Client-JS/
├── index.html              # Main HTML file
├── package.json            # Dependencies and scripts
├── vite.config.js          # Vite configuration
├── tailwind.config.js      # Tailwind CSS configuration
├── postcss.config.js       # PostCSS configuration
└── src/
    ├── main.js             # Application entry point
    ├── app.js              # Main application class
    ├── styles.css          # Global styles and Tailwind imports
    ├── data/
    │   └── templates.js    # Template data
    ├── utils/
    │   └── icons.js        # Icon utility functions
    └── components/
        ├── Header.js       # Navigation header component
        ├── LandingPage.js  # Homepage component
        ├── AuthPage.js     # Login/signup component
        ├── Dashboard.js    # User dashboard component
        ├── CreatePortfolio.js # Portfolio creation workflow
        └── TemplatesPage.js   # Template gallery component
```

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Navigate to the JavaScript frontend directory:

   ```bash
   cd apps/Client-JS
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:3001`

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Architecture

### Component System

The application uses a component-based architecture where each page/feature is implemented as a class:

- **Render Method**: Each component has a `render()` method that returns HTML string
- **Event Listeners**: Components have `attachEventListeners()` method for DOM interactions
- **State Management**: Component state is managed within class properties

### State Management

- **Global State**: Managed by the main `SkillSlateApp` class
- **Component State**: Each component manages its own internal state
- **Navigation**: Handled through the main app's `handleNavigate()` method

### Styling

- **Tailwind CSS**: Utility-first CSS framework for rapid UI development
- **Custom Styles**: Additional custom styles in `styles.css`
- **Responsive Design**: Mobile-first approach with responsive breakpoints

## Key Components

### SkillSlateApp

Main application class that manages routing, state, and component lifecycle.

### Header

Navigation component with user menu, mobile responsiveness, and authentication state.

### LandingPage

Homepage with hero section, features grid, and call-to-action sections.

### AuthPage

Authentication component supporting both login and signup modes with form validation.

### Dashboard

User dashboard showing portfolios, quick actions, GitHub integration, and usage statistics.

### CreatePortfolio

Multi-step portfolio creation workflow:

1. Input (prompt or resume upload)
2. Template selection
3. Preview
4. Deployment

### TemplatesPage

Template gallery with filtering by category and template previews.

## API Integration

The frontend is designed to work with the Flask backend API:

- **Base URL**: `http://localhost:8000` (configurable)
- **Endpoints**:
  - `GET /templates` - List available templates
  - `POST /generate` - Generate portfolio from data
  - `POST /preview` - Preview portfolio without saving
  - `GET /download-html` - Download generated HTML

## Customization

### Adding New Templates

1. Add template data to `src/data/templates.js`
2. Update template rendering in components
3. Add any custom styles if needed

### Styling Changes

- Modify `src/styles.css` for global styles
- Update `tailwind.config.js` for Tailwind customization
- Component-specific styles can be added inline or through CSS classes

### Adding New Pages

1. Create new component class in `src/components/`
2. Implement `render()` and `attachEventListeners()` methods
3. Add route handling in `src/app.js`
4. Update navigation in header component

## Browser Support

- Chrome 60+
- Firefox 60+
- Safari 12+
- Edge 79+

## Performance

- **No Framework Overhead**: Pure JavaScript for optimal performance
- **Vite Build Tool**: Fast development and optimized production builds
- **Lazy Loading**: Components loaded on-demand
- **Minimal Dependencies**: Only essential packages included

## Development Notes

- Uses ES6 modules for clean code organization
- Event delegation for efficient DOM manipulation
- Component lifecycle managed manually for simplicity
- State updates trigger re-renders of affected components

## Comparison with React Version

| Feature           | React Version      | JavaScript Version |
| ----------------- | ------------------ | ------------------ |
| Framework         | React + TypeScript | Pure JavaScript    |
| Bundle Size       | ~200KB             | ~50KB              |
| Learning Curve    | Moderate           | Low                |
| Development Speed | Fast               | Very Fast          |
| Type Safety       | Full               | Manual             |
| Ecosystem         | Rich               | Native Web APIs    |

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see main project LICENSE file for details.
