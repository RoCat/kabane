# Kabane - Tickets as Code

📋 A front-end only Kanban board that uses GitHub as a backend. Manage your project tickets as YAML files in your repository.

![License](https://img.shields.io/badge/license-MIT-blue.svg)

## Features

- **Tickets as Code**: Store your tickets as YAML files in a `.kabane/` folder
- **GitHub as Backend**: No database needed - your repository is the single source of truth
- **Kanban Board**: Visual board with drag-and-drop between columns
- **Git-powered**: All changes create commits, giving you full version history
- **Auto-initialization**: Automatically creates `.kabane/` folder if it doesn't exist
- **Permissions Aware**: Read-only mode if you don't have push access
- **Zero Backend**: Uses Personal Access Tokens - no OAuth app or server needed!

## Quick Start (3 minutes)

### 1. Fork or Clone This Repository

```bash
# Clone the repo
git clone https://github.com/RoCat/kabane.git
cd kabane
```

### 2. Configure Your Kabane Instance

Edit `public/kabane.config.json`:

```json
{
  "repository": "owner/repo-with-tickets",
  "defaultBranch": "main"
}
```

That's it! Just specify your target repository.

### 3. Enable GitHub Pages

1. Go to your forked repository on GitHub
2. Click **Settings** → **Pages** (in the left sidebar)
3. Under "Build and deployment", set **Source** to **GitHub Actions**
4. The workflow will automatically deploy on your next push

### 4. Push Your Changes

```bash
# Install dependencies
npm install

# Build for production (optional, to test locally)
npm run build

# Push to GitHub - GitHub Actions will deploy automatically
git add .
git commit -m "Configure Kabane"
git push
```

Your Kanban board will be live at: `https://yourusername.github.io/kabane/`

### 5. Create a Fine-grained Personal Access Token

1. Go to [GitHub Fine-grained Token Settings](https://github.com/settings/personal-access-tokens/new)
2. **Token name**: `Kabane` (or whatever you prefer)
3. **Expiration**: Choose an expiration (90 days recommended)
4. **Repository access**: Select **"Only select repositories"** → choose your target repo
5. **Permissions**:
   - Repository permissions → **Contents** → **Read and write**
6. Click **Generate token** and copy it
7. Paste it in the Kabane login page

> 💡 **Why fine-grained?** Unlike classic tokens, fine-grained tokens only have access to the repositories you specify. Much safer!

### 6. Initialize Your Target Repository

When you first sign in, Kabane will detect that your target repository doesn't have a `.kabane/` folder and offer to create it with default configuration.

**That's it!** 🎉

## How It Works

### Repository Structure

Kabane stores all configuration and tickets in the `.kabane/` folder of your target repository:

```
your-repo/
├── .kabane/
│   ├── columns.yml        # Kanban column definitions
│   ├── ticketTypes.yml    # Ticket type definitions
│   ├── versions.yml       # Version/sprint definitions
│   └── tickets/
│       ├── epic-auth.yml
│       ├── story-login.yml
│       ├── bug-safari.yml
│       └── task-rate-limit.yml
└── ... your other code
```

### columns.yml

Defines your Kanban columns. Note that the **Backlog** column is automatically added and cannot be customized - it's always the first column:

```yaml
# The Backlog column is automatically added
# Define your workflow columns here:

columns:
  - id: todo
    name: To Do
    statuses:
      - todo
    color: "#58a6ff"

  - id: in-progress
    name: In Progress
    statuses:
      - in-progress
      - review
    color: "#d29922"

  - id: done
    name: Done
    statuses:
      - done
    color: "#3fb950"
```

### ticketTypes.yml

Defines your ticket types:

```yaml
ticketTypes:
  - id: epic
    name: Epic
    icon: "🎯"
    color: "#a371f7"

  - id: story
    name: Story
    icon: "📖"
    color: "#58a6ff"

  - id: bug
    name: Bug
    icon: "🐛"
    color: "#f85149"

  - id: task
    name: Task
    icon: "✅"
    color: "#3fb950"
```

### versions.yml

Defines your versions/sprints. Versions allow you to organize tickets into releases or sprints:

```yaml
versions:
  - id: v-sprint-1
    name: Sprint 1
    status: active
    startDate: '2024-01-15'
    targetDate: '2024-01-29'
    description: Initial sprint - Core features

  - id: v-sprint-2
    name: Sprint 2
    status: planning
    startDate: '2024-01-29'
    targetDate: '2024-02-12'
    description: Second sprint - Enhancements
```

**How versions work:**
- The **Backlog** column always shows tickets without a version (shared across all versions)
- When you select a version, other columns only show tickets assigned to that version
- Dragging a ticket from Backlog to another column assigns it to the selected version
- Dragging a ticket to Backlog removes its version assignment

### Ticket Format

Each ticket is a YAML file in `.kabane/tickets/`:

```yaml
title: Implement login form
type: story
status: in-progress
priority: high
version: v-sprint-1
assignees:
  - johndoe
  - janedoe
labels:
  - frontend
  - auth
estimate: 5
dueDate: 2024-03-15
parent: epic-auth
description: |
  Create a responsive login form with email and password fields.

  ## Acceptance Criteria

  - [ ] Email validation
  - [ ] Password strength indicator
  - [ ] Remember me checkbox
  - [ ] Forgot password link
createdAt: "2024-01-15T10:00:00Z"
updatedAt: "2024-01-20T14:30:00Z"
```

### Ticket Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | Yes | Ticket title |
| `type` | enum | Yes | `epic`, `story`, `bug`, `task` (or custom types) |
| `status` | string | Yes | Maps to Kanban columns |
| `priority` | enum | No | `low`, `medium`, `high`, `critical` |
| `version` | string | No | Version/sprint ID |
| `assignees` | string[] | No | GitHub usernames |
| `labels` | string[] | No | Custom labels |
| `estimate` | number | No | Story points |
| `dueDate` | string | No | ISO date string |
| `parent` | string | No | Parent ticket ID |
| `description` | string | No | Markdown description |
| `createdAt` | string | No | ISO date string |
| `updatedAt` | string | No | ISO date string (auto-updated) |

## Configuration

### Kabane Deployment Config

The `kabane.config.json` file (in the `public/` folder) only needs to point to your target repository:

```json
{
  "repository": "owner/repo",
  "defaultBranch": "main"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `repository` | string | **Yes** | Target repository (owner/repo) |
| `defaultBranch` | string | No | Branch to read/write tickets (default: `main`) |

### Target Repository Config

The actual board configuration lives in your target repository's `.kabane/` folder:

- `.kabane/columns.yml` - Kanban columns (Backlog is automatic)
- `.kabane/ticketTypes.yml` - Ticket types
- `.kabane/versions.yml` - Versions/sprints

This means you can have **one Kabane deployment** for **multiple repositories**, just by changing the `repository` in the URL or config!

## How Authentication Works

Kabane uses GitHub Personal Access Tokens (PAT):

1. You create a token at github.com/settings/tokens
2. Paste it in Kabane's login page
3. The token is stored only in your browser session (cleared when you close the browser)
4. All API calls go directly to GitHub

**No server required!** Your token is never sent anywhere except GitHub's API.

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Architecture

```
src/
├── api/           # GitHub API client (including .kabane folder operations)
├── auth/          # Personal Access Token authentication
├── components/    # LitElement components
├── styles/        # Shared CSS styles
├── types/         # TypeScript type definitions
├── utils/         # Utility functions (YAML parser, etc.)
└── main.ts        # Application entry point

public/
└── kabane.config.json  # Your configuration (edit this!)

examples/
└── .kabane/       # Example .kabane folder structure
```

### Key Design Decisions

1. **No Backend**: Everything runs in the browser using GitHub's REST API
2. **Personal Access Tokens**: Simple auth without OAuth complexity
3. **Token in Session**: Access tokens stored in sessionStorage (cleared on browser close)
4. **Config in Target Repo**: Columns and ticket types stored in the target repo, not deployment
5. **Fixed Backlog**: Backlog column is always present and shows tickets without version
6. **Version Filtering**: Select a version to focus on tickets for that sprint/release
7. **LitElement**: Lightweight web components without heavy framework overhead
8. **Git as Database**: Every change creates a commit for full traceability
9. **Pure YAML**: Tickets are pure YAML files (no front-matter complexity)

## Security Considerations

- Access tokens are stored in sessionStorage (cleared when browser closes)
- Tokens are never sent anywhere except GitHub's API
- You can revoke tokens anytime at github.com/settings/tokens
- Read-only mode automatically enabled without push permissions

## Browser Support

- Chrome 88+
- Firefox 78+
- Safari 14+
- Edge 88+

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Please read the contributing guidelines before submitting a PR.

---

Made with ❤️ for developers who love keeping everything in Git.
