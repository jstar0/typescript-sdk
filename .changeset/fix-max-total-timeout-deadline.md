---
'@modelcontextprotocol/core-internal': patch
---

Enforce `maxTotalTimeout` from the start of a request, including requests that receive no progress notifications. When progress resets a per-request timeout, the new timer now uses the remaining total-timeout budget instead of starting a full timeout window again.
