# Sweeper Vector UI Design System

A comprehensive, cohesive design system for the Sweeper cleaning platform, built on top of Tailwind CSS with custom vector-optimized components.

## Overview

The Vector UI Design System provides a unified, modern styling foundation with:
- **Consistent visual language** across all components
- **Vector-optimized styling** for crisp, clean interfaces
- **Comprehensive accessibility** features
- **Smooth animations** and micro-interactions
- **Responsive design** patterns

## Architecture

### File Structure
```
src/styles/
├── design-system.css    # Main design system file
└── globals.css         # Legacy styles (deprecated)

src/index.css           # Entry point with legacy compatibility
```

### Import Order
```css
/* In src/index.css */
@import './styles/design-system.css';

/* Legacy compatibility classes */
.btn-primary { @apply btn btn-primary; }
```

## Design Tokens

### Color Palette
The system uses a comprehensive color scale with consistent naming:

```css
/* Primary Colors */
--primary-50 to --primary-900

/* Emerald Colors */
--emerald-50 to --emerald-900

/* Purple Colors */
--purple-50 to --purple-900

/* Gray Colors */
--gray-50 to --gray-900

/* Semantic Colors */
--success: #10b981
--warning: #f59e0b
--error: #ef4444
--info: #3b82f6
```

### Typography Scale
```css
--text-xs: 0.75rem    /* 12px */
--text-sm: 0.875rem   /* 14px */
--text-base: 1rem     /* 16px */
--text-lg: 1.125rem   /* 18px */
--text-xl: 1.25rem    /* 20px */
--text-2xl: 1.5rem    /* 24px */
--text-3xl: 1.875rem  /* 30px */
--text-4xl: 2.25rem   /* 36px */
--text-5xl: 3rem      /* 48px */
--text-6xl: 3.75rem   /* 60px */
--text-7xl: 4.5rem    /* 72px */
```

### Spacing Scale
```css
--space-1: 0.25rem    /* 4px */
--space-2: 0.5rem     /* 8px */
--space-3: 0.75rem    /* 12px */
--space-4: 1rem       /* 16px */
--space-5: 1.25rem    /* 20px */
--space-6: 1.5rem     /* 24px */
--space-8: 2rem       /* 32px */
--space-10: 2.5rem    /* 40px */
--space-12: 3rem      /* 48px */
--space-16: 4rem      /* 64px */
--space-20: 5rem      /* 80px */
--space-24: 6rem      /* 96px */
```

## Component System

### Buttons
The button system provides consistent styling across all button variants:

```html
<!-- Primary Button -->
<button class="btn btn-primary btn-md">Click Me</button>

<!-- Secondary Button -->
<button class="btn btn-secondary btn-md">Secondary</button>

<!-- Ghost Button -->
<button class="btn btn-ghost btn-sm">Ghost</button>
```

**Available Variants:**
- `.btn-primary` - Main action buttons
- `.btn-secondary` - Secondary actions
- `.btn-ghost` - Subtle actions

**Available Sizes:**
- `.btn-xs` - Extra small (32px min-height)
- `.btn-sm` - Small (36px min-height)
- `.btn-md` - Medium (44px min-height) - Default
- `.btn-lg` - Large (48px min-height)
- `.btn-xl` - Extra large (56px min-height)

### Cards
Card components provide content containers with elevation:

```html
<!-- Basic Card -->
<div class="card p-6">Content</div>

<!-- Elevated Card -->
<div class="card-elevated p-6">Content with shadow</div>

<!-- Interactive Card -->
<div class="card-interactive p-6">Clickable card</div>
```

### Icons
Consistent icon sizing system:

```html
<svg class="icon icon-md">...</svg>
<svg class="icon icon-lg icon-interactive">...</svg>
<svg class="icon icon-sm icon-bounce">...</svg>
```

**Available Sizes:**
- `.icon-xs` - 12px (0.75rem)
- `.icon-sm` - 16px (1rem)
- `.icon-md` - 20px (1.25rem)
- `.icon-lg` - 24px (1.5rem)
- `.icon-xl` - 32px (2rem)
- `.icon-2xl` - 40px (2.5rem)

**Interactive Effects:**
- `.icon-interactive` - Scale on hover
- `.icon-bounce` - Bounce animation on hover

### Form Elements
Unified form styling:

```html
<input type="text" class="input" placeholder="Enter text">
<textarea class="input" rows="4"></textarea>
```

### Badges
Status and label components:

```html
<span class="badge badge-primary">Primary</span>
<span class="badge badge-success">Success</span>
<span class="badge badge-warning">Warning</span>
<span class="badge badge-error">Error</span>
```

## Effects System

### Glass Morphism
```html
<div class="glass p-6">Glass effect</div>
<div class="glass-dark p-6">Dark glass effect</div>
```

### Gradients
```css
.gradient-primary { /* Primary brand gradient */ }
.gradient-secondary { /* Secondary gradient */ }
.gradient-accent { /* Accent gradient */ }
.gradient-text { /* Text gradient effect */ }
.gradient-text-accent { /* Accent text gradient */ }
```

### Animations
```css
.animate-fade-in { /* Fade in from bottom */ }
.animate-slide-up { /* Slide up animation */ }
.animate-scale-in { /* Scale in animation */ }
.animate-bounce-subtle { /* Subtle bounce */ }
.animate-float { /* Floating animation */ }
.animate-glow { /* Glow effect */ }
```

## Usage Guidelines

### Using the Button Component
```tsx
import { Button } from '../ui/Button'

// React component usage
<Button variant="primary" size="lg" glow>
  Primary Action
</Button>

// Class-based usage
<button className="btn btn-primary btn-lg animate-glow">
  Primary Action
</button>
```

### Creating New Components
When creating new components, follow these patterns:

1. **Use design tokens** instead of hardcoded values
2. **Follow naming conventions** (component-variant-size)
3. **Include hover states** and transitions
4. **Add accessibility features** (focus states, ARIA labels)
5. **Support responsive design** with mobile-first approach

### Example Component
```tsx
function CustomCard({ children, elevated = false }) {
  return (
    <div className={`card${elevated ? '-elevated' : ''} p-6`}>
      {children}
    </div>
  )
}
```

## Accessibility Features

- **Focus Management**: All interactive elements have visible focus states
- **Color Contrast**: All color combinations meet WCAG AA standards
- **Reduced Motion**: Respects `prefers-reduced-motion` setting
- **Touch Targets**: Minimum 44px touch targets on mobile
- **Screen Reader**: Proper semantic markup and ARIA labels

## Performance Optimizations

- **Hardware Acceleration**: Uses `transform: translateZ(0)` for smooth animations
- **Efficient Transitions**: Optimized easing functions for natural feel
- **Minimal Repaints**: Transforms instead of layout changes
- **Progressive Enhancement**: Works without JavaScript

## Browser Support

- **Modern Browsers**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Mobile**: iOS Safari 14+, Chrome Mobile 90+
- **Fallbacks**: Graceful degradation for older browsers

## Migration Guide

### From Old System
Replace old classes with new equivalents:

```css
/* Old */
.btn-primary { /* custom styles */ }

/* New */
.btn.btn-primary { /* design system */ }
```

### Component Updates
Update components to use the new Button component:

```tsx
// Old
<button className="btn-primary">Click</button>

// New
<Button variant="primary">Click</Button>
```

## Contributing

When adding new components or modifying existing ones:

1. **Follow the design tokens** - Use CSS custom properties
2. **Add hover/focus states** - Ensure interactive feedback
3. **Include documentation** - Update this guide
4. **Test accessibility** - Verify keyboard navigation and screen readers
5. **Test responsive design** - Ensure mobile compatibility

## Future Enhancements

- Dark mode support (tokens already defined)
- Additional animation presets
- Extended color palette for specialized use cases
- Component-specific design tokens
- Advanced layout utilities