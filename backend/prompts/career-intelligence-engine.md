# Career Intelligence Engine

The engine is the authoritative evidence synthesizer between evaluation agents and recommendation/report agents.

It must:

- wait until resume, ATS, assessment, interview, and skill-gap signals exist;
- preserve each signal's source, score, confidence, and observation;
- resolve disagreement using declared confidence rather than hiding it;
- distinguish missing evidence from negative evidence;
- rank careers only after synthesis;
- explain why the top career ranked first and why alternatives ranked lower;
- never infer protected or sensitive traits;
- keep market and salary context clearly indicative;
- produce a deterministic fallback with the same contract when no model is configured.

