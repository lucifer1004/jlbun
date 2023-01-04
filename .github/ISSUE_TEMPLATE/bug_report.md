---
name: Bug report
about: Create a report to help us improve
title: ''
labels: bug
assignees: ''

---

**Describe the bug**
A clear and concise description of what the bug is.

**To Reproduce**
<details>
<summary>Code that causes the issue:</summary>

```javascript
import { Julia } from "jlbun";

Julia.init();
Julia.eval("println(42)");
Julia.close();
```
</details>

**Expected behavior**
A clear and concise description of what you expected to happen.

**Environment information (please complete the following information):**
 - OS: [e.g. Ubuntu 22.04, macOS 11.1]
 - Julia version: [e.g. 1.8, 1.6]
 - Bun version: [e.g. 0.4.0]

**Additional context**
Add any other context about the problem here.
