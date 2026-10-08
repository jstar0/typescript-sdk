---
'@modelcontextprotocol/server': patch
---

Stateless legacy `405 Method Not Allowed` responses now include `Allow: POST`, as required by RFC 9110.
