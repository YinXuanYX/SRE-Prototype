Product Requirement Document (PRD)
Real-Time Smart Energy Monitoring & Analytics Platform (PWA Prototype Scope)
1. Document Control & Overview
This document outlines the cross-platform Progressive Web App (PWA) requirements for a software-only prototype designed for real-time electricity tracking, automated forecasting, and multi-tenant billing management.
Prototype Scope Note: This technical implementation completely replaces physical electrical hardware with a localized, software-driven simulation engine. Physical electrical infrastructure components are out of scope.
2. System Objectives & Business Goals
2.1 Main Goals
User Financial Well-Being: Deliver real-time, actionable insights into simulated household electricity usage to eliminate unexpected utility expenses and bill shocks.
Enhance Operational Efficiency: Replace error-prone manual meter readings with instant, simulated real-time tracking of common areas and multi-unit complexes.
Safeguard User Privacy: Ensure absolute isolation of individual tenant behavioral habits from property management or unpermitted third parties.
2.2 Business Goals
Reduce Utility Disputes: Demonstrate an 80% decrease in property management dispute resolution pathways by routing predictive "bill shock" alerts directly to tenant views.
Accelerate Infrastructure Failure Response: Utilize a real-time "traffic light" status dashboard to instantly flag simulated anomalies in common-area facilities (e.g., stuck water pumps, faulty lighting timers) before the monthly billing cycle concludes.
Centralize Portfolio Oversight: Provide multi-property investors and landlords with a single dashboard to track mock utility debt, detect simulated unauthorized high-usage activities (such as cryptocurrency mining), and implement fractional room billing.
Legal Compliance: Enforce a strict opt-in consent flow to demonstrate absolute compliance with the Malaysian Personal Data Protection Act (PDPA).
3. Problem Statement & Stakeholder Matrix
3.1 Problem Statement
Reactive Utility Data: Traditional systems (e.g., MyTNB) provide delayed consumption metrics, meaning users only discover high usage after the 30-day cycle finishes.
Resource-Intensive Investigations: Building managers lose 30% to 40% of their work week managing billing arguments. This prototype models how immediate tenant alerts shift accountability back to the consumer.
Shared Space Blind Spots & Surveillance Creep: Hidden equipment leaks quietly drain thousands of ringgit , while accessing granular appliance data violates tenant privacy rights. The prototype must prove that software can monitor aggregate data without exposing private habits.
3.2 Stakeholder Matrix
Stakeholder
Role
Key Goal / Interest (Prototype Context)
Assigned Task Space
Consumer / Resident
End-User / Renter
Lowering utility bills, avoiding bill shock, and identifying high-consumption appliances.
Monitoring simulated daily personal usage and setting budget limits.
Landlord / Property Manager
Multi-Unit Admin
Monitoring common areas, preventing tenant utility debt, and resolving disputes rapidly.
Overseeing zone trends, managing simulated alerts, and calculating fractional bills.
House Developer / Super Admin
Infrastructure Provider
Validating cost-effective, scalable software architecture and provisioning admin accounts.
Monitoring global energy strain across multiple simulated properties.
Project Manager
Internal Team
Delivering the system within budget, timeline, and architectural boundaries.
Overseeing end-to-end software development and application deployment.
Simulation / IT Developer
Internal Team
Ensuring robust local network simulation, offline resilience, and clean mock data flows.
Setting up mock telemetry scripts, local gateways, and browser storage caches.
Requirements Engineer
Internal Team
Mapping explicit permission boundaries to enforce complete PDPA compliance.
Documenting functional specifications and verification logic.

4. System Constraints & Compliance (Prototype Scope)
Hardware Spatial & Physical Safety Constraints (Simulated Only): Physical DB box limits and continuous physical amperage tolerances are out of scope. The mock data generator will simulate heavy-appliance loads dynamically within safe mathematical limits.
Regulatory Isolation: To comply with the Malaysian Personal Data Protection Act (PDPA), personal behavioral data must be cryptographically separated from management access points in the application database. Landlords are permanently restricted from viewing appliance-level data.
Utility Rate Dependency: Financial estimations rely directly on external rates. The system will use a local static script or mock endpoint to simulate fetching tiered data matching current Tenaga Nasional Berhad (TNB) rate parameters.
Network Prerequisites: While day-to-day data display utilizes local network mock resilience via browser storage , initial client onboarding, background AI model training simulations, and multi-property synchronization require an active internet connection.
MVP Core Scope: Early deployment stages must prioritize management's core requests: the Predictive Bill Shock Alert and the Traffic Light Dashboard.
5. Technical Architecture & Prototype Stack
To ensure optimal cross-platform performance combined with offline data syncing and sub-2-second latency, the following software stack is selected:
[Local Software Mock Telemetry Generator Script] 
         │ (Simulated MQTT over local WebSockets)
         ▼
[Client Frontend: React + Vite PWA] ➔ (Offline Cache: Dexie.js / IndexedDB)
         ▲
         │ (HTTPS / WSS via Workbox Service Worker)
         ▼
[Cloud Node.js NestJS Backend]
 ├─► [Forecasting Engine] (Integrated Node routes OR FastAPI script) 
 ├─► [TimescaleDB] (Simulated Time-series telemetry data)
 └─► [PostgreSQL] (User relational data & role mapping)

6. Functional Requirements & Detailed Acceptance Criteria
Module 1: Authentication & User Role Access
PB-0101: Unified SSO Authentication
The interface must feature clear Google and Apple Single Sign-On (SSO) action buttons.
Users selecting an option must be securely redirected to the selected provider's authorization portal.
Validated accounts must immediately land on their designated dashboard variant based on their role.
Failed authorization passes must halt progression and present an informative error message on screen.
PB-0102: Automated Role Assignment
Every account must be explicitly associated with a system role upon initialization.
Supported system definitions must comprise: Resident, Admin, Super Admin, and Customer Support.
Registration attempts lacking an identified, valid system role must be blocked.
PB-0103: Role-Based Access Control (RBAC) Isolation
Resident users are strictly restricted to reading their own unit's energy usage, billing statements, and analytics charts.
Admin users are exclusively permitted to review common areas, operational issue workflows, and zone-level configurations.
Super Admin accounts are granted permission to access the consolidated Multi-Property Aggregated Hub.
Customer Support entries are restricted to viewing system health, diagnostic statuses, and troubleshooting logs.
Any unpermitted endpoint traversal or cross-role request must be blocked, triggering an access-denied state.
Module 2: Consent & Privacy Management
PB-0201: Explicit Opt-In Consent Flow
The system must show a comprehensive consent disclosure screen prior to unlocking granular appliance-level data features.
The documentation must break down exactly what device-level signatures are captured and processed.
Users must interactively tap or click an "Agree" selection to proceed.
Appliance-level data features must remain completely locked until consent is confirmed and timestamped.
PB-0202: Consent Revocation Mechanism
A dedicated privacy configurations interface must remain accessible to the resident.
Upon revocation, the system must immediately terminate backend evaluation of appliance-level signatures.
A service confirmation toast or notification must confirm successful preference updates.
PB-0203: Cryptographic Data Partitioning
Admin query requests targeting explicit individual device breakdown records must be hard-blocked at the database layer.
Management views are strictly restricted to aggregate zone parameters or designated common area datasets.
Any API call violating this partition rule must respond with a secure "Access Denied" payload.
Module 3: Virtual Hardware & Data Simulation
PB-0301: Virtual Device Provisioning Walkthrough
The application must scan the local software runtime environment to detect simulated telemetry streams.
Detected virtual items (e.g., "Simulated Smart Plug - AirCon") must render clearly within an interactive selection list.
Selecting a target device must prompt the system to establish a secure websocket link and display an "Active" badge.
The system must immediately start streaming simulated telemetry packets into the processing pipeline.
PB-0302: Live Device Connection Status
Status parameters must show one of three distinct conditions: Active, Offline, or Error.
Metric tags must refresh automatically, showing the exact timestamp of the last successful data synchronization.
If a mock configuration file triggers a simulated device failure, the system must send an explicit offline notification.
PB-0303: Local API Synchronization Resiliency
If a network dropout is simulated, the frontend must immediately divert data cache routes to browser IndexedDB storage using Local APIs.
When external internet connectivity is toggled back to active, cached local blocks must be uploaded in the background to the cloud database.
The client interface must display a clear message indicating when local offline synchronization mode is active.
Module 4: Resident Energy Dashboard
PB-0401: Historical Trend Visualizations
The workspace layout must provide distinct, selectable data filters for daily, weekly, and monthly views.
Graphical charts must render properly to illustrate simulated consumption changes over time.
Empty dataspaces must render a clear fallback string: "No data available. Please ensure your device is connected.".
Note Correction: General baseline kWh trend charts remain accessible for basic tracking, but granular machine-learning appliance stacks require verified consent flags before loading.
PB-0402: Real-Time Cost Assessment
The view must display live simulated energy consumption formatted precisely in kWh.
The core calculator must translate usage metrics into local currency (RM) based on active tiered utility pricing models.
On-screen metric tags must update dynamically within 2 seconds of packet ingestion without needing manual page refreshes.
PB-0403: Side-by-Side Contextual Comparisons
The interface must provide a date picker to choose a historical comparison period.
The layout must present current usage metrics and past timeline points side by side.
If the historical period has no records, the view must present an alert stating: "No data available for selected period.".
Module 5: Appliance Breakdown & Recommendations
PB-0501: Algorithmic Appliance Rankings
Simulated appliances must be displayed in a ranked list sorted in descending order (highest to lowest consumption).
Each line item must list its estimated usage in kWh alongside its calculated cost.
If mock data streams lack sufficient history, the system must show a placeholder message: "More usage data needed for breakdown".
Active privacy consent verification is required before loading this dataset.
PB-0502: User-Driven Label Correction
A clear "Correct this appliance" action option must accompany every identified device entry.
Users must be able to input custom names or pick from a list of predefined appliance categories.
Confirmed corrections must immediately overwrite current parameters, refresh the UI, and write to retraining queues.
PB-0503: Data-Driven Efficiency Tips
The recommendations panel must display personalized efficiency suggestions directly linked to the user's highest-consuming simulated hardware.
Tips must respond to explicit tracking profiles, such as advising moving usage away from peak hours.
Every provided tip must display a realistic calculation of prospective financial gains.
Module 6: Billing & Forecasting
PB-0601: Real-Time Bill Projections
The system must project end-of-month billing parameters based on active telemetry patterns and current utility tiers.
Projections must re-evaluate automatically within 5 seconds of the billing dashboard module being opened.
PB-0602: Custom Alert Threshold Configurator
Settings must include an input field allowing residents to set preferred warning benchmarks.
Exceeding the threshold must immediately queue a system notification event detailing the total projected cost alongside likely root causes.
PB-0603: Admin Portfolio Projection View
The view must display projected electricity costs for individual tenant zones computed via zone-specific aggregate history.
Areas tracking toward unusually high end-of-month expenses must be automatically highlighted.
Access rights must restrict administrative users to zones within their assigned management scope.
Module 7: Alerts & Notifications
PB-0701: Push Notification Dispatch
A system push notification must be sent the moment a calculation exceeds predefined user benchmarks.
A prominent visual warning flag must display on the user's active application dashboard.
PB-0702: Common Area Anomaly Detection
Background tasks must continuously monitor load patterns across unassigned units and common areas.
Algorithms must flag sustained, non-stop high power draws (e.g., simulating cryptocurrency mining or broken facility timers) that diverge from schedules.
High-priority system alerts must be dispatched immediately to managing Admin accounts, isolating the exact location.
PB-0703: Centralized Alert History Log
The application must maintain an interactive, dedicated historical archive log of all sent warnings, strictly isolated to the user's authorization scope.
Entries must include a timestamp, type category, and event breakdown, remaining browseable locally via browser IndexedDB storage during network outages.
Module 8: Management Dashboard
PB-0801: Consolidated Metrics & Operational Tracker (Unified Framework)
View A (Operational Metrics): The main management view must embed a performance dashboard showing total building draw, expenses, and usage trends. Features interactive filter widgets sorting by dates, zones, and equipment categories.
View B (Issue Tracker): Embeds a centralized tracking panel for unresolved operational issues. Rows display issue category, location, severity, timestamp, and active status, pinning high-severity faults to the top by default.
Individual resident device breakdown logs must be completely omitted from this view to ensure complete privacy.
PB-0802: Issue Lifecycle Management & Follow-up Action Tracker
The system must allow administrators to generate follow-up action tickets directly from an unresolved issue log.
Action items must specify a title, description, assigned team member, priority status, and deadline, supporting states: Open, In Progress, and Resolved.
Resolving an issue requires an explicit text note, automatically logging the editor's admin username and timestamp.
PB-0803: Immutable Administrative Audit Log
The interface must provide a read-only historical list capturing all management updates performed by administrators.
Entries must display the Admin ID, action type, affected asset, date, and timestamp, with filters sorting by date range and classification.
All user roles are strictly prevented from editing, deleting, or overwriting audit log entries.
Module 9: Zone, Report & Multi-Property Management
PB-0901: Digital Sub-Metering & Zone Mapping
Displays available virtual hardware links and active profiles on a centralized Zone Management view.
Admins map virtual sensors to new custom zones and link tenant cards to calculate accurate fractional billing.
Attempting to map a sensor that is already assigned elsewhere must display a reassignment confirmation override prompt.
PB-0902: Standardized Accounting Report Exporter
The exporter form must include selection menus for month and year parameters.
The reporting engine must compile aggregate consumption metrics across all zones for that duration based on standard TNB utility structures.
File generations must compile data cleanly into downloadable PDF and CSV formats.
PB-0903: Super Admin Portfolio Command Center
The interface must display consolidated data streams across all registered properties, tracking operational status, energy strain level, and billing summaries.
Clicking on a property line item drills down to show its detailed zone layout and alert histories.
Locations with disabled or uncommunicative mock data configurations must display as "Offline" alongside their last known metadata.
7. Non-Functional & Quality Requirements
7.1 Performance Requirements
Real-Time Data Latency: High-frequency processing pipelines must update dashboard charts within 2 seconds of the simulated electrical delta.
Predictive Calculation Speed: End-of-month predictive bill forecasts must compile within 5 seconds of opening the billing module.
Scalability Bottlenecks: The centralized Multi-Property Hub must maintain performance profiles while handling concurrent active mock data streams from a minimum of 1,000 separate virtual endpoints.
7.2 Reliability & Operational Longevity
Offline Resilience: Core tracking pipelines must remain operational during simulated network outages by using local API pathways and caching data locally inside browser storage.
7.3 Usability & Interface Design
Set-and-Forget Layout: The resident mobile application interface must prioritize hands-free operation, requiring minimal ongoing interaction after initial setup.
Color-Blind Accessible UI: Management dashboards must follow a strict, color-blind-accessible red/green visual hierarchy for status indicators and high-severity tracking flags.
8. MVP Development Phasing & Implementation Strategy
PHASE 1 (Sprints 1-4): Core Foundation & High-Impact Requirements
 ├─ Core Authentication & Baseline PDPA Consent Forms (M1, M2)
 ├─ Localized Software Data Ingestion & Cache Pathways (M3)
 ├─ Predictive Bill Shock Notification Warning Engine (M6, M7) *MVP
 └─ High-Visibility Red/Green Performance & Issue Dashboard (M4, M8) *MVP

PHASE 2 (Sprints 5-8): Granular Analytics & Portfolio Extensions
 ├─ Simulated Appliance Signature Identification Breakdown ML Models (M5)
 ├─ User Label Correction Interface Flows for Model Tuning (M5)
 ├─ Digital Zone Mapping, Fractional Sub-Let Invoicing & Export Utilities (M9)
 └─ Global Multi-Property Hub Portlet for Portfolio Super Admins (M9)

