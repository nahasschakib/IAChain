export interface Agent {
  id: number;
  name: string;
  slug: string;
  code: string;
  category: string;
  role: string;
  description: string;
  version: string;
  icon: string;
  input_label: string;
  output_label: string;
  workflow_count: number;
  status: string;
}

export type CheckboxGroupOption = { label: string; checked?: boolean };
export type SourceListOption = { label: string; status: string; desc: string };

export interface TaskField {
  id: number;
  agent_id: number;
  field_key: string;
  label: string;
  field_type: "textarea" | "checkbox-group" | "source-list" | "volume-select" | "checkbox";
  provenance: string | null;
  required: boolean;
  options: CheckboxGroupOption[] | SourceListOption[] | number[] | null;
  default_value: string | null;
  sort_order: number;
}

export interface ContractInput {
  id: number;
  agent_id: number;
  field_key: string;
  requirement: string;
  data_type: string;
  resolution_chain: string | null;
  sort_order: number;
}

export interface ContractOutput {
  id: number;
  agent_id: number;
  field_key: string;
  description: string | null;
  data_type: string;
  sort_order: number;
}

export interface ContractWorkflowUsage {
  id: number;
  agent_id: number;
  workflow_name: string;
  status: string;
  sort_order: number;
}

export interface ContractMeta {
  agent_id: number;
  version: string;
  consumed_by_count: number;
  compatibility_note: string | null;
}

export interface Contract {
  inputs: ContractInput[];
  outputs: ContractOutput[];
  meta: ContractMeta | null;
  workflowUsage: ContractWorkflowUsage[];
}

export interface Permission {
  id: number;
  agent_id: number;
  action_label: string;
  mode: "AUTO" | "APPROBATION_REQUISE" | "BLOQUE";
  stats_text: string | null;
  promotion_suggestion: string | null;
  sort_order: number;
}

export interface ExecutionHistoryEntry {
  id: number;
  agent_id: number;
  exec_date: string;
  description: string;
  status: "OK" | "REJET" | "ATTENTE";
}

export interface Deliverable {
  id: number;
  agent_id: number;
  agent_label: string | null;
  name: string;
  type: string | null;
  version: string | null;
  origin: string | null;
  approval_status: string | null;
  cost: number | string | null;
}