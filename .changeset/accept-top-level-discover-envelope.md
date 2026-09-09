---
'@modelcontextprotocol/client': patch
---

Accept spec-conformant 2026-07-28 `server/discover` responses that place `resultType` and `_meta` at the JSON-RPC response envelope level. The transport parser now lifts those fields into `result` before strict JSON-RPC validation, allowing version negotiation to classify the server instead of silently dropping the response and misclassifying it as legacy after a probe timeout.
