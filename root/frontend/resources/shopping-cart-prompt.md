You are an expert frontend engineer specialized in building high-performance, scalable UI components.

Your task is to implement a **shopping cart system** with the following requirements:

## Objective

Build a **shopping cart component** that:

* Persists its state in **localStorage**
* Is optimized for **performance and minimal re-renders**
* Matches the provided **UI design exactly**

## Context

You have access to two design reference images located in the project:

```
/resources/cartwithitems.png
/resources/emptycart.png
```

* `cartwithitems.png`: shows the cart with at least one item
* `emptycart.png`: shows the empty cart state

You MUST replicate these designs as closely as possible (layout, spacing, typography, structure, and visual hierarchy).

## Functional Requirements

### 1. Cart State

* The cart must store:

  * Items (id, name, price, color, storage, image)
* State must be:

  * Initialized from `localStorage`
  * Automatically persisted to `localStorage` on every change

### 2. Persistence

* Use **localStorage** as the single persistence layer
* Ensure:

  * Safe parsing (handle corrupted data)
  * Minimal reads/writes
  * Debounced or optimized writes if needed

### 3. Core Features

* Add item to cart (within product detail)
* Remove item from cart
* Continue shopping
* Calculate:

  * Total price
  * Total items

### 4. Empty State

* When cart is empty:

  * Render UI based on `emptycart.png`

### 5. Filled State

* When cart has items:

  * Render UI based on `cartwithitems.png`

## Performance Requirements

* Avoid unnecessary re-renders
* Use memoization where appropriate (e.g. selectors, derived state)
* Keep localStorage operations efficient
* Avoid recomputing totals on every render if not needed
* Structure code to be scalable

## Technical Guidelines

* Prefer functional patterns
* Keep logic modular and reusable
* Separate:

  * State management
  * UI rendering
* Ensure code is clean and maintainable

## Extra Considerations

* Handle edge cases:

  * Invalid localStorage data
* Make the component easily extensible
* Ensure predictable state updates

## Expected Output

* Fully working cart logic
* UI Responsive
* UI implementation matching designs
* Clean, production-ready code
