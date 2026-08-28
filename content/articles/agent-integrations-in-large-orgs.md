---
title: How agent integrations get built inside large organisations
description: Registries, auth brokering, generated tool schemas and the org failure modes that stall internal agent platforms — grounded in public specs.
date: 2026-08-28
updated: 2026-08-28
tags: [agents, mcp, integrations, platform-engineering, auth]
---

## The shape of the problem

An agent is worth exactly the set of systems it can reach. Everything else is a demo.

Inside a company of any size, reaching a system means clearing four separate gates for every service: an auth scheme somebody else chose, a rate limit somebody else tuned, a data-access policy somebody else owns, and a team whose roadmap does not include you. Four gates times fifty services is the actual project. The model is not the hard part and has not been for a while.

This is the generic version of a problem I keep seeing solved the same way in different buildings. The convergent shape is worth writing down, because if you know the shape you can skip about six months of rediscovering it.

## Why everyone builds a registry

The first version of an internal agent always hand-rolls HTTP calls. Someone writes a Python function that hits the ticketing API, pastes a bearer token into a config, and it works. The second and third teams do the same thing against the same API with different tokens, different retry logic and no shared record that any of it exists.

Then the org builds a registry. Not because registries are elegant, but because four questions have no answer without one:

| Question | What the registry answers |
|---|---|
| What can an agent do here? | Discovery — one catalogue instead of tribal knowledge |
| Who authorised this call? | A single auth path per connector, not per caller |
| How do we turn it off? | One revocation point when a credential leaks |
| What did it touch last Tuesday? | Audit that spans agents, not per-team logs |

The prior art is not from the agent world. Backstage's software catalogue does this for services: teams commit a metadata YAML alongside the code, the catalogue harvests it, and the stated goal is that "no more orphan software" hides in dark corners of the org ([Backstage docs](https://backstage.io/docs/features/software-catalog/)). Ownership lives with the team, discovery is central. An agent tool registry that works has the same split. Ownership decentralised, index centralised.

MCP encodes the same split at the protocol level. A server declares a `tools` capability and answers `tools/list`; a client discovers what exists at connect time rather than at build time. Servers that declare `listChanged` push a `notifications/tools/list_changed` when the set changes, so the catalogue is live rather than a checked-in manifest ([MCP tools spec](https://modelcontextprotocol.io/specification/2025-06-18/server/tools)).

My read: the registry is the cheap part and it is still the part orgs get wrong, because a registry with no owner rots into a list of dead endpoints within two quarters. More on that below.

## Auth brokering is the whole project

Everything else on this page is a week of work. This part is a year.

There are two modes, and confusing them is the most common design error I see.

**Service-to-service.** The agent platform holds its own identity and calls downstream with its own credential. Easy to build, and wrong for anything touching user data, because every downstream audit log now reads `agent-platform` and every access check has to be re-implemented inside the agent.

**On-behalf-of-user.** The agent carries a credential scoped to the human who asked. Downstream permission checks work unchanged. Audit logs name a person. This is the correct default and it is genuinely hard.

The public app platforms model the distinction cleanly. Slack's OAuth v2 splits the request into `scope` (bot token, the app's own identity) and `user_scope` (user token, acting on behalf of a user), and you request both when you need both ([Slack OAuth docs](https://docs.slack.dev/authentication/installing-with-oauth)). GitHub Apps have three credentials for three situations: a JWT to authenticate as the app, an installation access token to act as the installation, and a user access token so the app "only takes actions that could be performed by a specific user" ([GitHub docs](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/about-authentication-with-a-github-app)).

GitHub's installation token also demonstrates the two properties an internal broker needs. It **expires after 1 hour**, and when you mint one you can pass `repositories` and `permissions` to narrow it below what the app was granted ([token generation docs](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/generating-an-installation-access-token-for-a-github-app)). Short-lived, and downscoped at mint time rather than at grant time. Copy that.

The mechanism for doing this generically is [RFC 8693 token exchange](https://www.rfc-editor.org/rfc/rfc8693.html). Grant type `urn:ietf:params:oauth:grant-type:token-exchange`, a `subject_token` for the user whose rights are being used, an optional `actor_token` for the thing doing the acting. The RFC's distinction between **impersonation** (the agent becomes indistinguishable from the user) and **delegation** (the agent keeps its own identity, expressed in an `act` claim, while carrying the user's rights) is the design decision, and delegation is the one you want. When the audit trail says "agent X acting for user Y," an incident review takes an afternoon rather than a week. `audience` and `scope` on the exchange request are how you narrow per call.

### The confused deputy, made worse

An agent reads text and then acts on it. That text can contain instructions. This turns a classic confused-deputy problem into a routine one.

MCP's security best practices document spells out the specific version: a proxy server with a static client ID to a third-party auth server, plus dynamic client registration, plus a consent cookie set on first authorisation, equals an attacker who can register a client with their own `redirect_uri` and have the auth server skip the consent screen entirely because the cookie is already there ([MCP security best practices](https://modelcontextprotocol.io/specification/2025-06-18/basic/security_best_practices)). Required mitigations: per-client consent stored server-side and checked *before* forwarding, exact-string `redirect_uri` matching with no wildcards, and single-use `state` values stored only after consent is approved.

The related rule is short enough to memorise. **Token passthrough is forbidden.** An MCP server "MUST NOT accept any tokens that were not explicitly issued for the MCP server," and if it calls an upstream API it must obtain a separate token rather than forwarding the one it received. The enforcement mechanism is [RFC 8707](https://www.rfc-editor.org/rfc/rfc8707.html) resource indicators: clients MUST send `resource` on authorisation and token requests, servers MUST validate they are the intended audience ([MCP authorization spec](https://modelcontextprotocol.io/specification/2025-06-18/basic/authorization)).

If your internal broker forwards the caller's token to the downstream service unchanged, you have built the anti-pattern. It will pass review the first time, because it works.

## Tool definitions are an interface contract

Hand-written tool schemas drift. The API adds a required field, the schema does not, and the agent starts failing in a way that looks like a model problem for the two days it takes anyone to check the spec.

Generate them. FastMCP's `from_openapi()` turns every endpoint in a spec into a tool by default, deriving names from `operationId`, with `RouteMap` rules that can mark internal or admin routes as `EXCLUDE` ([FastMCP OpenAPI docs](https://gofastmcp.com/integrations/openapi)). Protobuf service definitions work the same way. The generator is a day of work and it removes an entire class of drift bug permanently.

The one field you cannot generate is `description`, and it is the field that decides whether the agent works.

That field is prompt text. The model reads it and nothing else when choosing between two similar tools. Anthropic's guidance on this is blunt: "even small refinements to tool descriptions can yield dramatic improvements," and "too many tools or overlapping tools can also distract agents from pursuing efficient strategies" ([Writing tools for agents](https://www.anthropic.com/engineering/writing-tools-for-agents)). Namespacing under common prefixes is the recommended way to draw boundaries when there are many.

A generic example of a description doing real work:

```json
{
  "name": "ticketing_search_issues",
  "description": "Search issues in the ticketing system by text query. Returns at most 25 results, newest first. Use this to FIND an issue when you only know words from its title or body. Do NOT use this to fetch a known issue by ID — use ticketing_get_issue, which is cheaper and returns full body text. This tool cannot see issues in restricted projects the calling user lacks read access to; those are silently omitted.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "query":   { "type": "string", "description": "Free-text search terms. Not a query language; boolean operators are ignored." },
      "project": { "type": "string", "description": "Optional project key to restrict the search, e.g. PLAT." }
    },
    "required": ["query"]
  }
}
```

Three things in there are absent from any OpenAPI spec: when *not* to use it, what the cheaper alternative is, and that results are silently filtered by the caller's permissions. All three are the difference between a working agent and a confusing one. Write them by hand, keep them next to the generator config, and diff them in review like code.

Two mechanical consequences worth knowing. Tool definitions sit **first** in the cacheable prefix (the order is `tools`, `system`, then `messages`) and modifying tool definitions "invalidates the entire cache" at every level ([prompt caching docs](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)). A registry that returns tools in nondeterministic order destroys the cache on every request. Sort the list. See [prompt caching across harnesses](/prompt-caching-across-harnesses) for what that costs, and [prefill vs decode](/prefill-vs-decode) for why a 40k-token tool prefix is a prefill bill you pay on every turn.

## Shipping it

The deployment path is boring and should stay boring: the connector is a service, so it ships like a service. Internal PaaS or a Kubernetes target, staged environments, a review gate before production credentials are issued. Kubernetes operators are the closest structural analogue for the runtime — a control loop reconciling declared connector state against what is actually registered.

Observability is where agent work differs from normal service work, and the three things you need are specific:

1. **A trace that spans the agent loop**, not just individual HTTP calls. One trace ID from user turn through every tool call and back, or you cannot answer "why did it do that."
2. **Per-tool latency and error rate**, broken out by tool name. Tool sprawl is invisible until you can see that eleven tools have never been called and three account for 90% of errors.
3. **Replayable transcripts.** The full message list including tool schemas as they were at the time. Without the schema snapshot you cannot reproduce a failure after someone edits a description.

## What actually kills these projects

Not the model, and not the protocol. Roughly in order of how often they are the cause:

**Data-owner sign-off has no SLA.** Every connector touching user data needs approval from whoever owns that data. That review is unbudgeted, unqueued and unowned, so it takes as long as it takes. Fifteen connectors at three weeks each, serialised through one privacy reviewer, is your actual delivery date.

**Nobody owns the registry.** It gets built by whichever team needed it first, then that team reorgs. Entries rot. New teams route around it because the thing they need is not in it, which makes it less complete, which makes more teams route around it.

**Tool sprawl.** This one has numbers now. GitHub cut Copilot's default toolset to 13 core tools and grouped the rest into four virtual categories, reporting a 2–5 percentage point improvement in success rate on SWE-Lancer and SWE-bench Verified across GPT-5 and Sonnet 4.5, plus roughly 400ms lower response latency in online A/B testing ([GitHub blog](https://github.blog/ai-and-ml/github-copilot/how-were-making-github-copilot-smarter-with-fewer-tools/)). A registry with 200 entries and no selection layer is worse than one with 15. Treat it as a [context engineering](/context-engineering-for-coding-agents) problem, because that is what it is: filter to a task-relevant subset before the request, or accept the degradation.

**The long tail has no API.** A meaningful fraction of internal systems expose a web UI, a shared spreadsheet, or a nightly CSV drop. There is no clean connector for these. Someone will propose browser automation. Budget for it being flaky and scope it to read-only.

MCP's own scope-minimisation guidance names the pattern that makes all of this worse — publishing every possible scope in `scopes_supported` and using omnibus scopes like `*` or `full-access`, which drives consent abandonment and makes revocation disruptive. Start with a minimal read-only scope set and elevate on demand via `WWW-Authenticate` challenges.

## What MCP actually changed

It did not solve auth. The hard parts of auth are still hard, and the spec mostly points at OAuth 2.1, RFC 8707 and RFC 9728 rather than replacing them.

What it changed is the coupling. Before a standard protocol, an internal tool server was written against one agent framework, and moving to a different framework meant rewriting the integration layer. Now the server is written once and any client speaking the protocol consumes it — an IDE assistant, a chat surface, a CI job, a different vendor's model entirely. `tools/list` and `tools/call` are the whole contract for tools.

My read on why that matters organisationally rather than technically: it changes who has to say yes. The team that owns a service can stand up a server for their own data and put it in the registry, without the agent platform team writing a line of code and without a framework migration hanging over the decision. That removes the single worst bottleneck in this whole design, which was never a technical one.
