# Frontend/backend integration matrix

| Frontend feature | Existing component | Current source | Required endpoint/service | Permission | Status | Priority/notes |
|---|---|---|---|---|---|---|
| Customer dashboard balance | `HomeScreen` | Cedar account API | Existing `GET /v1/cedar/accounts/me` | Customer | Live | P0; backend authoritative |
| Bank selector | `TransferScreen` | Cedar banks API | Existing `GET /v1/cedar/banks` | Customer | Live | P0; fictional Elm/Birch |
| Name enquiry | `CustomerApp` | Cedar name API | Existing POST | Customer + origin | Live | P0; no fallback name |
| Transfer review | `ReviewScreen` | Form + enquiry | Existing transfer contract | Customer | Live | P0 |
| Transfer submit | `submitTransfer` | Cedar transfer API | Existing POST + idempotency | Customer | Live | P0; ambiguous is not failure |
| Transfer status/details | `DetailsScreen`, `StatusScreen` | Transfer GET | Existing GET by ID | Owner | Live | P0; stage/outcome separate |
| History | `HistoryScreen` | Client-created transactions | Missing customer history list | Customer | Partial | P1; cannot claim complete history |
| Complaint submit | `ReportScreen` | Cedar complaint POST | Existing POST | Owner | Live | P0; durable independently |
| Complaint list | `ComplaintsScreen` | Client `cases` state | Missing list route | Customer | Partial | P1 |
| Notifications | `NotificationsScreen` | Local state | Missing notification API/event | Customer | UI only | P2 |
| Operations summary | Staff workspace | Veriq operations GET | Existing `/operations` | Investigator | Partial/live | P1; freshness needed |
| Incidents | Staff Veriq module | Veriq incident GETs | Existing `/incidents` | Investigator | Partial/live | P1; no lifecycle write |
| Case investigation | Staff case panel | Exact case GET | Existing `/cases/{caseId}` | Investigator | Partial/live | P1; AI may be null |
| Source upload/list | Staff Veriq module | Veriq source API | Existing `/sources` | Investigator | Live slice | P1; bounded multipart |
| Context/relationships | Staff Veriq module | Context APIs | Existing `/context`, `/relationships` | Investigator | Live slice | P1; documented != verified |
| Customer 360 | Staff module label | Local shell | Proposed customer lookup | Staff scope | UI only | P1 |
| Transaction inquiry | Staff module label | Local shell | Proposed read-only inquiry | Staff scope | UI only | P1; no banking write |
| Complaints queue | Staff module label | Local shell | Proposed bank case list | Staff scope | UI only | P1 |
| Assignment/team | Staff module label | Local employee constants | Proposed assignment API | Admin/supervisor | UI only | P2 |
| Review/approvals | Staff module label | Local shell | Proposed review endpoints | Reviewer | UI only | P1; separation of duties |
| Audit filtering | Staff module label | Local shell | Proposed audit API | Auditor/admin | UI only | P2 |
| Sign up/in | Auth screens | Local form/demo roles | Proposed identity service | Public/authenticated | Placeholder | P0 for production |
| Bank connection | Brief only | Not observed | Proposed connector APIs | Institution admin | Not implemented | P1 |
| Synchronization | Brief only | Not observed | Proposed job/events | Admin/analyst | Not implemented | P1 |
| Knowledge onboarding | Source/context subset | Existing source APIs + proposals | Investigator | Partial | P1 |
| AI analysis | Brief/staff label | No live AI result | Proposed AI job/result | Investigator | Not implemented | P2; candidate only |
| Reports | Not observed | None | Proposed report jobs | Reviewer | Not implemented | P2 |

## Mismatches

1. Frontend `CaseRecord.id` is a display case key; backend has separate case, investigation, incident and transfer IDs.
2. No accepted customer history or complaint-list route exists.
3. Staff role picker is not backend authentication.
4. Display status must map stage and outcome separately.
5. Product brief scope is much larger than accepted v1.0 backend scope.

