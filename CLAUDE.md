# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**AsianLeKDS** is a Kitchen Display System (KDS) with two tabs:
- **Dine In** — for servers to track food delivery and table completion. Syncs item completion state to Firestore.
- **Orders** — for cooks to see all orders (dine-in + take-out). All completion state is local only (AsyncStorage), no Firestore writes.

Both tabs connect to Firestore via `onSnapshot` and render a horizontal scrollable queue of order cards.

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
- **AsyncStorage** (`@react-native-async-storage/async-storage`) for Orders tab completion persistence
- **TypeScript** (strict mode, `@/*` path alias resolves to repo root)

## File layout

```
app/
  _layout.tsx              # expo-router root layout — auth redirects, keep-awake, 5-min reload
  login.tsx                # login screen
  (tabs)/
    _layout.tsx            # tab navigator (Dine In + Orders)
    index.tsx              # Dine In screen
    orders.tsx             # Orders screen
components/kds/
  KDSHeader.tsx            # title bar with tab title, active/done counts, sign out
  OrderCard.tsx            # single order card (header, item list, progress, complete button)
  OrderItemRow.tsx         # individual item row with checkbox toggle
  QueueDivider.tsx         # thin vertical separator between active and completed sections
hooks/
  useKDSOrders.ts          # all KDS state — Firestore subscription, toggle, complete, AsyncStorage
services/firebase/
  config.ts                # Firebase app + Firestore db init
  auth.ts                  # login / logout
  orders.ts                # subscribeToActiveDineInOrders, subscribeToActiveAllOrders, updateOrderItems, collectionForOrder
types/
  types.ts                 # shared domain types (OrderItem, DineInOrder, TakeOutOrder, KitchenType, …)
utils/
  helper.ts                # takeoutFulfillmentIsScheduled, formatPhone
  groupOrderItems.ts       # groupOrderItemsBySignature — merges duplicate lines, sums qty
  preprocessOrderItems.ts  # preprocessOrderItems — embeds option abbreviations into name
  orderItemSections.ts     # dineInItemSortTier, kitchenTypeSortRank, groupOrderItemsByDisplaySection
```

## Architecture

### Tabs

Two independent tab screens, each with its own `useKDSOrders` instance:

| | Dine In | Orders |
|---|---|---|
| Subscribe fn | `subscribeToActiveDineInOrders` | `subscribeToActiveAllOrders` |
| Collections | `dineInOrders` | `dineInOrders` + `takeOutOrders` |
| Firestore writes | Yes (toggles + complete) | No (`localOnly = true`) |
| AsyncStorage | No | Yes (`kds_completed_orders`) |
| Item toggles | Enabled | Enabled (local only) |
| Dine-in item toggles | N/A | Disabled (`disableItemToggle`) |
| Completion persistence | Firestore | AsyncStorage |

### State model (`hooks/useKDSOrders.ts`)

```typescript
useKDSOrders(
  subscribe: (onChange: OrderChangeHandler) => () => void,
  storageKey?: string,   // omit for Dine In (no AsyncStorage needed)
  localOnly = false,     // true for Orders tab — skips all Firestore writes
)
```

- `activeOrders` / `completedOrders` derived by filtering `kdsOrders`, sorted by `createdAt asc`.
- Max **3 completed** orders kept; oldest dropped when a 4th completes (enforced in `completeOrder`).
- `storageKey` provided → AsyncStorage loaded before Firestore subscription starts (avoids race).
- `"modified"` events preserve local completion state if the order is in `completedIds` (prevents Firestore updates from un-completing a locally completed order on the Orders tab).

### Completion logic

- **Auto-complete**: `OrderCard` `useEffect` on `allDone` — fires `onComplete()` when every item is checked.
- **Manual complete**: "Complete order" button visible on all active orders.
- **AsyncStorage sync**:
  - `completeOrder` always saves to AsyncStorage before the early-return guard, so both the button path and the checkbox path persist correctly.
  - `toggleItem` removes the order ID from AsyncStorage when unchecking any item.
  - `"removed"` handler deletes the ID from AsyncStorage on Firestore cleanup.

### Firestore listeners (`services/firebase/orders.ts`)

- `subscribeToActiveDineInOrders` — listens to `dineInOrders` where `status == "InProgress"`, ordered by `createdAt asc`.
- `subscribeToActiveAllOrders` — two parallel listeners (`dineInOrders` + `takeOutOrders`), same filter. Returns a single unsubscribe that tears down both.
- `collectionForOrder(order)` — derives the Firestore collection name from `order.orderType`.
- `updateOrderItems(orderId, items, collectionName)` — writes item completion state back to Firestore (Dine In tab only).

> **Note**: `where("status") + orderBy("createdAt")` requires a composite Firestore index on both collections.

### Order types (`types/types.ts`)

- `DineInOrder` — extends `Order` with `tableNumber: string`, `guests: number`.
- `TakeOutOrder` — extends `Order` with `customerName?: string`, `phoneNumber?: string`, `fulfillment: TakeOutFulfillment`.
- `TakeOutFulfillment` — union: `{ kind: "immediate"; readyTimeMinutes?: number }` | `{ kind: "scheduled"; scheduledAt: Timestamp }`.
- `takeoutFulfillmentIsScheduled(order)` in `utils/helper.ts` — returns true for scheduled take-out (pre-orders).

### OrderCard display

Card background colors: white (dine-in), `bg-blue-100` (take-out), `bg-orange-100` (pre-order).

Header (centered label + left-aligned details):
- **Dine In**: `Table {N}` → guests + time row → staff row
- **Take Out**: `Take Out` → name + phone row → staff + time row
- **Pre-Order**: `Pre-Order` + scheduled time → name + phone row → staff + time row

Items sorted into three tiers (Appetizers → For Table → To Go), then by kitchen type within each tier. Tier badges: amber (Appetizers), slate (For Table), teal (To Go) — all with white text.

Footer: progress bar (`doneCount/total`) + "Complete order" button (hidden on completed orders).

Drinks (`KitchenType.Drink`) are filtered out of the display on both tabs.

### Item processing pipeline

When an order is added or modified, items go through:
1. Filter out drinks (`KitchenType.Drink`)
2. `preprocessOrderItems` — embeds option abbreviations into the name (e.g. `#3/ER/Rice`)

### Auto-reload

`app/_layout.tsx` reloads the app (`Updates.reloadAsync`) after **5 minutes** in the background. AsyncStorage survives the reload so the Orders tab restores completed state correctly.

### Styling rules

- Use `className` for all styles (NativeWind).
- **Exception**: dynamic/runtime values (e.g. progress bar width `${pct}%`) must use the inline `style` prop — NativeWind cannot interpolate runtime values in class strings.
- The horizontal queue `ScrollView` uses `horizontal`; each card uses `flexShrink: 0`. Item lists inside cards use a nested `ScrollView` with `nestedScrollEnabled`.
