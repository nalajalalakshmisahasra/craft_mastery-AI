# Product

<!-- impeccable:product-schema 1 -->

## Platform

adaptive
Expo React Native mobile application (iOS and Android)

## Users

- **Primary:** Indian local and rural artisans and craftspersons with varying technical and written literacy who create handmade crafts and need frictionless voice-first guided onboarding, product creation, fair pricing, and order management.
- **Secondary:** Buyers and cultural connoisseurs interested in discovering authentic regional handicrafts with direct, transparent cross-lingual communication and guided commerce.

## Product Purpose

Craft Mastery is an Expo React Native mobile application designed to bridge the digital commerce divide for Indian artisans. It removes technological, linguistic, and literacy barriers through voice-first mobile workflows, 13-language translation, AI photo enhancement, algorithmic fair pricing intelligence, and guided marketplace communication.

## Positioning

A voice-first, mobile-native artisan commerce platform built for smartphones across 13 Indian regional languages. Unlike desktop-oriented or form-heavy marketplaces, Craft Mastery turns casual spoken native-tongue descriptions and phone photos into studio-grade listings with transparent pricing rationale and automated real-time cross-language negotiation chat on physical handheld devices.

## Operating Context

- **Physical Environment:** Rural craft workshops, outdoor stalls, looms, home potteries; handheld mobile phones (iOS and Android, including lower-end and mid-tier devices), ambient noise, bright sunlight.
- **Core Mobile Workflows:** Voice-first guided listing creation wizard, mobile camera photo capture, AI image enhancement, voice attribute extraction, fair price recommendation, marketplace discovery, and cross-lingual inquiry messaging.
- **Input Modalities:** Native touch (`Pressable` with tactile feedback), voice recording / speech recognition, camera / image picker, and native gesture navigation.

## Capabilities and Constraints

- **Preserved Backend & Application Architecture:**
  - Existing backend, APIs, Express services, and Firebase integration must be preserved.
  - Gemini/AI services (`@google/genai`), Cloudinary, authentication, and database behavior must be preserved.
  - Product CRUD, marketplace functionality, inquiries, notifications, admin features, and multilingual support across 13 Indian languages (`te`, `hi`, `en`, `ta`, `kn`, `mr`, `bn`, `ml`, `gu`, `pa`, `or`, `as`, `ur`) must remain intact.
  - Voice functionality and existing business logic must not be rewritten.
- **Expo React Native Technical UI/UX Rules:**
  - **No Web Assumptions:** Do NOT assume HTML, CSS, Tailwind CSS, browser DOM APIs, web hover states, desktop web layouts, GSAP / web-only animation libraries, or web-specific accessibility patterns.
  - **Native Primitives & Patterns:** Use React Native components (`View`, `Text`, `Pressable`, `ScrollView`, `FlatList`, `Image`, etc.), `StyleSheet` or the project's mobile styling approach, and established mobile navigation patterns.
  - **Touch & Hardware First:** Minimum 44×44 pt (iOS) / 48×48 dp (Android) touch targets with proper spacing, safe-area inset awareness, and native keyboard handling.
  - **Native-Safe Motion & Performance:** Native-safe animations, performant image handling, and lightweight layouts suitable for real phones and resource-constrained devices.
  - **Native Accessibility:** Native accessibility props (`accessibilityLabel`, `accessibilityRole`, `accessibilityState`, `accessibilityHint`).

## Brand Commitments

- **Name:** Craft Mastery
- **Tone & Voice:** Empowering, respectful, culturally authentic, transparent, and encouraging.
- **Core Ethos:** Honoring artisan heritage, preserving craft traditions, and ensuring fair economic compensation for handmade labor.

## Evidence on Hand

- Existing application codebase with domain models, types, and backend services.
- Curated regional craft datasets and starter products in `data/` and `src/data/`.
- 13-language localized dictionaries and speech configurations in `src/i18n/`.
- Server-side Gemini API prompts and endpoints in `server.ts`.

## Product Principles

1. **Mobile-First Artisan Ergonomics:** Single-hand thumb reach, large touch targets, safe areas, and high legibility tailored for physical mobile devices in workshop settings.
2. **Zero-Barrier Voice & Visual Guidance:** Spoken native language and camera capture replace typed forms and complex digital jargon.
3. **Dignity in Fair Value:** Algorithmic pricing recommendations transparently explain material and labor costs, protecting artisans from exploitation.
4. **Seamless Cross-Lingual Communication:** Real-time bidirectional translation connects buyers and artisans across 13 regional languages without friction.
5. **Native Reliability on Real Devices:** Fast, battery-conscious, performant layouts that run smoothly on entry-level Android devices and iPhones alike.

## Accessibility & Inclusion

- Native speech-to-text and audio feedback for low-literacy users.
- Large touch targets (minimum 48dp on Android, 44pt on iOS) with ample separation.
- High-contrast visual cues and legible typography resilient to glare in outdoor craft settings.
- Dynamic Type / system font scaling support with localized script rendering (Devanagari, Telugu, Tamil, Bengali, etc.).
