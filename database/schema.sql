-- Valora PostgreSQL Database Schema
-- Supports multi-tenancy, vector search, and comprehensive memory management

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";

-- Tenants table for multi-tenancy
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE,
    password_hash VARCHAR(255),
    full_name VARCHAR(255),
    avatar_url VARCHAR(500),
    settings JSONB DEFAULT '{}',
    role VARCHAR(50) DEFAULT 'user',
    email_verified BOOLEAN DEFAULT false,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- API Keys table
CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    key_hash VARCHAR(255) UNIQUE NOT NULL,
    permissions JSONB DEFAULT '[]',
    expires_at TIMESTAMP WITH TIME ZONE,
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- Memory table with vector support
CREATE TABLE memories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    content_type VARCHAR(50) DEFAULT 'note',
    source VARCHAR(255),
    tags TEXT[] DEFAULT '{}',
    inferred_tags TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    embedding vector(384), -- OpenAI text-embedding-ada-002 dimension
    conversation_id UUID,
    participant VARCHAR(255),
    context TEXT,
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_deleted BOOLEAN DEFAULT false
);

-- Conversations table
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(500),
    summary TEXT,
    participant_count INTEGER DEFAULT 1,
    message_count INTEGER DEFAULT 0,
    tags TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- Webhooks table
CREATE TABLE webhooks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    url VARCHAR(500) NOT NULL,
    secret VARCHAR(255),
    events TEXT[] DEFAULT '{}',
    headers JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit log table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_memories_tenant_id ON memories(tenant_id);
CREATE INDEX idx_memories_user_id ON memories(user_id);
CREATE INDEX idx_memories_conversation_id ON memories(conversation_id);
CREATE INDEX idx_memories_content_type ON memories(content_type);
CREATE INDEX idx_memories_created_at ON memories(created_at);
CREATE INDEX idx_memories_tags ON memories USING GIN(tags);
CREATE INDEX idx_memories_inferred_tags ON memories USING GIN(inferred_tags);
CREATE INDEX idx_memories_embedding ON memories USING ivfflat(embedding vector_cosine_ops);

CREATE INDEX idx_conversations_tenant_id ON conversations(tenant_id);
CREATE INDEX idx_conversations_user_id ON conversations(user_id);

CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX idx_api_keys_tenant_id ON api_keys(tenant_id);
CREATE INDEX idx_api_keys_key_hash ON api_keys(key_hash);

CREATE INDEX idx_audit_logs_tenant_id ON audit_logs(tenant_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- Full-text search indexes
CREATE INDEX idx_memories_content_fts ON memories USING GIN(to_tsvector('english', content));
CREATE INDEX idx_conversations_title_fts ON conversations USING GIN(to_tsvector('english', title));
CREATE INDEX idx_conversations_summary_fts ON conversations USING GIN(to_tsvector('english', summary));

-- Functions for vector similarity search
CREATE OR REPLACE FUNCTION cosine_similarity(a vector, b vector) RETURNS float
LANGUAGE plpgsql IMMUTABLE STRICT PARALLEL SAFE AS $$
BEGIN
    RETURN 1 - (a <=> b);
END;
$$;

-- Function to search memories by semantic similarity
CREATE OR REPLACE FUNCTION search_memories_semantic(
    query_embedding vector,
    tenant_id UUID,
    user_id UUID DEFAULT NULL,
    limit_count INTEGER DEFAULT 10,
    similarity_threshold FLOAT DEFAULT 0.7
) RETURNS TABLE (
    id UUID,
    content TEXT,
    similarity FLOAT,
    tags TEXT[],
    inferred_tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE
) LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT
        m.id,
        m.content,
        cosine_similarity(m.embedding, query_embedding) as similarity,
        m.tags,
        m.inferred_tags,
        m.created_at
    FROM memories m
    WHERE m.tenant_id = tenant_id
      AND (user_id IS NULL OR m.user_id = user_id)
      AND m.is_deleted = false
      AND cosine_similarity(m.embedding, query_embedding) > similarity_threshold
    ORDER BY cosine_similarity(m.embedding, query_embedding) DESC
    LIMIT limit_count;
END;
$$;

-- Function to get conversation context
CREATE OR REPLACE FUNCTION get_conversation_context(
    conv_id UUID,
    limit_count INTEGER DEFAULT 50
) RETURNS TABLE (
    id UUID,
    content TEXT,
    participant VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE,
    message_order INTEGER
) LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT
        m.id,
        m.content,
        m.participant,
        m.created_at,
        ROW_NUMBER() OVER (ORDER BY m.created_at ASC) as message_order
    FROM memories m
    WHERE m.conversation_id = conv_id
      AND m.is_deleted = false
    ORDER BY m.created_at ASC
    LIMIT limit_count;
END;
$$;

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_memories_updated_at BEFORE UPDATE ON memories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Default tenant for single-tenant mode
INSERT INTO tenants (name, slug, description) VALUES
('Default Tenant', 'default', 'Default tenant for single-tenant deployments');

-- Comments for documentation
COMMENT ON TABLE tenants IS 'Multi-tenant organization container';
COMMENT ON TABLE users IS 'User accounts with tenant association';
COMMENT ON TABLE api_keys IS 'API authentication keys for users';
COMMENT ON TABLE memories IS 'Core memory storage with vector embeddings';
COMMENT ON TABLE conversations IS 'Chat conversation containers';
COMMENT ON TABLE webhooks IS 'Webhook configurations for integrations';
COMMENT ON TABLE audit_logs IS 'Comprehensive audit trail for all actions';
