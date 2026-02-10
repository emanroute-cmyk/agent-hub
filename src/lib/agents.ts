import { Bot, Database, FileSearch, BrainCircuit, BarChart3, Shield, Workflow, MessageSquare } from "lucide-react";

export interface Agent {
  id: string;
  name: string;
  description: string;
  endpoint: string;
  icon: string;
  status: "online" | "offline" | "maintenance";
  category: string;
  assignedUsers: string[];
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export const AGENT_ICONS: Record<string, React.ComponentType<any>> = {
  bot: Bot,
  database: Database,
  search: FileSearch,
  brain: BrainCircuit,
  chart: BarChart3,
  shield: Shield,
  workflow: Workflow,
  chat: MessageSquare,
};

export const MOCK_AGENTS: Agent[] = [
  {
    id: "1",
    name: "Data Analyst",
    description: "Analyzes datasets, generates insights, and creates statistical summaries from your structured data sources.",
    endpoint: "https://api.example.com/agents/data-analyst",
    icon: "chart",
    status: "online",
    category: "Analytics",
    assignedUsers: ["user1", "user2"],
  },
  {
    id: "2",
    name: "SQL Expert",
    description: "Writes, optimizes, and debugs SQL queries across PostgreSQL, MySQL, and BigQuery databases.",
    endpoint: "https://api.example.com/agents/sql-expert",
    icon: "database",
    status: "online",
    category: "Database",
    assignedUsers: ["user1"],
  },
  {
    id: "3",
    name: "Document Parser",
    description: "Extracts structured information from PDFs, invoices, contracts, and unstructured text documents.",
    endpoint: "https://api.example.com/agents/doc-parser",
    icon: "search",
    status: "online",
    category: "Extraction",
    assignedUsers: ["user1", "user2", "user3"],
  },
  {
    id: "4",
    name: "ML Pipeline",
    description: "Builds and deploys machine learning pipelines for classification, regression, and clustering tasks.",
    endpoint: "https://api.example.com/agents/ml-pipeline",
    icon: "brain",
    status: "maintenance",
    category: "ML/AI",
    assignedUsers: ["user2"],
  },
  {
    id: "5",
    name: "Security Auditor",
    description: "Scans codebases and infrastructure for vulnerabilities, compliance issues, and security best practices.",
    endpoint: "https://api.example.com/agents/security",
    icon: "shield",
    status: "offline",
    category: "Security",
    assignedUsers: ["user1"],
  },
  {
    id: "6",
    name: "ETL Orchestrator",
    description: "Designs and manages data extraction, transformation, and loading workflows across multiple sources.",
    endpoint: "https://api.example.com/agents/etl",
    icon: "workflow",
    status: "online",
    category: "Data Ops",
    assignedUsers: ["user1", "user3"],
  },
];
