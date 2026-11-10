# Guest Profiling System — Simple Explanation

Updated 10 November 2026.

## 1. What We Are Building

We are building a **guest profiling system** for hotels.

It reads the hotel's existing guest records and turns them into searchable guest profiles. When a receptionist starts entering a returning guest's details, matching profiles pop up and narrow down as more is typed. When the right profile shows, the receptionist clicks it and the registration form fills in automatically.

The system works alongside the hotel's existing hotel management software. It does not replace that software.

This is **custom software**, built for each hotel and maintained by the developer. It is not a one-size-fits-all product.

## 2. The Problem

When a guest returns to a hotel, the receptionist may have to enter the guest's details all over again.

This creates:
- Repeated data entry.
- Longer check-in processes.
- More work for reception staff.

Our system is intended to reduce that repeated work.

## 3. How It Should Work

### Returning guest

1. The guest arrives at the hotel.
2. The receptionist starts typing an identifying detail, such as a phone number or name.
3. Our system shows matching guest profiles.
4. As the receptionist types more, the list filters down.
5. The receptionist sees the right profile and clicks it.
6. The hotel's existing registration form is filled with that guest's saved details.
7. The receptionist reviews the form and clicks the hotel's existing **Check In** button.

The hotel's software still handles the actual check-in.

### New guest

1. The receptionist enters the new guest's details through the hotel's normal registration process.
2. Our system reads the new record from the hotel's database.
3. A profile becomes available for future visits.

## 4. The Two Main Components

### A. Guest Profiling System — Our Core Product

This is the main system we build and own.

It handles:
- Building guest profiles from the hotel's existing records.
- Live search and filtering as the receptionist types.
- Showing the matching profiles.
- Supplying the selected guest's details for the form.

Think of it as the **brain** of the product. It knows how to find and present guest profiles.

### B. PMS Adapter — The Integration

PMS means **Property Management System**. It is the hotel's existing hotel software.

The adapter connects our profiling system to that particular PMS.

It handles:
- Reading guest records from the hotel's database (read-only).
- Filling the hotel's registration form when the guest is selected.

The adapter is not the guest-profiling product itself. It is the connection between our product and the hotel's software.

## 5. Different Hotels May Need Different Adapters

Hotels do not all use the same software. The adapter depends on the PMS.

| Hotel software type | Possible adapter |
|---|---|
| Browser-based PMS | Browser extension |
| Windows desktop PMS | Windows companion application |
| PMS with an approved API | API integration |

We build the core profiling system once. We build a separate adapter for each PMS.

**Important:** These are possible integration approaches, not guaranteed access methods. We must inspect the actual PMS and confirm what access is available and permitted.

## 6. Access to Existing Guest Records Is Critical

The hotel's existing PMS stays the source of truth for guest records.

We read the records directly from the hotel's database using a **read-only login**, so the system can never change or damage the hotel's data.

Other possibilities, if direct database access is not available:
- An approved API.
- An authorized data export.
- Another interface provided by the PMS vendor.

Before building an adapter, confirm with the hotel (and the PMS vendor if needed) that reading the database is allowed.

If there is no usable and authorized way to read guest information, the integration may not be possible.

## 7. Avoiding a Duplicate Database

We do not want receptionists to maintain guest records in two separate systems.

The goal is:
- Read existing guest information.
- Reuse it to fill the hotel's registration form.
- Keep the hotel's PMS responsible for normal hotel operations.

Our system may need its own storage for search and matching speed. That storage is built automatically from the hotel's records and must never become a second manual record-keeping task for staff.

## 8. Messy and Duplicate Records — Manual, Not Code

Hotel databases often hold the same guest more than once, with different spellings.

**Cleaning this is manual work done by the hotel's staff. It is not part of our software.**

- The system does not merge or fix duplicate records.
- The system does not correct spelling.
- The system does not use AI. This is a fixed decision to keep the scope small.
- Search is built to start from the phone number, which is the most reliable detail. If a guest appears more than once, the receptionist sees every match and picks the right one.

## 9. What We Are Not Building

We are **not** building:
- A replacement hotel management system.
- A new check-in/check-out system.
- A second registration process for receptionists.
- A standalone CRM that staff must update separately.
- Any AI features.
- Automatic duplicate detection, merging, or spelling correction.
- Anything that writes into the hotel's database.

The hotel keeps using its existing PMS for check-in and other hotel operations.

## 10. Maintenance and Ownership

- The software is custom and maintained by the developer.
- The core stays the same across hotels. Only the adapter changes for each hotel.
- The form-filling part is the most fragile piece. If the hotel's software is updated, the adapter may need fixing. This is ongoing work and should be covered by a monthly maintenance fee.
- Guest data is personal. Be ready to tell the hotel where profile data is stored and who can see it.

## 11. What We Need to Confirm Before Choosing an Adapter

For each hotel, establish:

1. The exact PMS product and version.
2. Whether it is browser-based or a Windows desktop application.
3. What database it runs on, and whether a read-only login can be created.
4. Whether the vendor or hotel permits third-party read access.
5. Which guest fields can be read.
6. Whether the registration form can be safely filled without interfering with the hotel's normal process.

The exact PMS used by April 14 Hotel has not yet been confirmed.

## 12. The Development Strategy

1. Build the core guest-profiling system (profiles, live search and filtering).
2. Define a standard way for adapters to send guest data to it and receive matching profiles.
3. Inspect the first hotel's PMS and database.
4. Confirm read access is permitted.
5. Build the first adapter for that PMS.
6. Test the complete workflow with the hotel before relying on it in daily operations.
7. Add other adapters as opportunities arise.

## The Central Idea

**Build one reusable guest-profiling system that reads a hotel's existing guest records, shows matching profiles as staff type, and fills the registration form with one click. Connect it to each hotel's software through a custom adapter.**

The profiling system is our product. The adapter is how that product communicates with each hotel's existing software.
