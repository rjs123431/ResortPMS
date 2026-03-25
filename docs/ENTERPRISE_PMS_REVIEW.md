# PMS + POS — Enterprise-Grade Review & Recommendations

**Version:** 1.0  
**Scope:** Full application (ASP.NET Core backend, React SPA, POS, multi-tenant)  
**Goal:** Identify missing features and enhancements for production enterprise-grade PMS.

---

## Executive Summary

PMS delivers a solid **Reservation → Check-In → Stay → Check-Out** workflow with integrated POS, housekeeping, and multi-tenant administration. The codebase is modular, permission-aware, and uses date-based room inventory. To reach **enterprise-grade production** readiness, the system needs: (1) **full audit and compliance**, (2) **reporting and analytics**, (3) **hardened availability and concurrency**, (4) **workflow and approvals**, (5) **POS reporting and operational completeness**, (6) **operational resilience** (health checks, API versioning, secrets, feature flags), and (7) **optional growth vectors** (channel manager, rate strategy, notifications).

---

## 1. Features Lacking (Missing or Placeholder)

### 1.1 Reporting & Analytics

- **No report engine or report app services.** There are no dedicated backend report endpoints for occupancy, revenue, folio, or reservations.
- **POS Reports:** The POS Reports page is a placeholder (“Coming soon”); no sales-by-outlet, by period, by category, or tax reports.
- **No built-in dashboards** for KPIs (occupancy %, ADR, RevPAR, no-shows, cancellation rate).
- **No export of PMS data** (reservations, stays, guests) to CSV/Excel for external analysis; only user import exists.

**Recommendation:** Introduce a Reporting module (app services + optional report definitions) and implement at least: Night Audit summary, Occupancy report, Revenue/Folio summary, POS sales summary. Add CSV/Excel export for key entities (reservations, stays, guests).

---

### 1.2 Auditing & Compliance

- **Selective audit store:** `ErrorOnlyAuditingStore` persists only:
  - Requests that throw exceptions, or
  - Methods whose names start with Create/Update/Delete.
- **Read operations and other mutations** (e.g. Cancel, Confirm, status changes) may not be audited depending on method naming, and **Delete** is included but the comment in code only mentioned Create/Update.
- **No immutable audit trail** for financial events (folio transactions, payments, adjustments) suitable for strict compliance (e.g. PCI, local regulations).

**Recommendation:** Replace or extend with a **full audit store** for all mutations and sensitive reads (e.g. folio, payments). Add a dedicated **financial/audit log** for folio and payment events with tamper-evident design (e.g. hash chain or append-only store) if compliance requires it.

---

### 1.3 Workflow & Approvals

- **No approval workflows** for:
  - Discounts or comps (room or POS).
  - Refunds or write-offs.
  - Rate overrides or BAR (Best Available Rate) exceptions.
- **Room change requests** have approve/reject logic but no generic workflow engine; no configurable rules or delegation.

**Recommendation:** Add approval workflows for high-impact actions: discount above threshold, refund, write-off, rate override. Start with simple “approver role + reason + audit” before introducing a full workflow engine.

---

### 1.4 Notifications (Guest- and Staff-Facing)

- **No email/SMS templates** for reservation confirmations, reminders, check-in instructions, or post-checkout feedback.
- **No configurable notification rules** (e.g. alert on no-show, late checkout, low deposit).
- In-app and SignalR notifications exist but are not tied to reservation/stay lifecycle in a documented, configurable way.

**Recommendation:** Add templated **reservation confirmation and reminder emails** (and optional SMS). Add **configurable notification rules** (e.g. no-show alert, deposit reminder) and log delivery status.

---

### 1.5 Rate Management & Distribution

- **No channel manager or OTA connectors** (Booking.com, Expedia, etc.); no two-way rate/availability sync.
- **No BAR or min-length-of-stay** logic; rate plans and date overrides exist but no segment/channel-based rate rules or yield strategy.
- **No group or block booking** support (allotments, block contracts).

**Recommendation:** For enterprise, plan a **Channel Manager / rate distribution** roadmap (API-first availability and rates, then connectors). Enhance rate plans with **BAR, min LOS, and segment rules** where needed.

---

### 1.6 Backup, Restore & Data Management

- **No application-level backup/restore** or point-in-time recovery; reliance on DB/server tooling only.
- **No bulk operations** for reservations, stays, or guests (only user import via Excel).
- **No guest or reservation data import** (e.g. from another PMS or CSV).

**Recommendation:** Document and automate **DB backup and restore** (and PITR if required). Add **bulk export/import** for guests and reservations (CSV/Excel) with validation and error reporting.

---

### 1.7 POS Completeness

- **Room charge** is implemented (post to stay folio); **POS reporting is not** (backend + UI placeholder).
- **No end-of-day / Z-report** or cash drawer reconciliation flow documented in codebase.
- **No tax report** or tax-period summary for POS.

**Recommendation:** Implement **POS reports** (sales by outlet/period/category, tax summary) and a clear **EOD/Z-report and reconciliation** process; link to Night Audit if applicable.

---

## 2. Features to Enhance for Enterprise-Grade

### 2.1 Room Availability & Concurrency

- **Current:** Reservation creation checks `IsRoomAvailableForDatesAsync` and reservation/stay conflicts, then inserts and calls `SetReservedAsync`. **No locking or optimistic concurrency** on inventory rows; risk of **double booking** under concurrent requests for the same room/dates.
- **Document numbering** already uses retries and atomic SQL for concurrency; room inventory does not.

**Recommendation:**

- **Option A:** Use a **serializable transaction** and **pessimistic lock** (e.g. `SELECT ... FOR UPDATE` or `UPDLOCK`) on the affected `RoomDailyInventory` rows for the room/dates, then check availability, insert reservation, then `SetReservedAsync`, then commit.
- **Option B:** **Optimistic concurrency** on `RoomDailyInventory` (row version/timestamp); on conflict, retry or return “room no longer available.”
- Publish a small **Availability Service** API (as in AGENTS.md) used by reservation and check-in so all booking paths use the same rules and concurrency strategy.

---

### 2.2 API & Operational Resilience

- **No API versioning** (e.g. URL or header); future breaking changes will be harder to manage.
- **No health checks** (ASP.NET Core Health Checks) for DB, Hangfire, or dependencies; not ideal for load balancers and orchestrators.
- **No rate limiting** on public or sensitive endpoints (e.g. token, reservation create).
- **Secrets** live in appsettings; no integration with **Azure Key Vault** or similar for production.

**Recommendation:** Add **API versioning** (e.g. `v1` in path or `api-version` header) and **health checks** (DB, optional Hangfire). Add **rate limiting** on auth and reservation endpoints. Use **secret manager / Key Vault** (or env) for production secrets and document in deployment guide.

---

### 2.3 Configuration & Feature Management

- **No feature flags** or runtime toggles; configuration is file-based only. Hard to enable/disable features per tenant or environment without deployment.

**Recommendation:** Introduce **feature flags** (e.g. ABP or a simple key-value store) for high-impact features (e.g. POS room charge, new reports, channel manager) and tenant-specific overrides.

---

### 2.4 Error Handling & Observability

- **Logging:** Log4Net is in place; no structured logging (e.g. correlation IDs, request IDs) consistently applied for tracing.
- **No distributed tracing** (OpenTelemetry, Application Insights) for cross-service and async jobs.
- **No alerting** on critical errors or failed background jobs (e.g. Hangfire).

**Recommendation:** Add **request/correlation IDs** and **structured logging**; consider **OpenTelemetry** (or App Insights) for tracing and metrics. Define **alerts** for critical failures and failed jobs.

---

### 2.5 Domain Events & Extensibility

- **Limited use of domain events** for reservation/stay lifecycle; side effects (notifications, analytics, integrations) are harder to add without touching core services.

**Recommendation:** Emit **domain events** for key actions (ReservationCreated, ReservationConfirmed, StayCheckedIn, StayCheckedOut, FolioClosed, etc.) and consume them for notifications, audit, and future integrations (channel manager, CRM). Keeps core logic clean and extensible.

---

### 2.6 Multi-Tenancy & Isolation

- **Multi-tenancy** is present (ABP); tenant resolution and data isolation should be **verified under load** (e.g. no cross-tenant leaks in queries, caches, or document numbering).
- **No tenant-level configuration** for things like “allow walk-in without deposit” or “require approval for refunds” beyond what exists in tenant settings.

**Recommendation:** Audit **tenant isolation** (queries, repositories, document sequences). Extend **tenant settings** for business rules (approvals, deposits, cancellation policy) so each property can be tuned without code changes.

---

### 2.7 Frontend & UX

- **Single SPA** for both resort operations and administration; permission-based routing is good, but **separate apps** (operator vs admin) could improve branding and security boundaries for large deployments.
- **No offline or PWA** support; operations depend on network.
- **POS:** Session and room charge are implemented; **EOD and reporting UX** need to match backend once reports exist.

**Recommendation:** Keep single SPA as default; document option for **split operator/admin apps** if required by enterprise clients. Consider **offline-capable** flows for critical paths (e.g. view folio, post charge) in a later phase. Complete **POS reporting UI** when backend reports are ready.

---

### 2.8 Security Hardening

- **Authorization:** Granular permissions exist; ensure **sensitive operations** (refund, write-off, rate override) require explicit permission and, where added, approval.
- **CORS and security headers** should be reviewed for production (e.g. strict origins, CSP if applicable).
- **Sensitive data:** Ensure **PII and payment-related data** are not logged; consider masking in audit logs.

**Recommendation:** Review **CORS and security headers** for production. Enforce **permission + approval** for refunds and write-offs. Add **PII masking** in logs and audit where required by policy.

---

## 3. Summary & Priority Matrix

| Area | Lacking | Enhance | Priority (suggested) |
|------|--------|--------|----------------------|
| Reporting & analytics | Yes | Add dashboards, exports | **High** |
| Auditing & compliance | Yes | Full audit + financial trail | **High** |
| Availability/concurrency | — | Lock or optimistic inventory | **High** |
| Workflow/approvals | Yes | Discount/refund/rate approvals | **High** |
| Notifications | Yes | Email/SMS templates + rules | **Medium** |
| POS reports & EOD | Yes | Implement + Z-report | **High** |
| API versioning & health | — | Versioning, health checks | **Medium** |
| Secrets & config | — | Key Vault, feature flags | **Medium** |
| Domain events | — | Emit for lifecycle | **Medium** |
| Rate/channel manager | Yes | Roadmap + BAR/min LOS | **Lower / roadmap** |
| Backup/bulk/import | Yes | Document backup; bulk import/export | **Medium** |
| Observability | — | Correlation ID, tracing, alerts | **Medium** |

---

## 4. Next Steps

1. **Immediate:** Harden **room availability** (locking or optimistic concurrency) and extend **auditing** to full mutation + financial trail.
2. **Short term:** Add **Reporting** (Night Audit, Occupancy, Revenue, POS sales) and **POS reports + EOD**; introduce **approval workflows** for refunds and discounts.
3. **Medium term:** **API versioning**, **health checks**, **feature flags**, **secrets management**, **domain events**, and **notification templates + rules**.
4. **Roadmap:** **Channel manager / OTA**, **BAR and rate strategy**, **bulk import/export**, and optional **separate operator/admin** or **offline** capabilities.

This review is based on the current codebase and AGENTS.md/PRD; adjust priorities to match regulatory requirements and business roadmap.
