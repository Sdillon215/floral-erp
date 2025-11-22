# Phase 1 Testing Checklist

## Authentication Flow
- [ ] Login with valid credentials - should redirect to home
- [ ] Login with invalid credentials - should show error toast and form error
- [ ] Access protected route without login - should redirect to login
- [ ] Logout button works - should clear session and redirect to login
- [ ] Token persists on page refresh - should stay logged in
- [ ] Invalid/expired token - should redirect to login

## Navigation & Layout
- [ ] Sidebar shows correct menu items for admin role
- [ ] Sidebar shows correct menu items for sales role
- [ ] Sidebar shows correct menu items for buyer role
- [ ] Sidebar shows correct menu items for picker_packer role
- [ ] Active route is highlighted in sidebar
- [ ] Navigation links work (even if pages don't exist yet)
- [ ] Header displays user email and role correctly
- [ ] Layout is responsive (test on different screen sizes)

## Error Handling
- [ ] Toast notifications appear on login success
- [ ] Toast notifications appear on login error
- [ ] Toasts auto-dismiss after a few seconds
- [ ] Toasts can be manually closed
- [ ] Error boundary catches React errors (if any occur)

## Loading States
- [ ] Loading spinner shows during login
- [ ] Button is disabled during login submission
- [ ] Protected routes show loading while checking auth

## Code Quality
- [ ] No TypeScript errors
- [ ] No ESLint errors
- [ ] No console errors in browser
- [ ] All imports are correct
- [ ] No unused variables or imports

## Browser Compatibility
- [ ] Works in Chrome
- [ ] Works in Firefox (if available)
- [ ] Works in Edge (if available)

## Responsive Design
- [ ] Layout works on desktop (1920x1080)
- [ ] Layout works on tablet (768px width)
- [ ] Layout works on mobile (375px width)
- [ ] Sidebar is usable on mobile (may need mobile menu later)

