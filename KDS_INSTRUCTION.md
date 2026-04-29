# Kitchen Display System (KDS) — Implementation Instructions

## Overview

Build a real-time Kitchen Display System for dine-in orders only. The app connects to an existing Firestore database via `onSnapshot`, renders a horizontal scrollable queue of order cards, and tracks item/order completion locally (no writes back to Firestore).

---

## Stack

- **Expo** (React Native)
- **NativeWind** v4 for styling
- **Firebase JS SDK** (`firebase/firestore`) for Firestore
- **TypeScript**

---

## Data Types

Use the existing global types as-is. Add these local-only types on top:

```typescript
// types/kds.ts

interface KDSOrderItem extends OrderItem {
  completed: boolean; // local only, never written to Firestore
}

interface KDSOrder {
  order: DineInOrder; // raw Firestore doc (DineIn only)
  items: KDSOrderItem[]; // OrderItem[] with completed flag added
  status: "active" | "completed";
  completedAt?: number; // Date.now() when bumped
}
```

---

## Firestore Query

Listen only to active dine-in orders, sorted oldest-first:

```typescript
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase"; // your existing firebase init

const q = query(
  collection(db, "orders"),
  where("orderType", "==", "DineIn"),
  where("status", "==", "active"),
  orderBy("createdAt", "asc"),
);

const unsub = onSnapshot(q, (snap) => {
  snap.docChanges().forEach((change) => {
    const raw = { id: change.doc.id, ...change.doc.data() } as DineInOrder;

    if (change.type === "added") {
      // Only add if not already tracked locally
      setKdsOrders((prev) => {
        if (prev.find((o) => o.order.id === raw.id)) return prev;
        return [
          ...prev,
          {
            order: raw,
            items: raw.orderItems.map((item) => ({
              ...item,
              completed: false,
            })),
            status: "active",
          },
        ];
      });
    }

    if (change.type === "removed") {
      // Order closed on POS — auto-complete it in the local queue
      setKdsOrders((prev) =>
        prev.map((o) =>
          o.order.id === raw.id && o.status === "active"
            ? { ...o, status: "completed", completedAt: Date.now() }
            : o,
        ),
      );
    }
  });
});

// Cleanup on unmount
return () => unsub();
```

---

## State Management

Manage everything in a single `useState` in the screen component (or a context if you prefer). No Firestore writes at all.

```typescript
const [kdsOrders, setKdsOrders] = useState<KDSOrder[]>([]);
```

**Derived values** (compute from `kdsOrders`, don't store separately):

```typescript
const activeOrders = kdsOrders.filter((o) => o.status === "active");
const completedOrders = kdsOrders.filter((o) => o.status === "completed");
```

---

## Actions

### Toggle item completion

```typescript
const toggleItem = (orderId: string, itemIndex: number) => {
  setKdsOrders((prev) =>
    prev.map((o) => {
      if (o.order.id !== orderId || o.status === "completed") return o;
      const items = o.items.map((item, i) =>
        i === itemIndex ? { ...item, completed: !item.completed } : item,
      );
      return { ...o, items };
    }),
  );
};
```

### Complete a whole order

Keep a maximum of **3** completed orders in the queue. Drop the oldest when a 4th is added.

```typescript
const completeOrder = (orderId: string) => {
  setKdsOrders((prev) => {
    const updated = prev.map((o) =>
      o.order.id === orderId
        ? { ...o, status: "completed" as const, completedAt: Date.now() }
        : o,
    );

    // Enforce max 3 completed — drop the oldest by completedAt
    const completed = updated
      .filter((o) => o.status === "completed")
      .sort((a, b) => (a.completedAt ?? 0) - (b.completedAt ?? 0));

    const toRemove = completed.slice(0, Math.max(0, completed.length - 3));
    const removeIds = new Set(toRemove.map((o) => o.order.id));

    return updated.filter((o) => !removeIds.has(o.order.id ?? ""));
  });
};
```

---

## Screen Structure

```
KDSScreen
├── KDSHeader          — title, active count, done count, live clock
└── ScrollView (horizontal, shows full height)
    ├── OrderCard[]    — active orders, left to right
    ├── QueueDivider   — thin vertical line separator (only if completed orders exist)
    └── OrderCard[]    — completed orders, faded, right side
```

---

## Component Specs

### `KDSScreen`

- Root `View` fills the screen with a dark background (`bg-[#0f1117]`)
- Contains `KDSHeader` and a horizontal `ScrollView`
- Runs the Firestore listener in `useEffect`
- Manages `kdsOrders` state
- Passes `toggleItem` and `completeOrder` down as props

### `KDSHeader`

Props: `activeCount: number`, `completedCount: number`

- Dark surface bar at the top (`bg-[#1a1d27]`)
- Left: green pulsing dot + "Kitchen Display — Dine In" label
- Center: "Active N Done N" stats
- Right: live clock updated every second via `useEffect` + `setInterval`

### `OrderCard`

Props: `kdsOrder: KDSOrder`, `onToggleItem: (index: number) => void`, `onComplete: () => void`

Layout (vertical flex, fixed width ~190px, max height fills screen):

```
┌─────────────────────┐
│ #12          T3      │  ← order number + table badge
│ 2 guests     4m 12s  │  ← guest count + elapsed timer
├─────────────────────┤
│ ○  Caesar Salad  APP│  ← item rows, scrollable
│ ✓  Duck Confit      │
│ ○  Truffle Fries x2 │
│    Extra parm        │
│    ⚠ Allergy: nuts  │
├─────────────────────┤
│ ████░░  3/4         │  ← progress bar
│  [  Complete order ] │  ← locked until all items done
└─────────────────────┘
```

- Fixed width: `w-[190px]`
- Card bg: `bg-[#1e2235]` border `border border-white/10 rounded-xl`
- Completed card: `opacity-40 bg-[#141720] border-white/[0.04]`
- Complete button: disabled (greyed) until all items are `completed: true`

### `OrderItemRow`

Props: `item: KDSOrderItem`, `onToggle: () => void`, `disabled: boolean`

- Full-width `TouchableOpacity` row, calls `onToggle` on press (disabled when order is completed)
- Left: circular checkbox — empty border when pending, green filled with checkmark when done
- Item name with quantity badge (e.g. `[2]` prefix)
- Below name: options list in muted text, instructions in amber italic, `APP` badge if `appetizer: true`
- When done: row fades (`opacity-40`), name gets strikethrough

### `QueueDivider`

- A simple `View` with `w-px bg-white/10 self-stretch mx-0.5`
- Only rendered when `completedOrders.length > 0`

---

## Timer Logic

Track elapsed time locally — do not read from Firestore timestamps for display.

```typescript
// On order added, record the wall-clock start time
const [startTimes, setStartTimes] = useState<Record<string, number>>({});

// When adding a new KDSOrder:
setStartTimes((prev) => ({ ...prev, [raw.id!]: Date.now() }));

// In a 1-second interval, derive elapsed seconds:
const elapsed = Math.floor(
  (Date.now() - (startTimes[orderId] ?? Date.now())) / 1000,
);
```

Timer color thresholds:

- `< 5 min` → green (`text-[#22c87a]`)
- `5–10 min` → amber (`text-[#f0a020]`)
- `> 10 min` → red (`text-[#e84545]`)

---

## Progress Bar

```typescript
const doneCount = items.filter((i) => i.completed).length;
const total = items.length;
const pct = total > 0 ? (doneCount / total) * 100 : 0;
```

Render as a `View` track with an inner `View` fill using `style={{ width: `${pct}%` }}`.

---

## Item Detail Rendering

For each `KDSOrderItem`, render in order:

1. **Options** (`options[]`) — join `option.name` values, muted text, below the item name
2. **Changes** (`changes[]`) — format as "no [from.name]" or "[from.name] → [to.name]", muted
3. **Extras** (`extras[]`) — format as "+ [description]", muted
4. **Instructions** — amber italic text if present
5. **APP badge** — small red pill if `appetizer: true`

---

## File Structure

```
app/
  kds.tsx                  # KDSScreen (entry point, Firestore listener, state)

components/kds/
  KDSHeader.tsx
  OrderCard.tsx
  OrderItemRow.tsx
  QueueDivider.tsx

types/
  kds.ts                   # KDSOrderItem, KDSOrder

lib/
  firebase.ts              # existing Firebase init (already exists)
```

---

## NativeWind Notes

- Use `className` for all styling
- For dynamic widths (progress bar), use inline `style` prop — NativeWind can't handle runtime interpolated values like `w-[${pct}%]`
- `ScrollView` with `horizontal` prop for the queue; inner cards use `flexShrink: 0`
- Items inside each card use a nested `ScrollView` (vertical, `nestedScrollEnabled`)

---

## Behaviour Notes

- **No Firestore writes** — all completion state is local only
- **Order of cards**: active orders left-to-right by `createdAt` asc, then divider, then completed orders
- **Completed order cap**: max 3; oldest is silently dropped when a 4th is completed
- **Complete button**: locked (`disabled`) until every item in the order is `completed: true`
- **Firestore `removed` events**: auto-mark as completed locally (POS closed the order)
- **New orders from Firestore**: only added to local state if not already present (guard against duplicate `added` events)
