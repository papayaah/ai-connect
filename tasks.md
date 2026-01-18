# Implementation Plan

- [ ] 1. Install Vercel AI SDK dependencies
  - Add Vercel AI SDK and provider packages to support unified LLM interface
  - _Requirements: 6.1, 6.8_

- [ ] 1.1 Install core AI SDK packages
  - Install `ai`, `@ai-sdk/openai`, `@ai-sdk/anthropic`, `@ai-sdk/google`, `@ai-sdk/cohere`, `@ai-sdk/mistral`
  - Update package.json with required dependencies
  - _Requirements: 6.1_

- [ ] 2. Create provider configuration system
  - Build infrastructure for managing multiple LLM providers with unified interface
  - _Requirements: 2.6, 2.7, 6.1, 6.7_

- [ ] 2.1 Create provider registry and configurations
  - Create `src/lib/providers/index.ts` with supported provider definitions
  - Create individual provider config files (`openai.ts`, `anthropic.ts`, `google.ts`, etc.)
  - Define available models and pricing for each provider
  - _Requirements: 2.6, 3.8_

- [ ] 2.2 Create enhanced AI Settings Service
  - Implement `src/services/aiSettingsService.ts` with multi-provider support
  - Add methods for provider management, API key storage, and model selection
  - Include validation for different provider API key formats
  - _Requirements: 2.7, 2.8, 5.1, 5.2, 5.3_

- [ ] 2.3 Create enhanced Cost Tracking Service
  - Implement `src/services/costTrackingService.ts` with per-provider cost tracking
  - Include pricing models for all supported providers
  - Add methods for provider-specific usage statistics and cost calculation
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.7_

- [ ] 3. Refactor AI service to use Vercel AI SDK
  - Replace existing AI service with unified Vercel AI SDK implementation
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.8_

- [ ] 3.1 Create unified AI service with Vercel AI SDK
  - Refactor `src/lib/ai-service.ts` to use Vercel AI SDK for all custom providers
  - Maintain Chrome AI and Shared Gemini support alongside new providers
  - Implement consistent symptom analysis across all providers
  - _Requirements: 6.1, 6.4, 6.5, 6.8_

- [ ] 3.2 Implement provider initialization and switching
  - Add logic to initialize appropriate provider based on settings
  - Support dynamic provider switching with proper cleanup
  - Handle provider-specific configuration and model selection
  - _Requirements: 6.2, 6.7_

- [ ] 3.3 Add token usage tracking and cost reporting
  - Extract token usage from Vercel AI SDK responses
  - Report usage to cost tracking service for all custom providers
  - Maintain existing rate limiting for shared Gemini API
  - _Requirements: 3.2, 3.4_

- [ ] 3.4 Implement unified error handling
  - Add error handling that distinguishes between different provider errors
  - Provide clear, actionable error messages for each provider type
  - Handle network errors, authentication failures, and rate limits
  - _Requirements: 6.6_

- [ ] 4. Update setup page for multi-provider support
  - Enhance setup page to support multiple LLM providers with unified interface
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.9_

- [ ] 4.1 Update setup page UI for multiple providers
  - Modify `src/app/setup/page.tsx` to display Chrome AI, Shared Gemini, and Custom LLM options
  - Add provider selection dropdown for custom LLM option
  - Show available models for selected provider
  - _Requirements: 2.1, 2.2, 2.6_

- [ ] 4.2 Implement Chrome AI selection flow
  - Add selection handler for Chrome AI option with browser compatibility check
  - Show setup instructions if Chrome AI not available
  - _Requirements: 2.3, 2.4_

- [ ] 4.3 Implement Shared Gemini API selection flow
  - Add selection handler for Shared Gemini API with usage limit display
  - Show daily limit information (10 requests/day)
  - _Requirements: 2.5_

- [ ] 4.4 Implement Custom LLM Provider selection flow
  - Add provider dropdown with OpenAI, Anthropic, Google, Cohere, Mistral options
  - Show model selection dropdown based on chosen provider
  - Add API key input field with provider-specific validation
  - Show cost tracking notice with provider-specific pricing
  - _Requirements: 2.6, 2.7_

- [ ] 4.5 Implement provider validation and save
  - Test API key connectivity using Vercel AI SDK before saving
  - Save provider configuration to aiSettingsService
  - Initialize AI service with selected provider
  - _Requirements: 2.8, 2.9_

- [ ] 5. Create comprehensive settings page
  - Build settings page for managing AI providers and viewing usage statistics
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

- [ ] 5.1 Create settings page component
  - Create `src/app/settings/page.tsx` with current provider display
  - Show provider change interface with all supported options
  - Add navigation link back to symptom tracker
  - _Requirements: 4.1, 4.2, 4.6_

- [ ] 5.2 Implement provider management interface
  - Add UI for changing between Chrome AI, Shared Gemini, and Custom LLM providers
  - Support provider-specific configuration (model selection, API key management)
  - Handle provider switching with proper service reinitialization
  - _Requirements: 4.3_

- [ ] 5.3 Add comprehensive usage statistics section
  - Display total usage across all providers and per-provider breakdowns
  - Show API calls, tokens used, estimated costs with provider-specific pricing
  - Only display for users with custom API keys
  - _Requirements: 3.5, 4.4_

- [ ] 5.4 Implement usage statistics management
  - Add reset statistics functionality with per-provider and total reset options
  - Show confirmation dialogs before clearing data
  - _Requirements: 3.6, 4.5_

- [ ] 5.5 Add API key management section
  - Display masked API keys for all configured providers
  - Add update/remove API key functionality per provider
  - Show provider-specific validation feedback
  - _Requirements: 5.4, 5.5_

- [ ] 6. Add settings navigation and rate limiting
  - Complete the user interface and implement shared API protection
  - _Requirements: 2.10, 2.11, 2.12, 4.1_

- [ ] 6.1 Update FloatingNavigation component
  - Add settings icon/link to `src/components/FloatingNavigation/FloatingNavigation.tsx`
  - Link to `/settings` route
  - _Requirements: 4.1_

- [ ] 6.2 Implement rate limiting for shared Gemini API
  - Add client-side rate limiting logic to prevent shared API abuse
  - Track daily request count with 10 requests/day limit
  - Show clear error messages when limit reached with alternative suggestions
  - Auto-reset at midnight UTC
  - _Requirements: 2.10, 2.11, 2.12_

- [ ] 7. Testing and validation
  - Comprehensive testing of multi-provider functionality and user flows
  - _Requirements: All_

- [ ]* 7.1 Test provider switching and validation
  - Test API key validation for all supported providers
  - Verify provider switching works correctly with proper cleanup
  - Test error handling for invalid keys and network issues
  - _Requirements: 2.8, 6.6_

- [ ]* 7.2 Test cost tracking accuracy
  - Verify cost calculations for different providers and models
  - Test usage statistics display and reset functionality
  - Validate per-provider cost breakdowns
  - _Requirements: 3.1, 3.2, 3.3, 3.7_

- [ ]* 7.3 Test complete user flows
  - Test setup flow with different provider selections
  - Verify settings page functionality and navigation
  - Test rate limiting and error scenarios
  - Ensure responsive design and consistent styling
  - _Requirements: All_