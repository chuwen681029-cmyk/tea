# Security Specification: Tea Ordering System (Unauthenticated DB Access)

This document specifies the security posture and data invariants for our Tea Ordering System. Since the user requested **no OAuth authentication** and local admin password verification, clients operate as unauthenticated actors from the perspective of Firebase Auth. We enforce strict data invariants on document schemas directly in the security rules.

## Core Data Invariants

1. **Tea Items**:
   - Readers can list and get any active tea item.
   - Creating, updating, or deleting tea items requires possessing the admin credential verified by the client. From the database perspective, we prevent state transition corruption.
   - Price must be a positive number.

2. **Orders**:
   - Anyone can create an order.
   - Orders cannot be deleted or updated arbitrarily once created, except for state transitions (e.g., status changes like "Pending" to "Preparing").
   - Total amount must be positive.
   - Customer name must be non-empty and at most 100 characters.

3. **Admin Settings**:
   - `admin_settings/config` can be written on first-time setup when `isSetup` is false.
   - Once `isSetup` is true, the document becomes immutable or only updatable if the old password hash is known (or managed client-side).

## The "Dirty Dozen" Payloads (Unauthenticated Penetration Matrix)

1. **Malicious Tea Item Price**: Create a tea item with a price of `-10` or a non-numeric value.
2. **Ghost Tea Fields**: Create a tea item with arbitrary undocumented fields.
3. **Poisoned Tea ID**: Inject a 1MB string as a tea item ID.
4. **Order Status Skiping**: Create a new order with state `Completed` instead of `Pending`.
5. **Negative Order Total**: Place an order with total amount `-500`.
6. **Order Ghost Items**: Place an order with an empty items array.
7. **Order Deletion**: Unauthenticated user attempts to delete an order.
8. **Admin Config Password Wipe**: Set `isSetup` to false and erase the administrator password hash.
9. **Spam Name Order**: Submit customer name with a 1MB string or HTML tags.
10. **Admin Config Overwrite**: Rewrite admin password hash after setup is complete.
11. **Client-Side Admin Bypass**: Directly tamper with tea settings collections.
12. **Status Alteration**: Customers attempting to progress their own order status to "Completed".
