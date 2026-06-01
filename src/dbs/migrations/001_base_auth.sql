CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS auth_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(254) UNIQUE,
  username VARCHAR(100) UNIQUE,
  employee_code VARCHAR(100) UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  display_name VARCHAR(150) NOT NULL,
  avatar_url VARCHAR(500),
  department_name VARCHAR(150),
  org_unit VARCHAR(150),
  status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
  must_change_password BOOLEAN NOT NULL DEFAULT FALSE,
  token_version INTEGER NOT NULL DEFAULT 1,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS auth_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  refresh_token_hash VARCHAR(128) NOT NULL,
  token_family UUID NOT NULL,
  user_agent VARCHAR(500),
  ip_address VARCHAR(64),
  device_name VARCHAR(150),
  status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
  expires_at TIMESTAMPTZ NOT NULL,
  last_used_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  revoke_reason VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS auth_refresh_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES auth_sessions(id) ON DELETE CASCADE,
  token_family UUID NOT NULL,
  refresh_token_hash VARCHAR(128) NOT NULL UNIQUE,
  status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
  expires_at TIMESTAMPTZ NOT NULL,
  rotated_at TIMESTAMPTZ,
  reused_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(150) NOT NULL,
  description TEXT,
  is_system BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(150) NOT NULL UNIQUE,
  name VARCHAR(150) NOT NULL,
  description TEXT,
  module VARCHAR(80) NOT NULL,
  resource VARCHAR(100) NOT NULL,
  action VARCHAR(80) NOT NULL,
  api_method VARCHAR(16),
  api_path_pattern VARCHAR(255),
  is_system BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS permission_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(150) NOT NULL,
  description TEXT,
  module VARCHAR(80) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS role_permission_groups (
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_group_id UUID NOT NULL REFERENCES permission_groups(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_group_id)
);

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS permission_group_permissions (
  permission_group_id UUID NOT NULL REFERENCES permission_groups(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (permission_group_id, permission_id)
);

CREATE TABLE IF NOT EXISTS user_roles (
  user_id UUID NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES auth_users(id),
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  PRIMARY KEY (user_id, role_id)
);

CREATE TABLE IF NOT EXISTS user_permission_groups (
  user_id UUID NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  permission_group_id UUID NOT NULL REFERENCES permission_groups(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES auth_users(id),
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  reason TEXT,
  PRIMARY KEY (user_id, permission_group_id)
);

CREATE TABLE IF NOT EXISTS user_permissions (
  user_id UUID NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES auth_users(id),
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  reason TEXT,
  PRIMARY KEY (user_id, permission_id)
);

CREATE TABLE IF NOT EXISTS auth_audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_user_id UUID REFERENCES auth_users(id),
  target_user_id UUID REFERENCES auth_users(id),
  action VARCHAR(120) NOT NULL,
  resource_type VARCHAR(80) NOT NULL,
  resource_id VARCHAR(120),
  before_json JSONB,
  after_json JSONB,
  ip_address VARCHAR(64),
  user_agent VARCHAR(500),
  request_id VARCHAR(120),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auth_users_status ON auth_users(status);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_user_status ON auth_sessions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_hash ON auth_sessions(refresh_token_hash);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_family ON auth_sessions(token_family);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_expires_at ON auth_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_auth_refresh_tokens_hash ON auth_refresh_tokens(refresh_token_hash);
CREATE INDEX IF NOT EXISTS idx_auth_refresh_tokens_session ON auth_refresh_tokens(session_id);
CREATE INDEX IF NOT EXISTS idx_auth_refresh_tokens_family ON auth_refresh_tokens(token_family);
CREATE INDEX IF NOT EXISTS idx_auth_refresh_tokens_status ON auth_refresh_tokens(status);
CREATE INDEX IF NOT EXISTS idx_permissions_code ON permissions(code);
CREATE INDEX IF NOT EXISTS idx_roles_code ON roles(code);
CREATE INDEX IF NOT EXISTS idx_user_roles_expires_at ON user_roles(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_permissions_expires_at ON user_permissions(expires_at);
CREATE INDEX IF NOT EXISTS idx_auth_audit_logs_action ON auth_audit_logs(action);
