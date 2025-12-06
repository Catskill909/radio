# Accessibility Features

StationDock is built with accessibility in mind, ensuring that the public Listen page is usable by everyone, including users who rely on keyboards and screen readers.

## Keyboard Navigation

**Full keyboard support for all interactive elements:**

- **Tab** - Move between buttons, tabs, and controls
- **Enter/Space** - Activate buttons and toggles
- **Escape** - Close modals and menus
- **Arrow Keys** - Navigate within tab groups

All focusable elements display visible focus rings when keyboard navigating.

## Screen Reader Support

- **Play/Pause buttons** announce their current state ("Play" or "Pause")
- **Day tabs** include full date descriptions (e.g., "Friday, December 6")
- **Modals** announce their titles when opened
- **Close buttons** are properly labeled

## Focus Management

When modals open:
1. Focus moves inside the modal
2. Tab only cycles within the modal (focus trap)
3. Escape key closes the modal
4. Focus returns to the element that opened the modal

## Technical Details

- Built with [Radix UI](https://www.radix-ui.com/) accessible primitives
- Continuously monitored with `eslint-plugin-jsx-a11y` linting
- Follows WCAG accessibility guidelines

## Tips for Testing

1. **Keyboard Test**: Navigate the Listen page using only Tab and Enter
2. **Screen Reader**: On macOS, press Cmd+F5 to enable VoiceOver
3. **Focus Visibility**: Verify you can always see which element is focused
