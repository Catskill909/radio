# StationDock Beta Roadmap 🚀

> **Current Phase:** Feature Development → Beta Preparation  
> **Target:** Beta release to pilot radio station

---

## Quick Status

| Area | Status | Notes |
|------|--------|-------|
| Core Features | ✅ Complete | Shows, scheduling, recording, podcasting |
| Stream Alerts | 🔄 Phase 1 Done | SMTP + UI complete, hook-up pending |
| Testing | ⚠️ Needs Work | No automated tests, manual testing only |
| Security | ✅ Good | Auth, encryption, admin-only access |
| Documentation | ✅ Excellent | README, help system, feature docs |

---

## Areas to Watch ⚠️

### 1. Scope Creep Risk
The app has a solid core. Resist adding "nice to have" features until beta is battle-tested. The P2/P3 roadmap in `features.md` is extensive — **prioritize stability over new features**.

### 2. Single-User Limitation
Current architecture assumes one admin user. Multi-user with roles will require significant refactoring:
- User model with roles (Admin, DJ, Scheduler)
- Permission checks on all admin actions
- Session management per user
- Audit logging

**Recommendation:** Ship beta as single-user, gather feedback, then revisit.

### 3. Error Handling & Resilience
The recorder service and stream health need improved reliability:
- [ ] Retry logic for transient stream failures
- [ ] Graceful degradation when streams are unreachable
- [ ] Better logging for debugging production issues
- [ ] Alerting when recorder service crashes

---

## Beta Readiness Checklist

### Phase 1: Core Stability ✅
- [x] Show management (CRUD, metadata, artwork)
- [x] Calendar scheduling (week/day views, recurring, conflicts)
- [x] Automated recording (background service, transcoding)
- [x] Podcast publishing (RSS feeds, episode editing)
- [x] Stream monitoring (health checks, status dashboard)
- [x] Audio editor (trim, fade, normalize)
- [x] Public listen page (schedule, player, now-playing)
- [x] Import/Export (full station backup/restore)

### Phase 2: Stream Alerts 🔄
- [x] SMTP configuration with encrypted passwords
- [x] Alert recipients management UI
- [x] Alert preferences (cooldown, recovery, scope)
- [ ] **Phase 1C:** Wire health check → email sending
- [ ] Test alert emails in production

### Phase 3: Testing & QA ⏳
- [ ] Manual test plan document for core flows
- [ ] Test recording workflow end-to-end
- [ ] Test podcast feed generation
- [ ] Test import/export cycle
- [ ] Cross-browser testing (Chrome, Firefox, Safari)
- [ ] Mobile responsive testing

### Phase 4: Security Hardening ⏳
- [x] Admin password authentication
- [x] SMTP password encryption (AES-256)
- [x] HTTP-only session cookies
- [ ] Review all public API endpoints
- [ ] Rate limiting on sensitive endpoints
- [ ] Input sanitization audit

### Phase 5: Production Readiness ⏳
- [ ] Error monitoring setup (Sentry or similar)
- [ ] Backup strategy documented
- [ ] Runbook for common issues
- [ ] Deployment checklist verified
- [ ] Performance review under load

### Phase 6: Beta Launch 🎯
- [ ] Pilot station identified
- [ ] Onboarding documentation
- [ ] Feedback collection mechanism
- [ ] Support channel established
- [ ] 2-week beta period minimum

---

## Next Actions (Priority Order)

1. **Complete Phase 1C** — Stream health → email alerts integration
2. **Create manual test plan** — Document core workflow tests
3. **Review public endpoints** — Security audit of /api/public/*
4. **Set up error monitoring** — Track production issues
5. **Beta pilot outreach** — Identify willing test station

---

## Key Documents

| Document | Purpose |
|----------|---------|
| [README.md](../README.md) | Project overview & setup |
| [features.md](../features.md) | Complete feature catalogue & roadmap |
| [STREAM_ALERTS_FAILOVER_PLAN.md](./STREAM_ALERTS_FAILOVER_PLAN.md) | Stream alerts implementation plan |
| [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) | Coolify/SQLite deployment |
| [PRISMA_WORKFLOW.md](./PRISMA_WORKFLOW.md) | Database migration guide |
| [STYLE_GUIDE.md](./STYLE_GUIDE.md) | UI/UX design patterns |

---

## Session Log

Track completed work sessions here for continuity:

| Date | Work Completed |
|------|----------------|
| 2024-12-21 | Phase 1A/1B Stream Alerts (SMTP + Alert UI), Features page update, Help docs |
| | UI polish: side-by-side layout, autofill fix, ACRCloud revert |
| | Master plan updated, Beta Roadmap created |

---

*Last updated: 2024-12-21*
