export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.18'
  }
  public: {
    Tables: {
      github_provisioning: {
        Row: {
          completed_at: string | null
          lease_id: string
          locked_until: string
          project_id: string
        }
        Insert: {
          completed_at?: string | null
          lease_id: string
          locked_until?: string
          project_id: string
        }
        Update: {
          completed_at?: string | null
          lease_id?: string
          locked_until?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'github_provisioning_project_id_fkey'
            columns: ['project_id']
            isOneToOne: true
            referencedRelation: 'projects'
            referencedColumns: ['id']
          },
        ]
      }
      join_requests: {
        Row: {
          created_at: string
          id: string
          message: string
          profile_id: string
          project_id: string
          reviewed_at: string | null
          status: Database['public']['Enums']['request_status']
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          profile_id: string
          project_id: string
          reviewed_at?: string | null
          status?: Database['public']['Enums']['request_status']
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          profile_id?: string
          project_id?: string
          reviewed_at?: string | null
          status?: Database['public']['Enums']['request_status']
        }
        Relationships: [
          {
            foreignKeyName: 'join_requests_profile_id_fkey'
            columns: ['profile_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'join_requests_project_id_fkey'
            columns: ['project_id']
            isOneToOne: false
            referencedRelation: 'projects'
            referencedColumns: ['id']
          },
        ]
      }
      profile_technologies: {
        Row: {
          profile_id: string
          technology_id: number
        }
        Insert: {
          profile_id: string
          technology_id: number
        }
        Update: {
          profile_id?: string
          technology_id?: number
        }
        Relationships: [
          {
            foreignKeyName: 'profile_technologies_profile_id_fkey'
            columns: ['profile_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'profile_technologies_technology_id_fkey'
            columns: ['technology_id']
            isOneToOne: false
            referencedRelation: 'technologies'
            referencedColumns: ['id']
          },
        ]
      }
      profiles: {
        Row: {
          available: boolean
          avatar_url: string | null
          bio: string
          created_at: string
          full_name: string
          github_username: string | null
          headline: string
          id: string
          location: string
          updated_at: string
          username: string
        }
        Insert: {
          available?: boolean
          avatar_url?: string | null
          bio?: string
          created_at?: string
          full_name?: string
          github_username?: string | null
          headline?: string
          id: string
          location?: string
          updated_at?: string
          username: string
        }
        Update: {
          available?: boolean
          avatar_url?: string | null
          bio?: string
          created_at?: string
          full_name?: string
          github_username?: string | null
          headline?: string
          id?: string
          location?: string
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      project_members: {
        Row: {
          joined_at: string
          profile_id: string
          project_id: string
          role: Database['public']['Enums']['member_role']
        }
        Insert: {
          joined_at?: string
          profile_id: string
          project_id: string
          role?: Database['public']['Enums']['member_role']
        }
        Update: {
          joined_at?: string
          profile_id?: string
          project_id?: string
          role?: Database['public']['Enums']['member_role']
        }
        Relationships: [
          {
            foreignKeyName: 'project_members_profile_id_fkey'
            columns: ['profile_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'project_members_project_id_fkey'
            columns: ['project_id']
            isOneToOne: false
            referencedRelation: 'projects'
            referencedColumns: ['id']
          },
        ]
      }
      project_technologies: {
        Row: {
          is_required: boolean
          project_id: string
          technology_id: number
        }
        Insert: {
          is_required?: boolean
          project_id: string
          technology_id: number
        }
        Update: {
          is_required?: boolean
          project_id?: string
          technology_id?: number
        }
        Relationships: [
          {
            foreignKeyName: 'project_technologies_project_id_fkey'
            columns: ['project_id']
            isOneToOne: false
            referencedRelation: 'projects'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'project_technologies_technology_id_fkey'
            columns: ['technology_id']
            isOneToOne: false
            referencedRelation: 'technologies'
            referencedColumns: ['id']
          },
        ]
      }
      projects: {
        Row: {
          category: string
          cover_theme: string
          created_at: string
          description: string
          experience_level: string
          github_repo_name: string | null
          github_repo_url: string | null
          id: string
          owner_id: string
          status: Database['public']['Enums']['project_status']
          summary: string
          tasks_done: number
          tasks_total: number
          template_id: number | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          cover_theme?: string
          created_at?: string
          description: string
          experience_level?: string
          github_repo_name?: string | null
          github_repo_url?: string | null
          id?: string
          owner_id: string
          status?: Database['public']['Enums']['project_status']
          summary?: string
          tasks_done?: number
          tasks_total?: number
          template_id?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          cover_theme?: string
          created_at?: string
          description?: string
          experience_level?: string
          github_repo_name?: string | null
          github_repo_url?: string | null
          id?: string
          owner_id?: string
          status?: Database['public']['Enums']['project_status']
          summary?: string
          tasks_done?: number
          tasks_total?: number
          template_id?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'projects_owner_id_fkey'
            columns: ['owner_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'projects_template_id_fkey'
            columns: ['template_id']
            isOneToOne: false
            referencedRelation: 'templates'
            referencedColumns: ['id']
          },
        ]
      }
      tasks: {
        Row: {
          assignee_id: string | null
          created_at: string
          description: string
          due_date: string | null
          github_issue_number: number | null
          github_issue_url: string | null
          id: string
          position: number
          project_id: string
          status: Database['public']['Enums']['task_status']
          template_task_id: number | null
          title: string
          updated_at: string
        }
        Insert: {
          assignee_id?: string | null
          created_at?: string
          description?: string
          due_date?: string | null
          github_issue_number?: number | null
          github_issue_url?: string | null
          id?: string
          position?: number
          project_id: string
          status?: Database['public']['Enums']['task_status']
          template_task_id?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          assignee_id?: string | null
          created_at?: string
          description?: string
          due_date?: string | null
          github_issue_number?: number | null
          github_issue_url?: string | null
          id?: string
          position?: number
          project_id?: string
          status?: Database['public']['Enums']['task_status']
          template_task_id?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'tasks_project_id_assignee_id_fkey'
            columns: ['project_id', 'assignee_id']
            isOneToOne: false
            referencedRelation: 'project_members'
            referencedColumns: ['project_id', 'profile_id']
          },
          {
            foreignKeyName: 'tasks_project_id_fkey'
            columns: ['project_id']
            isOneToOne: false
            referencedRelation: 'projects'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'tasks_template_task_id_fkey'
            columns: ['template_task_id']
            isOneToOne: false
            referencedRelation: 'template_tasks'
            referencedColumns: ['id']
          },
        ]
      }
      technologies: {
        Row: {
          category: string
          id: number
          name: string
        }
        Insert: {
          category: string
          id?: never
          name: string
        }
        Update: {
          category?: string
          id?: never
          name?: string
        }
        Relationships: []
      }
      template_tasks: {
        Row: {
          description: string
          id: number
          position: number
          template_id: number
          title: string
        }
        Insert: {
          description?: string
          id?: never
          position?: number
          template_id: number
          title: string
        }
        Update: {
          description?: string
          id?: never
          position?: number
          template_id?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: 'template_tasks_template_id_fkey'
            columns: ['template_id']
            isOneToOne: false
            referencedRelation: 'templates'
            referencedColumns: ['id']
          },
        ]
      }
      templates: {
        Row: {
          description: string
          github_template_repo: string | null
          id: number
          name: string
          slug: string
        }
        Insert: {
          description: string
          github_template_repo?: string | null
          id?: never
          name: string
          slug: string
        }
        Update: {
          description?: string
          github_template_repo?: string | null
          id?: never
          name?: string
          slug?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      claim_github_provisioning: {
        Args: { p_lease_id: string; p_project_id: string }
        Returns: boolean
      }
      save_profile: {
        Args: {
          p_available: boolean
          p_bio: string
          p_full_name: string
          p_github_username: string
          p_headline: string
          p_location: string
          p_technology_ids: number[]
          p_username: string
        }
        Returns: undefined
      }
      save_project: {
        Args: {
          p_category: string
          p_cover_theme: string
          p_description: string
          p_experience_level: string
          p_project_id?: string
          p_required_ids: number[]
          p_status?: Database['public']['Enums']['project_status']
          p_summary: string
          p_technology_ids: number[]
          p_template_id?: number
          p_title: string
        }
        Returns: string
      }
    }
    Enums: {
      member_role: 'owner' | 'maintainer' | 'member'
      project_status: 'recruiting' | 'in_progress' | 'completed'
      request_status: 'pending' | 'accepted' | 'rejected'
      task_status: 'todo' | 'in_progress' | 'done'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema['Enums'] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema['CompositeTypes'] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      member_role: ['owner', 'maintainer', 'member'],
      project_status: ['recruiting', 'in_progress', 'completed'],
      request_status: ['pending', 'accepted', 'rejected'],
      task_status: ['todo', 'in_progress', 'done'],
    },
  },
} as const
