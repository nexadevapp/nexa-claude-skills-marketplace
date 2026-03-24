# External Dependency Mocking

## Instructions

When implementing code that involves an external dependency, never require real API keys or credentials.
Instead, set up mocks or local replacements following the strategies below.

## Dependency Strategies

| Dependency | Strategy |
|---|---|
| Google OAuth | Mock OAuth flow with hardcoded test tokens |
| Other OAuth (Facebook, GitHub, Apple) | Mock OAuth flow with hardcoded test tokens |
| Stripe / Payments | Use Stripe test mode keys or mock HTTP calls |
| Database | **Testcontainers** with the same DB engine as production (e.g., PostgreSQL, MySQL), seeded with test data |
| Email (SendGrid, SES, SMTP) | **Testcontainers** running Mailpit for full email lifecycle (capture, view, click links) |
| S3 / Cloud Storage | **Testcontainers** running MinIO (S3-compatible API) |
| SMS (Twilio, etc.) | Log to console/file, mock delivery status callbacks |
| Redis / Cache | **Testcontainers** running Redis |
| Message Queues (RabbitMQ, SQS) | **Testcontainers** running RabbitMQ (or LocalStack for SQS) |
| Search (Elasticsearch, Algolia) | **Testcontainers** running Elasticsearch/OpenSearch |
| reCAPTCHA / hCaptcha | Bypass in test mode, always pass |
| Webhooks (incoming) | Mock with local HTTP endpoints |
| AI/ML APIs (OpenAI, Claude) | Mock responses with fixtures |
| Maps / Geocoding (Google Maps) | Return hardcoded coordinates/results |
| Push Notifications (Firebase, APNs) | Log instead of sending |
| PDF Generation | Use local library, no external service |
| Analytics (Segment, Mixpanel) | No-op or log to console |
| Monitoring (Sentry, Datadog) | Disable or log locally |

## Test Data Conventions

- Use only `example.com` for test emails and accounts (e.g., `user@example.com`, `admin@example.com`). This is an IANA-reserved domain that will never route real mail.

## How to Apply

1. When a use case requires an external dependency, check this table for the mocking strategy
2. For Testcontainers-based dependencies, configure the container in the test setup so it starts automatically and is torn down after tests complete
3. For mocked APIs, create the mock at the service boundary so the rest of the code is unaware it is not talking to the real service
4. Use environment variables to switch between mock and real services (e.g., `SMTP_HOST=localhost` for Mailpit)
