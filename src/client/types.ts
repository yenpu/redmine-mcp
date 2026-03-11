export interface IdName {
  id: number;
  name: string;
}

export interface CustomField {
  id: number;
  name: string;
  value: string | string[] | null;
}

export interface Upload {
  token: string;
}

// Issues
export interface Issue {
  id: number;
  project: IdName;
  tracker: IdName;
  status: IdName;
  priority: IdName;
  author: IdName;
  assigned_to?: IdName;
  category?: IdName;
  fixed_version?: IdName;
  parent?: { id: number };
  subject: string;
  description: string;
  start_date?: string;
  due_date?: string;
  done_ratio: number;
  is_private: boolean;
  estimated_hours?: number;
  spent_hours?: number;
  total_spent_hours?: number;
  custom_fields?: CustomField[];
  created_on: string;
  updated_on: string;
  closed_on?: string;
  attachments?: Attachment[];
  relations?: IssueRelation[];
  journals?: Journal[];
  watchers?: IdName[];
  changesets?: Changeset[];
  allowed_statuses?: IdName[];
}

export interface IssuesResponse {
  issues: Issue[];
  total_count: number;
  offset: number;
  limit: number;
}

export interface IssueResponse {
  issue: Issue;
}

// Projects
export interface Project {
  id: number;
  name: string;
  identifier: string;
  description: string;
  homepage?: string;
  status: number;
  parent?: IdName;
  is_public: boolean;
  inherit_members?: boolean;
  trackers?: IdName[];
  issue_categories?: IdName[];
  enabled_modules?: { id: number; name: string }[];
  time_entry_activities?: IdName[];
  custom_fields?: CustomField[];
  created_on: string;
  updated_on: string;
}

export interface ProjectsResponse {
  projects: Project[];
  total_count: number;
  offset: number;
  limit: number;
}

export interface ProjectResponse {
  project: Project;
}

// Users
export interface User {
  id: number;
  login: string;
  admin: boolean;
  firstname: string;
  lastname: string;
  mail: string;
  created_on: string;
  updated_on: string;
  last_login_on?: string;
  passwd_changed_on?: string;
  twofa_scheme?: string | null;
  api_key?: string;
  status?: number;
  custom_fields?: CustomField[];
  memberships?: Membership[];
  groups?: IdName[];
}

export interface UsersResponse {
  users: User[];
  total_count: number;
  offset: number;
  limit: number;
}

export interface UserResponse {
  user: User;
}

// Time Entries
export interface TimeEntry {
  id: number;
  project: IdName;
  issue?: { id: number };
  user: IdName;
  activity: IdName;
  hours: number;
  comments: string;
  spent_on: string;
  created_on: string;
  updated_on: string;
  custom_fields?: CustomField[];
}

export interface TimeEntriesResponse {
  time_entries: TimeEntry[];
  total_count: number;
  offset: number;
  limit: number;
}

export interface TimeEntryResponse {
  time_entry: TimeEntry;
}

// Memberships
export interface Membership {
  id: number;
  project?: IdName;
  user?: IdName;
  group?: IdName;
  roles: IdName[];
}

export interface MembershipsResponse {
  memberships: Membership[];
  total_count: number;
}

export interface MembershipResponse {
  membership: Membership;
}

// Versions
export interface Version {
  id: number;
  project: IdName;
  name: string;
  description: string;
  status: 'open' | 'locked' | 'closed';
  due_date?: string;
  sharing: 'none' | 'descendants' | 'hierarchy' | 'tree' | 'system';
  wiki_page_title?: string;
  created_on: string;
  updated_on: string;
  custom_fields?: CustomField[];
}

export interface VersionsResponse {
  versions: Version[];
  total_count: number;
}

export interface VersionResponse {
  version: Version;
}

// Issue Relations
export interface IssueRelation {
  id: number;
  issue_id: number;
  issue_to_id: number;
  relation_type: string;
  delay?: number | null;
}

export interface IssueRelationsResponse {
  relations: IssueRelation[];
}

export interface IssueRelationResponse {
  relation: IssueRelation;
}

// Wiki Pages
export interface WikiPage {
  title: string;
  parent?: { title: string };
  text?: string;
  version?: number;
  author?: IdName;
  comments?: string;
  created_on: string;
  updated_on: string;
  attachments?: Attachment[];
}

export interface WikiPagesResponse {
  wiki_pages: WikiPage[];
}

export interface WikiPageResponse {
  wiki_page: WikiPage;
}

// Attachments
export interface Attachment {
  id: number;
  filename: string;
  filesize: number;
  content_type: string;
  description: string;
  content_url: string;
  thumbnail_url?: string;
  author: IdName;
  created_on: string;
}

export interface AttachmentResponse {
  attachment: Attachment;
}

export interface UploadResponse {
  upload: Upload;
}

// Groups
export interface Group {
  id: number;
  name: string;
  users?: IdName[];
  memberships?: Membership[];
}

export interface GroupsResponse {
  groups: Group[];
}

export interface GroupResponse {
  group: Group;
}

// Custom Fields
export interface CustomFieldDefinition {
  id: number;
  name: string;
  customized_type: string;
  field_format: string;
  regexp?: string;
  min_length?: number | null;
  max_length?: number | null;
  is_required: boolean;
  is_filter: boolean;
  searchable: boolean;
  multiple: boolean;
  default_value?: string | string[] | null;
  visible: boolean;
  possible_values?: { value: string; label: string }[];
  trackers?: IdName[];
  roles?: IdName[];
}

export interface CustomFieldsResponse {
  custom_fields: CustomFieldDefinition[];
}

// Issue Statuses
export interface IssueStatus {
  id: number;
  name: string;
  is_closed: boolean;
  is_default?: boolean;
}

export interface IssueStatusesResponse {
  issue_statuses: IssueStatus[];
}

// Trackers
export interface Tracker {
  id: number;
  name: string;
  default_status?: IdName;
  description?: string;
  enabled_standard_fields?: string[];
}

export interface TrackersResponse {
  trackers: Tracker[];
}

// Issue Categories
export interface IssueCategory {
  id: number;
  project: IdName;
  name: string;
  assigned_to?: IdName;
}

export interface IssueCategoriesResponse {
  issue_categories: IssueCategory[];
}

// Journal (issue history)
export interface Journal {
  id: number;
  user: IdName;
  notes: string;
  created_on: string;
  private_notes: boolean;
  details: JournalDetail[];
}

export interface JournalDetail {
  property: string;
  name: string;
  old_value?: string | null;
  new_value?: string | null;
}

// Changeset
export interface Changeset {
  revision: string;
  user?: IdName;
  comments: string;
  committed_on: string;
}
