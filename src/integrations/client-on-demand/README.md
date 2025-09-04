# Custom `client:on-demand` Directive

A reusable Astro client directive that enables true lazy loading of React components based on custom events.

## Features

- **Configurable Event Names**: Specify which events trigger hydration
- **Multiple Event Support**: Listen to multiple events with comma separation
- **Modern Browser APIs**: Uses `requestAnimationFrame` double-RAF pattern
- **Auto-Trigger**: Automatically triggers the primary event after hydration
- **Error Handling**: Robust error recovery with state reset
- **Memory Efficient**: Proper cleanup with event listener removal

## Usage Examples

### Basic Usage

```astro
<!-- Hydrates when "toggle-chat" event is dispatched -->
<ChatWidget client:on-demand="toggle-chat" />

<!-- Hydrates when "play-video" event is dispatched -->
<VideoPlayer client:on-demand="play-video" />

<!-- Hydrates when "open-gallery" event is dispatched -->
<ImageGallery client:on-demand="open-gallery" />
```

### Multiple Event Triggers

```astro
<!-- Hydrates on any of these events -->
<ComplexWidget client:on-demand="activate,show,toggle" />
```

### Default Event

```astro
<!-- Uses default "activate" event if no parameter provided -->
<SomeComponent client:on-demand />
```

## How It Works

1. **Initial State**: Component is in DOM but not hydrated (no JavaScript loaded)
2. **Event Trigger**: When specified event is dispatched, directive calls Astro's `load()` function
3. **Hydration**: Astro loads and hydrates the React component
4. **Render Wait**: Uses modern `requestAnimationFrame` double-RAF to wait for render completion
5. **Auto-Trigger**: Dispatches the primary event to trigger component behavior
6. **Subsequent Events**: Component is hydrated and handles events directly

## Implementation Details

- **Event Parsing**: Supports comma-separated event names
- **Fallback**: Uses "activate" as default event name
- **Modern Timing**: `requestAnimationFrame` double-RAF pattern for optimal performance
- **Cross-Browser**: Compatible with all modern browsers including Safari
- **TypeScript**: Full type safety with configurable string parameter

## Example Integration

```javascript
// Button that triggers lazy loading
document.getElementById("my-button").addEventListener("click", () => {
  window.dispatchEvent(new CustomEvent("my-custom-event"));
});
```

```astro
<!-- Component that loads on button click -->
<MyComponent client:on-demand="my-custom-event" />
```

This directive provides the most efficient way to implement lazy loading for resource-intensive React components in Astro applications.
