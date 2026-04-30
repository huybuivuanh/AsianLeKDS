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

## Actual file layout

```
app/
  index.tsx                # KDSScreen — renders the queue, consumes useKDSOrders
  login.tsx                # login screen
  _layout.tsx              # expo-router root layout
components/kds/
  KDSHeader.tsx            # title bar with live clock and active/done counts
  OrderCard.tsx            # single order card (header, item list, progress, complete button)
  OrderItemRow.tsx         # individual item row with checkbox toggle
  QueueDivider.tsx         # thin vertical separator between active and completed sections
hooks/
  useKDSOrders.ts          # all KDS state — Firestore subscription, toggle, complete
services/firebase/
  config.ts                # Firebase app + Firestore db init
  auth.ts                  # login / logout
  orders.ts                # subscribeToActiveDineInOrders (onSnapshot wrapper)
types/
  kds.ts                   # KDSOrderItem, KDSOrder (local-only types)
  types.ts                 # shared domain types (OrderItem, DineInOrder, KitchenType, …)
utils/
  groupOrderItems.ts       # groupOrderItemsBySignature — merges duplicate lines, sums qty
  preprocessOrderItems.ts  # preprocessOrderItems — embeds option abbreviations into name
  orderItemSections.ts     # dineInItemSortTier, kitchenTypeSortRank, groupOrderItemsByDisplaySection
```

## Architecture

### State model (`hooks/useKDSOrders.ts`)

All KDS state lives in `useKDSOrders`. A single `useState<KDSOrder[]>` holds every order. Completion state is **local only** — nothing is written to Firestore.

- `activeOrders` / `completedOrders` are derived by filtering `kdsOrders`.
- Max **3 completed** orders are kept; the oldest is dropped when a 4th is completed. This cap is enforced in both `completeOrder` and the `"removed"` handler.
- Firestore `"removed"` events auto-mark the matching active order as completed locally (POS closed it).
- Firestore `"modified"` events update items and order metadata while preserving local `completed` state per item (matched by `item.id`).

### Item processing pipeline

When an order is added or modified, items go through this pipeline before entering state:

1. `groupOrderItemsBySignature(order.orderItems)` — merges lines with identical signatures, summing quantities.
2. `preprocessOrderItems(grouped)` — embeds option abbreviations into the name (e.g. `#3/ER/Rice`). Does **not** add a quantity prefix — quantity is rendered separately in `OrderItemRow`.
3. `.map(item => ({ ...item, completed: false }))` — adds local completion flag.

### Completion logic

- **Auto-complete**: `OrderCard` has a `useEffect` on `allDone` — when every item is checked on an active order, `onComplete()` fires automatically.
- **Manual complete**: "Complete order" button is always visible and pressable on active orders.
- **Uncomplete**: Items can be toggled on completed orders. Unchecking any item reverts the order to `"active"` (and clears `completedAt`). Re-checking all items does not auto-complete a second time.

### Firestore listener (`services/firebase/orders.ts`)

Listens to `dineInOrders` collection filtered by `status == "InProgress"`, ordered by `createdAt asc`. Uses `docChanges()` so only deltas are processed.

> **Note**: `where("status") + orderBy("createdAt")` requires a composite Firestore index. If missing, Firestore logs a URL in the console to create it.

### OrderCard display

Header row: `Table: {tableNumber}` — `{createdAt time}` — `{staff badge}`.  
Items are sorted into three tiers (Appetizers → For Table → To Go), then by kitchen type within each tier (`dineInItemSortTier` / `kitchenTypeSortRank` from `orderItemSections.ts`).  
Footer: progress bar (`doneCount/total`) + "Complete order" button (hidden on completed orders).

### Timer

Elapsed time is tracked with a local `startTimes` record (`Record<string, number>`) keyed by order ID. A 1-second `setInterval` in `OrderCard` drives re-renders for active orders only. The elapsed value is used for internal logic but **not** displayed — the card header shows `order.createdAt` formatted as a wall-clock time instead.

### Styling rules

- Use `className` for all styles (NativeWind).
- **Exception**: dynamic/runtime values (e.g. progress bar width `${pct}%`) must use the inline `style` prop — NativeWind cannot interpolate runtime values in class strings.
- The horizontal queue `ScrollView` uses `horizontal`; each card uses `flexShrink: 0`. Item lists inside cards use a nested `ScrollView` with `nestedScrollEnabled`.
