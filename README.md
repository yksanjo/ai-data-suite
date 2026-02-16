# AI Data Suite 📊🤖

A collection of AI-powered data and analytics tools using the Model Context Protocol (MCP).

## Projects Included

### 1. Database Interfaces
AI-powered database operations that queries data, creates visualizations, and generates reports.

**Tools:**
- `query_data` - Query database with natural language
- `create_visualization` - Create data visualizations
- `generate_report` - Generate database reports
- `list_tables` - List database tables
- `describe_table` - Get table schema

### 2. Analytics Dashboards
AI-powered analytics that filters data, creates custom views, and exports insights.

**Tools:**
- `filter_data` - Filter dashboard data
- `create_view` - Create custom data views
- `export_insights` - Export analytics insights
- `list_dashboards` - List available dashboards
- `get_metrics` - Get key metrics

### 3. CRM Systems
AI-powered CRM that updates contacts, logs interactions, and creates follow-up tasks.

**Tools:**
- `update_contact` - Update contact information
- `log_interaction` - Log customer interactions
- `create_followup` - Create follow-up tasks
- `list_contacts` - List all contacts
- `search_contacts` - Search contacts

## Getting Started

```bash
# Clone the repository
git clone https://github.com/yksanjo/ai-data-suite.git

# Install dependencies
cd ai-data-suite
npm install

# Run the MCP server
npm start
```

## MCP Server Configuration

Add to your MCP settings:

```json
{
  "mcpServers": {
    "ai-data-suite": {
      "command": "node",
      "args": ["/path/to/ai-data-suite/dist/server.js"]
    }
  }
}
```

## Architecture

- **Read-Only Tools**: Use `readOnlyHint: true` for query/analysis operations
- **State-Modifying Tools**: Require user confirmation before execution
- **Multi-Step Workflows**: Chain tools for complex data tasks

## Badge

[![MCP Server](https://img.shields.io/badge/MCP%20Server-Ready-blue)](https://modelcontextprotocol.io)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-blue)](https://www.typescriptlang.org)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT
