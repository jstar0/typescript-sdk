---
'@modelcontextprotocol/client': patch
---

Accept spec-conformant 2026-07-28 `server/discover` responses that place `resultType` and `_meta` at the JSON-RPC response envelope level. Version negotiation now normalizes those fields for classification instead of silently dropping the response and misclassifying the server as legacy after a probe timeout.
