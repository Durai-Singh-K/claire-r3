# Contributing to WholeSale Connect

First off, thank you for considering contributing to WholeSale Connect! It's people like you that make WholeSale Connect such a great tool for the textile industry.

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the issue list as you might find out that you don't need to create one. When you are creating a bug report, please include as many details as possible:

* **Use a clear and descriptive title**
* **Describe the exact steps which reproduce the problem**
* **Provide specific examples to demonstrate the steps**
* **Describe the behavior you observed after following the steps**
* **Explain which behavior you expected to see instead and why**
* **Include screenshots and animated GIFs if possible**

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, please include:

* **Use a clear and descriptive title**
* **Provide a step-by-step description of the suggested enhancement**
* **Provide specific examples to demonstrate the steps**
* **Describe the current behavior and explain which behavior you expected to see instead**
* **Explain why this enhancement would be useful**

### Pull Requests

* Fill in the required template
* Do not include issue numbers in the PR title
* Follow the JavaScript/React style guide
* Include thoughtfully-worded, well-structured tests
* Document new code
* End all files with a newline

## Development Process

### Setting Up Your Development Environment

1. Fork the repo
2. Clone your fork
3. Create a new branch: `git checkout -b my-branch-name`
4. Install dependencies: `npm run install-all`
5. Set up environment variables (see .env.example files)
6. Start the development server: `npm run dev`

### Coding Standards

#### JavaScript/React

* Use ES6+ features
* Follow React Hooks best practices
* Use functional components over class components
* Implement proper error handling
* Write meaningful variable and function names
* Add comments for complex logic

#### CSS/Tailwind

* Use Tailwind utility classes
* Follow mobile-first responsive design
* Maintain consistent spacing and sizing
* Use CSS custom properties for theme values

#### File Structure

* Components should be in PascalCase
* Utilities and helpers should be in camelCase
* Keep components small and focused
* Separate business logic from UI components

### Commit Messages

* Use the present tense ("Add feature" not "Added feature")
* Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
* Limit the first line to 72 characters or less
* Reference issues and pull requests liberally after the first line

Example:
```
Add voice calling feature

- Implement WebRTC integration
- Add call controls UI
- Handle connection states
- Fix #123
```

### Testing

* Write unit tests for utility functions
* Write integration tests for API endpoints
* Test components with React Testing Library
* Ensure all tests pass before submitting PR

### Documentation

* Update README.md if you change functionality
* Add JSDoc comments for new functions
* Update API documentation for endpoint changes
* Include examples for new features

## Project Structure Guidelines

### Frontend Structure
```
src/
├── components/     # Reusable UI components
├── pages/          # Page components
├── services/       # API and external services
├── store/          # State management
├── hooks/          # Custom React hooks
├── utils/          # Utility functions
└── config/         # Configuration files
```

### Backend Structure
```
backend/
├── controllers/    # Request handlers
├── models/         # Database models
├── routes/         # API routes
├── middleware/     # Custom middleware
├── services/       # Business logic
└── utils/          # Utility functions
```

## Style Guides

### JavaScript Style Guide

* Use 2 spaces for indentation
* Use semicolons
* Use single quotes for strings
* Use template literals for string interpolation
* Use arrow functions for callbacks
* Use async/await over promises when possible

### React/JSX Style Guide

* One component per file
* Use functional components with hooks
* Destructure props
* Use PropTypes or TypeScript for type checking
* Keep components pure when possible
* Use React.memo for performance optimization when needed

### Git Branch Naming

* feature/feature-name
* bugfix/bug-description
* hotfix/critical-fix
* refactor/refactor-description

## Review Process

1. Create a pull request with a clear title and description
2. Link any related issues
3. Wait for review from maintainers
4. Address any requested changes
5. Once approved, your PR will be merged

## Community

* Join our Discord server for discussions
* Follow us on Twitter for updates
* Read our blog for development insights

## Questions?

Feel free to contact the project maintainers if you have any questions or need help getting started.

## License

By contributing to WholeSale Connect, you agree that your contributions will be licensed under its MIT License.

---

Thank you for contributing to WholeSale Connect! 🎉
