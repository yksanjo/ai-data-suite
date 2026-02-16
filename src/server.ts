import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

// ============ DATA STORES (In-Memory for MVP) ============
interface Table {
  name: string;
  columns: { name: string; type: string }[];
  data: Record<string, any>[];
}

interface Dashboard {
  id: string;
  name: string;
  widgets: Widget[];
  filters: Record<string, any>;
}

interface Widget {
  id: string;
  type: string;
  title: string;
  dataSource: string;
}

interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  role: string;
  tags: string[];
  lastInteraction: Date;
  createdAt: Date;
}

interface Interaction {
  id: string;
  contactId: string;
  type: 'call' | 'email' | 'meeting' | 'note';
  description: string;
  date: Date;
}

interface FollowUp {
  id: string;
  contactId: string;
  title: string;
  description: string;
  dueDate: Date;
  status: 'pending' | 'completed';
  createdAt: Date;
}

// In-memory data stores
const tables: Map<string, Table> = new Map();
const dashboards: Map<string, Dashboard> = new Map();
const contacts: Map<string, Contact> = new Map();
const interactions: Map<string, Interaction> = new Map();
const followUps: Map<string, FollowUp> = new Map();

// Seed mock data
const mockTables: Table[] = [
  { name: 'users', columns: [{ name: 'id', type: 'integer' }, { name: 'name', type: 'string' }, { name: 'email', type: 'string' }, { name: 'created_at', type: 'date' }], data: [{ id: 1, name: 'John Doe', email: 'john@example.com', created_at: '2024-01-15' }, { id: 2, name: 'Jane Smith', email: 'jane@example.com', created_at: '2024-02-01' }] },
  { name: 'orders', columns: [{ name: 'id', type: 'integer' }, { name: 'user_id', type: 'integer' }, { name: 'total', type: 'decimal' }, { name: 'status', type: 'string' }], data: [{ id: 101, user_id: 1, total: 99.99, status: 'completed' }, { id: 102, user_id: 2, total: 149.99, status: 'pending' }] },
  { name: 'products', columns: [{ name: 'id', type: 'integer' }, { name: 'name', type: 'string' }, { name: 'price', type: 'decimal' }, { name: 'category', type: 'string' }], data: [{ id: 1, name: 'Widget', price: 29.99, category: 'Electronics' }, { id: 2, name: 'Gadget', price: 49.99, category: 'Electronics' }] },
];
mockTables.forEach(t => tables.set(t.name, t));

// Helper functions
function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

// ============ TOOL DEFINITIONS ============

// Database Tools
const databaseTools = [
  {
    name: 'list_tables',
    description: 'List all tables in the database',
    inputSchema: { type: 'object', properties: {} },
    annotations: { readOnlyHint: true },
  },
  {
    name: 'describe_table',
    description: 'Get table schema and structure',
    inputSchema: {
      type: 'object',
      properties: { tableName: { type: 'string', description: 'Table name' } },
      required: ['tableName'],
    },
    annotations: { readOnlyHint: true },
  },
  {
    name: 'query_data',
    description: 'Query database with natural language',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Natural language query' },
        tableName: { type: 'string', description: 'Table to query' },
      },
      required: ['query'],
    },
    annotations: { readOnlyHint: true },
  },
  {
    name: 'create_visualization',
    description: 'Create a data visualization',
    inputSchema: {
      type: 'object',
      properties: {
        type: { type: 'string', enum: ['bar', 'line', 'pie', 'table'] },
        dataSource: { type: 'string', description: 'Data source table' },
        xAxis: { type: 'string', description: 'X-axis field' },
        yAxis: { type: 'string', description: 'Y-axis field' },
        title: { type: 'string', description: 'Chart title' },
      },
      required: ['type', 'dataSource'],
    },
  },
  {
    name: 'generate_report',
    description: 'Generate a database report',
    inputSchema: {
      type: 'object',
      properties: {
        tableName: { type: 'string', description: 'Table to report on' },
        format: { type: 'string', enum: ['summary', 'detailed', 'statistical'] },
      },
      required: ['tableName'],
    },
    annotations: { readOnlyHint: true },
  },
];

// Analytics Dashboard Tools
const analyticsTools = [
  {
    name: 'list_dashboards',
    description: 'List all available dashboards',
    inputSchema: { type: 'object', properties: {} },
    annotations: { readOnlyHint: true },
  },
  {
    name: 'create_dashboard',
    description: 'Create a new analytics dashboard',
    inputSchema: {
      type: 'object',
      properties: { name: { type: 'string', description: 'Dashboard name' } },
      required: ['name'],
    },
  },
  {
    name: 'filter_data',
    description: 'Filter data on a dashboard',
    inputSchema: {
      type: 'object',
      properties: {
        dashboardId: { type: 'string', description: 'Dashboard ID' },
        field: { type: 'string', description: 'Field to filter' },
        operator: { type: 'string', enum: ['equals', 'contains', 'greater_than', 'less_than'] },
        value: { type: 'string', description: 'Filter value' },
      },
      required: ['dashboardId', 'field', 'value'],
    },
  },
  {
    name: 'create_view',
    description: 'Create a custom data view',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'View name' },
        source: { type: 'string', description: 'Data source' },
        columns: { type: 'array', items: { type: 'string' } },
      },
      required: ['name', 'source'],
    },
  },
  {
    name: 'get_metrics',
    description: 'Get key metrics from a dashboard',
    inputSchema: {
      type: 'object',
      properties: {
        dashboardId: { type: 'string', description: 'Dashboard ID' },
        metrics: { type: 'array', items: { type: 'string' } },
      },
      required: ['dashboardId'],
    },
    annotations: { readOnlyHint: true },
  },
  {
    name: 'export_insights',
    description: 'Export analytics insights',
    inputSchema: {
      type: 'object',
      properties: {
        dashboardId: { type: 'string', description: 'Dashboard ID' },
        format: { type: 'string', enum: ['csv', 'pdf', 'excel'] },
      },
      required: ['dashboardId', 'format'],
    },
    annotations: { readOnlyHint: true },
  },
];

// CRM Tools
const crmTools = [
  {
    name: 'create_contact',
    description: 'Create a new contact',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Contact name' },
        email: { type: 'string', description: 'Email address' },
        phone: { type: 'string', description: 'Phone number' },
        company: { type: 'string', description: 'Company name' },
        role: { type: 'string', description: 'Job role' },
      },
      required: ['name', 'email'],
    },
  },
  {
    name: 'update_contact',
    description: 'Update contact information',
    inputSchema: {
      type: 'object',
      properties: {
        contactId: { type: 'string', description: 'Contact ID' },
        name: { type: 'string', description: 'New name' },
        email: { type: 'string', description: 'New email' },
        phone: { type: 'string', description: 'New phone' },
        company: { type: 'string', description: 'New company' },
      },
      required: ['contactId'],
    },
  },
  {
    name: 'list_contacts',
    description: 'List all contacts',
    inputSchema: {
      type: 'object',
      properties: {
        company: { type: 'string', description: 'Filter by company' },
        tag: { type: 'string', description: 'Filter by tag' },
      },
    },
    annotations: { readOnlyHint: true },
  },
  {
    name: 'search_contacts',
    description: 'Search contacts by name, email, or company',
    inputSchema: {
      type: 'object',
      properties: { query: { type: 'string', description: 'Search query' } },
      required: ['query'],
    },
    annotations: { readOnlyHint: true },
  },
  {
    name: 'log_interaction',
    description: 'Log an interaction with a contact',
    inputSchema: {
      type: 'object',
      properties: {
        contactId: { type: 'string', description: 'Contact ID' },
        type: { type: 'string', enum: ['call', 'email', 'meeting', 'note'] },
        description: { type: 'string', description: 'Interaction details' },
      },
      required: ['contactId', 'type', 'description'],
    },
  },
  {
    name: 'create_followup',
    description: 'Create a follow-up task for a contact',
    inputSchema: {
      type: 'object',
      properties: {
        contactId: { type: 'string', description: 'Contact ID' },
        title: { type: 'string', description: 'Task title' },
        description: { type: 'string', description: 'Task description' },
        dueDate: { type: 'string', description: 'Due date (YYYY-MM-DD)' },
      },
      required: ['contactId', 'title', 'dueDate'],
    },
  },
  {
    name: 'list_followups',
    description: 'List follow-up tasks',
    inputSchema: {
      type: 'object',
      properties: {
        contactId: { type: 'string', description: 'Filter by contact' },
        status: { type: 'string', enum: ['pending', 'completed'] },
      },
    },
    annotations: { readOnlyHint: true },
  },
];

// Combine all tools
const allTools = [...databaseTools, ...analyticsTools, ...crmTools];

// ============ TOOL EXECUTION HANDLERS ============

async function handleToolCall(name: string, args: any): Promise<any> {
  switch (name) {
    // Database
    case 'list_tables': {
      const tableList = Array.from(tables.values()).map(t => t.name);
      return { success: true, tables: tableList };
    }
    
    case 'describe_table': {
      const table = tables.get(args.tableName);
      if (!table) return { success: false, error: 'Table not found' };
      return { success: true, schema: table };
    }
    
    case 'query_data': {
      const table = tables.get(args.tableName || 'users');
      if (!table) return { success: false, error: 'Table not found' };
      
      // Simple mock query (filter by any field)
      let results = table.data;
      const query = args.query.toLowerCase();
      
      // Apply simple filters based on query
      if (query.includes('>')) {
        const parts = query.split('>');
        const field = parts[0].trim();
        const value = parseFloat(parts[1]);
        results = results.filter((row: any) => row[field] > value);
      }
      
      return { success: true, data: results, count: results.length };
    }
    
    case 'create_visualization': {
      return {
        success: true,
        visualization: {
          id: generateId(),
          type: args.type,
          title: args.title || 'Chart',
          dataSource: args.dataSource,
          xAxis: args.xAxis,
          yAxis: args.yAxis,
          status: 'created',
        }
      };
    }
    
    case 'generate_report': {
      const table = tables.get(args.tableName);
      if (!table) return { success: false, error: 'Table not found' };
      
      const numericCols = table.columns.filter(c => c.type === 'decimal' || c.type === 'integer');
      const report: any = {
        tableName: args.tableName,
        rowCount: table.data.length,
        columns: table.columns.length,
      };
      
      if (args.format === 'summary' || args.format === 'statistical') {
        report.summary = {
          columns: table.columns.map(c => c.name),
          types: table.columns.map(c => c.type),
        };
      }
      
      if (args.format === 'statistical' && numericCols.length > 0) {
        report.statistics = {};
        numericCols.forEach(col => {
          const values = table.data.map((row: any) => row[col.name]).filter(v => typeof v === 'number');
          if (values.length > 0) {
            report.statistics[col.name] = {
              sum: values.reduce((a: number, b: number) => a + b, 0),
              avg: values.reduce((a: number, b: number) => a + b, 0) / values.length,
              min: Math.min(...values),
              max: Math.max(...values),
            };
          }
        });
      }
      
      return { success: true, report };
    }

    // Analytics
    case 'list_dashboards': {
      const dashList = Array.from(dashboards.values()).map(d => ({ id: d.id, name: d.name }));
      return { success: true, dashboards: dashList };
    }
    
    case 'create_dashboard': {
      const dashboard: Dashboard = {
        id: generateId(),
        name: args.name,
        widgets: [],
        filters: {},
      };
      dashboards.set(dashboard.id, dashboard);
      return { success: true, dashboard };
    }
    
    case 'filter_data': {
      const dashboard = dashboards.get(args.dashboardId);
      if (!dashboard) return { success: false, error: 'Dashboard not found' };
      
      dashboard.filters[args.field] = { operator: args.operator, value: args.value };
      return { success: true, filters: dashboard.filters };
    }
    
    case 'create_view': {
      return {
        success: true,
        view: {
          id: generateId(),
          name: args.name,
          source: args.source,
          columns: args.columns || [],
          status: 'created',
        }
      };
    }
    
    case 'get_metrics': {
      return {
        success: true,
        metrics: args.metrics?.map((m: string) => ({ name: m, value: Math.floor(Math.random() * 1000) })) || [],
      };
    }
    
    case 'export_insights': {
      return {
        success: true,
        export: {
          dashboardId: args.dashboardId,
          format: args.format,
          fileName: `insights_${Date.now()}.${args.format}`,
          status: 'ready',
        }
      };
    }

    // CRM
    case 'create_contact': {
      const contact: Contact = {
        id: generateId(),
        name: args.name,
        email: args.email,
        phone: args.phone || '',
        company: args.company || '',
        role: args.role || '',
        tags: [],
        lastInteraction: new Date(),
        createdAt: new Date(),
      };
      contacts.set(contact.id, contact);
      return { success: true, contact };
    }
    
    case 'update_contact': {
      const contact = contacts.get(args.contactId);
      if (!contact) return { success: false, error: 'Contact not found' };
      
      if (args.name) contact.name = args.name;
      if (args.email) contact.email = args.email;
      if (args.phone) contact.phone = args.phone;
      if (args.company) contact.company = args.company;
      
      return { success: true, contact };
    }
    
    case 'list_contacts': {
      let result = Array.from(contacts.values());
      if (args.company) result = result.filter(c => c.company === args.company);
      if (args.tag) result = result.filter(c => c.tags.includes(args.tag));
      return { success: true, contacts: result };
    }
    
    case 'search_contacts': {
      const query = args.query.toLowerCase();
      const results = Array.from(contacts.values()).filter(c =>
        c.name.toLowerCase().includes(query) ||
        c.email.toLowerCase().includes(query) ||
        c.company.toLowerCase().includes(query)
      );
      return { success: true, contacts: results };
    }
    
    case 'log_interaction': {
      const contact = contacts.get(args.contactId);
      if (!contact) return { success: false, error: 'Contact not found' };
      
      const interaction: Interaction = {
        id: generateId(),
        contactId: args.contactId,
        type: args.type,
        description: args.description,
        date: new Date(),
      };
      interactions.set(interaction.id, interaction);
      contact.lastInteraction = new Date();
      
      return { success: true, interaction };
    }
    
    case 'create_followup': {
      const followUp: FollowUp = {
        id: generateId(),
        contactId: args.contactId,
        title: args.title,
        description: args.description || '',
        dueDate: new Date(args.dueDate),
        status: 'pending',
        createdAt: new Date(),
      };
      followUps.set(followUp.id, followUp);
      return { success: true, followUp };
    }
    
    case 'list_followups': {
      let result = Array.from(followUps.values());
      if (args.contactId) result = result.filter(f => f.contactId === args.contactId);
      if (args.status) result = result.filter(f => f.status === args.status);
      return { success: true, followUps: result };
    }

    default:
      return { success: false, error: `Unknown tool: ${name}` };
  }
}

// ============ SERVER SETUP ============

const server = new Server(
  {
    name: 'ai-data-suite',
    version: '1.0.0',
  },
  {
    capabilities: { tools: {} },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: allTools }));
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  try {
    const result = await handleToolCall(name, args);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  } catch (error) {
    return { content: [{ type: 'text', text: JSON.stringify({ success: false, error: String(error) }) }] };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('AI Data Suite MCP Server running on stdio');
}

main().catch(console.error);
