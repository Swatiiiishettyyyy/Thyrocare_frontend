# Cart Icon Counter - Code Documentation

## Overview
The cart icon counter in the nucleotide-web-app displays the number of items in the user's shopping cart. This document explains how the counter is updated and where the relevant code is located.

---

## Architecture Flow

```
API (Backend) 
    ↓
Cart Service (cartService.ts)
    ↓
Redux Store (cartSlice.ts)
    ↓
NavigationMenu Component (NavigationMenu.tsx)
    ↓
Cart Icon Badge (Visual Display)
```

---

## Key Files

### 1. **Redux Cart Slice**
**Location:** [`nucleotide-web-app/shared/store/slices/cartSlice.ts`](nucleotide-web-app/shared/store/slices/cartSlice.ts)

**Purpose:** Manages the cart state in Redux store

**Key State:**
```typescript
interface CartState {
  itemCount: number;        // Number of items in cart
  lastUpdated: number | null; // Timestamp of last update
}
```

**Key Actions:**
- `setCartItemCount(number)` - Sets the cart count to a specific value
- `incrementCartItemCount(number)` - Increases cart count
- `decrementCartItemCount(number)` - Decreases cart count
- `resetCart()` - Resets cart count to 0

---

### 2. **Cart Service**
**Location:** [`nucleotide-web-app/web/src/services/cartService.ts`](nucleotide-web-app/web/src/services/cartService.ts)

**Purpose:** Handles API calls related to cart operations

**Key Function:**
```typescript
export const getCartView = async (): Promise<CartViewResponse> => {
  const response = await api.getWithEndpoint<CartViewResponse>(
    API_ENDPOINTS.CART.VIEW
  );
  return response;
}
```

**Response Structure:**
```typescript
interface CartViewResponse {
  status: "success" | "error";
  data?: {
    cart_summary: {
      total_items: number;  // ← This is used for the counter
      subtotal_amount: number;
      delivery_charge: number;
      grand_total: number;
    }
  }
}
```

---

### 3. **NavigationMenu Component**
**Location:** `nucleotide-web-app/web/src/components/NavigationMenu/NavigationMenu.tsx`

**Purpose:** Displays the navigation bar with cart icon and counter badge

#### How Cart Counter is Updated

**Step 1: Fetch Cart Count on Login**
```typescript
// Lines 195-215
useEffect(() => {
  const fetchCartCount = async () => {
    if (isLoggedIn) {
      try {
        const response = await cartService.getCartView();
        if (response.status === "success" && response.data) {
          const totalItems = response.data.cart_summary?.total_items || 0;
          dispatch(setCartItemCount(totalItems));  // ← Updates Redux store
        } else {
          dispatch(setCartItemCount(0));
        }
      } catch (error) {
        dispatch(setCartItemCount(0));
      }
    } else {
      dispatch(setCartItemCount(0));
    }
  };

  fetchCartCount();
}, [isLoggedIn, dispatch]);
```

**Step 2: Read Cart Count from Redux**
```typescript
// Line 91
const { itemCount } = useAppSelector((state: any) => state.cart);
```

**Step 3: Display Cart Badge**
```typescript
// Lines 1016-1037 (Desktop view)
<View style={styles.cartIconContainer}>
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path
      d="M9 2L7.17 4H4C2.9 4 2 4.9 2 6V19C2 20.1 2.9 21 4 21H20C21.1 21 22 20.1 22 19V6C22 4.9 21.1 4 20 4H16.83L15 2H9ZM9 4H15L16.83 6H20V19H4V6H7.17L9 4Z"
      fill={semantic.text.primary}
    />
  </Svg>
  {itemCount > 0 && (
    <View style={styles.cartBadge}>
      <Text style={[styles.cartBadgeText, getResponsiveStyle("semiBold", 10)]}>
        {itemCount > 99 ? "99+" : itemCount}
      </Text>
    </View>
  )}
</View>
```

**Badge Styling:**
```typescript
// Lines 1615-1639
cartIconContainer: {
  position: "relative",
  width: 24,
  alignItems: "center",
},
cartBadge: {
  position: "absolute",
  top: -8,
  right: -8,
  backgroundColor: semantic.interactive.primary,
  borderRadius: 10,
  minWidth: 18,
  height: 18,
  justifyContent: "center",
  alignItems: "center",
  paddingHorizontal: 4,
  borderWidth: 2,
  borderColor: semantic.background.primary,
},
cartBadgeText: {
  color: semantic.text.inverse,
  fontSize: 10,
}
```

---

## When Cart Counter Updates

### 1. **On Page Load/Refresh**
- When user is logged in, `useEffect` hook triggers
- Calls `cartService.getCartView()` API
- Updates Redux store with `total_items` from response
- Badge displays the count

### 2. **On Login**
- `isLoggedIn` state changes
- Triggers the `useEffect` dependency
- Fetches fresh cart count from API

### 3. **On Logout**
- Cart count is reset to 0
- Redux store is cleared via `resetCart()` action

### 4. **Manual Updates (from other components)**
Other components can update the cart counter by dispatching Redux actions:
```typescript
import { setCartItemCount, incrementCartItemCount, decrementCartItemCount } from 'shared/store/slices/cartSlice';

// Set specific count
dispatch(setCartItemCount(5));

// Increment by 1
dispatch(incrementCartItemCount(1));

// Decrement by 1
dispatch(decrementCartItemCount(1));
```

---

## API Endpoint

**Endpoint:** Defined in `API_ENDPOINTS.CART.VIEW`
**Method:** GET
**Authentication:** Required (user must be logged in)

**Response Example:**
```json
{
  "status": "success",
  "data": {
    "cart_id": 123,
    "user_id": 456,
    "username": "John Doe",
    "cart_items": [...],
    "cart_summary": {
      "total_items": 3,
      "subtotal_amount": 15000,
      "delivery_charge": 500,
      "grand_total": 15500
    }
  }
}
```

---

## Visual Display Rules

1. **Badge Visibility:** Only shows when `itemCount > 0`
2. **Count Display:** 
   - Shows actual number if ≤ 99
   - Shows "99+" if > 99
3. **Position:** Top-right corner of cart icon
4. **Styling:** Red badge with white text

---

## Related Components

### Other pages that receive `cartCount` prop:
- `TestPage.tsx`
- `PackagesPage.tsx`
- `CartPage.tsx`
- `AddressPage.tsx`
- `TimeSlotPage.tsx`
- `PaymentPage.tsx`
- `TestDetailPage.tsx`
- `OrganDetailPage.tsx`
- `HealthMetricsPage.tsx`
- `ComprehensiveBrowsePage.tsx`
- `MenHealthSegmentPage.tsx`
- `WomenHealthSegmentPage.tsx`
- `VitalsOrganPage.tsx`

These pages receive `cartCount` from their parent routing component (likely in `src/App.tsx`) and pass it to their Navbar components.

---

## Summary

**To update the cart icon counter:**

1. **From API:** The counter automatically updates when the page loads or user logs in by fetching from `cartService.getCartView()`

2. **Manually:** Dispatch Redux actions from any component:
   ```typescript
   import { setCartItemCount } from 'shared/store/slices/cartSlice';
   import { useAppDispatch } from 'hooks';
   
   const dispatch = useAppDispatch();
   dispatch(setCartItemCount(newCount));
   ```

3. **After cart operations:** After adding/removing items from cart, call the API again or manually update the Redux store

The counter is reactive and will automatically update the UI whenever the Redux `itemCount` state changes.
