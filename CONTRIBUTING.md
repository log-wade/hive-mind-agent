# Contributing to Hive-Mind Agent

Thank you for your interest in contributing. This project is open source and welcomes contributions from everyone.

## How to Contribute

### Reporting Issues

- Use GitHub Issues for bugs, feature requests, or questions
- Search existing issues first to avoid duplicates
- Include steps to reproduce for bugs

### Pull Requests

1. Fork the repository and create a branch (`git checkout -b feature/your-feature`)
2. Make your changes
3. Ensure the project runs: `npm install && node cli.mjs init` (in a temp dir)
4. Submit a PR with a clear description

### Areas We Need Help

- **Adapters:** Postgres/Redis context store, SQS task queue
- **LLM providers:** Additional providers (Gemini, Groq, etc.)
- **Documentation:** Examples, tutorials, non-English docs
- **Testing:** Unit tests, integration tests

### Code Style

- Use ES modules (`.mjs` or `"type": "module"`)
- No build step required—keep it runnable with plain Node
- Prefer minimal dependencies

### License

By contributing, you agree that your contributions will be licensed under the MIT License.
