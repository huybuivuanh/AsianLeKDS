# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**AsianLeKDS** is a Kitchen Display System (KDS) for dine-in orders. It connects to a shared Firestore database via `onSnapshot`, renders a horizontal scrollable queue of order cards, and tracks item/order completion locally — no writes back to Firestore.

## Commands

```bash
npx expo start          # start dev server (scan QR for device)
npx expo start --android
npx expo start --ios
npx expo start --web
```

There are no test or lint scripts configured yet.

## Stack

- **Expo** ~54 with **expo-router** ~6 (file-based routing under `app/`)
- **React Native** 0.81 + **React** 19
- **NativeWind** v4 + **Tailwind CSS** v3 for styling (`className` prop)
- **Firebase JS SDK** (`firebase/firestore`) for Firestore real-time listener
- **TypeScript** (strict mode, `@/*` path alias resolves to repo root)

## Architecture

### Planned file layout (from KDS_INSTRUCTION.md)

```
app/
  kds.tsx                  # KDSScreen — Firestore listener + state root
components/kds/
  KDSHeader.tsx            # title bar with live clock and active/done counts
  OrderCard.tsx            # single order card (header, item list, progress, complete button)
  OrderItemRow.tsx         # individual item row with checkbox toggle
  QueueDivider.tsx         # thin vertical separator between active and completed sections
types/
  kds.ts                   # KDSOrderItem, KDSOrder (local-only types, extend global types)
lib/
  firebase.ts              # Firebase app + Firestore db init (imported as @/lib/firebase)
```

### State model

All state lives in `KDSScreen` (or a context). A single `useState<KDSOrder[]>` holds every order. Completion state is **local only** — nothing is written to Firestore.

- `activeOrders` / `completedOrders` are derived by filtering `kdsOrders` — not stored separately.
- Max **3 completed** orders are kept; the oldest is dropped when a 4th is completed.
- Firestore `removed` events auto-mark the order as completed locally (POS closed it).

### Firestore listener

Listens to `orders` collection filtered by `orderType == "DineIn"` and `status == "active"`, ordered by `createdAt asc`. Uses `docChanges()` so only deltas are processed. On `added`, guards against duplicates. On `removed`, marks completed locally.

### Styling rules

- Use `className` for all styles (NativeWind).
- **Exception**: dynamic/runtime values (e.g. progress bar width `${pct}%`) must use the inline `style` prop — NativeWind cannot interpolate runtime values in class strings.
- The horizontal queue `ScrollView` uses `horizontal`; each card uses `flexShrink: 0`. Item lists inside cards use a nested `ScrollView` with `nestedScrollEnabled`.

### Timer

Elapsed time is tracked with a local `startTimes` record (`Record<string, number>`) keyed by order ID. A 1-second `setInterval` drives re-renders. Color thresholds: green < 5 min, amber 5–10 min, red > 10 min.
