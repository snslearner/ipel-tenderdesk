export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      activity_log: {
        Row: {
          action: string
          actor: string | null
          after: Json | null
          at: string
          before: Json | null
          entity_id: string | null
          entity_type: string
          id: number
        }
        Insert: {
          action: string
          actor?: string | null
          after?: Json | null
          at?: string
          before?: Json | null
          entity_id?: string | null
          entity_type: string
          id?: never
        }
        Update: {
          action?: string
          actor?: string | null
          after?: Json | null
          at?: string
          before?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: never
        }
        Relationships: []
      }
      bank_guarantees: {
        Row: {
          amount: number
          bank_name: string
          bg_number: string
          client_po_id: string | null
          id: string
          issued_on: string | null
          kind: Database["public"]["Enums"]["bg_kind"]
          status: Database["public"]["Enums"]["bg_status"]
          tender_id: string | null
          valid_until: string | null
        }
        Insert: {
          amount: number
          bank_name: string
          bg_number: string
          client_po_id?: string | null
          id?: string
          issued_on?: string | null
          kind: Database["public"]["Enums"]["bg_kind"]
          status?: Database["public"]["Enums"]["bg_status"]
          tender_id?: string | null
          valid_until?: string | null
        }
        Update: {
          amount?: number
          bank_name?: string
          bg_number?: string
          client_po_id?: string | null
          id?: string
          issued_on?: string | null
          kind?: Database["public"]["Enums"]["bg_kind"]
          status?: Database["public"]["Enums"]["bg_status"]
          tender_id?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bank_guarantees_client_po_id_fkey"
            columns: ["client_po_id"]
            isOneToOne: false
            referencedRelation: "client_pos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_guarantees_client_po_id_fkey"
            columns: ["client_po_id"]
            isOneToOne: false
            referencedRelation: "v_po_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_guarantees_tender_id_fkey"
            columns: ["tender_id"]
            isOneToOne: false
            referencedRelation: "tenders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_guarantees_tender_id_fkey"
            columns: ["tender_id"]
            isOneToOne: false
            referencedRelation: "v_part_history"
            referencedColumns: ["tender_id"]
          },
          {
            foreignKeyName: "bank_guarantees_tender_id_fkey"
            columns: ["tender_id"]
            isOneToOne: false
            referencedRelation: "v_tender_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      client_po_items: {
        Row: {
          client_po_id: string
          id: string
          part_number: string | null
          product_id: string | null
          qty: number
          tender_item_id: string | null
          unit_price: number
        }
        Insert: {
          client_po_id: string
          id?: string
          part_number?: string | null
          product_id?: string | null
          qty: number
          tender_item_id?: string | null
          unit_price: number
        }
        Update: {
          client_po_id?: string
          id?: string
          part_number?: string | null
          product_id?: string | null
          qty?: number
          tender_item_id?: string | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "client_po_items_client_po_id_fkey"
            columns: ["client_po_id"]
            isOneToOne: false
            referencedRelation: "client_pos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_po_items_client_po_id_fkey"
            columns: ["client_po_id"]
            isOneToOne: false
            referencedRelation: "v_po_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_po_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_po_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_part_history"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "client_po_items_tender_item_id_fkey"
            columns: ["tender_item_id"]
            isOneToOne: false
            referencedRelation: "tender_items"
            referencedColumns: ["id"]
          },
        ]
      }
      client_pos: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          created_at: string
          created_by: string | null
          due_date: string
          extended_due_date: string | null
          id: string
          po_date: string
          po_number: string
          status: Database["public"]["Enums"]["po_status"]
          tender_id: string
          total_value: number
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          created_at?: string
          created_by?: string | null
          due_date: string
          extended_due_date?: string | null
          id?: string
          po_date: string
          po_number: string
          status?: Database["public"]["Enums"]["po_status"]
          tender_id: string
          total_value?: number
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          created_at?: string
          created_by?: string | null
          due_date?: string
          extended_due_date?: string | null
          id?: string
          po_date?: string
          po_number?: string
          status?: Database["public"]["Enums"]["po_status"]
          tender_id?: string
          total_value?: number
        }
        Relationships: [
          {
            foreignKeyName: "client_pos_acknowledged_by_fkey"
            columns: ["acknowledged_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_pos_tender_id_fkey"
            columns: ["tender_id"]
            isOneToOne: true
            referencedRelation: "tenders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_pos_tender_id_fkey"
            columns: ["tender_id"]
            isOneToOne: true
            referencedRelation: "v_part_history"
            referencedColumns: ["tender_id"]
          },
          {
            foreignKeyName: "client_pos_tender_id_fkey"
            columns: ["tender_id"]
            isOneToOne: true
            referencedRelation: "v_tender_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          address: string | null
          contact_person: string | null
          created_at: string
          created_by: string | null
          email: string | null
          gstin: string | null
          id: string
          name: string
          phone: string | null
          portal_name: string | null
          type: Database["public"]["Enums"]["client_type"]
        }
        Insert: {
          address?: string | null
          contact_person?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          gstin?: string | null
          id?: string
          name: string
          phone?: string | null
          portal_name?: string | null
          type: Database["public"]["Enums"]["client_type"]
        }
        Update: {
          address?: string | null
          contact_person?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          gstin?: string | null
          id?: string
          name?: string
          phone?: string | null
          portal_name?: string | null
          type?: Database["public"]["Enums"]["client_type"]
        }
        Relationships: []
      }
      company_documents: {
        Row: {
          created_at: string
          document_id: string | null
          id: string
          issued_by: string | null
          name: string
          number: string | null
          valid_until: string | null
        }
        Insert: {
          created_at?: string
          document_id?: string | null
          id?: string
          issued_by?: string | null
          name: string
          number?: string | null
          valid_until?: string | null
        }
        Update: {
          created_at?: string
          document_id?: string | null
          id?: string
          issued_by?: string | null
          name?: string
          number?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_documents_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      dispatch_items: {
        Row: {
          client_po_item_id: string
          dispatch_id: string
          id: string
          qty: number
        }
        Insert: {
          client_po_item_id: string
          dispatch_id: string
          id?: string
          qty: number
        }
        Update: {
          client_po_item_id?: string
          dispatch_id?: string
          id?: string
          qty?: number
        }
        Relationships: [
          {
            foreignKeyName: "dispatch_items_client_po_item_id_fkey"
            columns: ["client_po_item_id"]
            isOneToOne: false
            referencedRelation: "client_po_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dispatch_items_client_po_item_id_fkey"
            columns: ["client_po_item_id"]
            isOneToOne: false
            referencedRelation: "v_po_lines"
            referencedColumns: ["client_po_item_id"]
          },
          {
            foreignKeyName: "dispatch_items_dispatch_id_fkey"
            columns: ["dispatch_id"]
            isOneToOne: false
            referencedRelation: "dispatches"
            referencedColumns: ["id"]
          },
        ]
      }
      dispatches: {
        Row: {
          client_po_id: string
          dc_number: string
          dispatched_on: string
          document_id: string | null
          id: string
          received_on: string | null
          signed_sealed_stamped: boolean
        }
        Insert: {
          client_po_id: string
          dc_number: string
          dispatched_on: string
          document_id?: string | null
          id?: string
          received_on?: string | null
          signed_sealed_stamped?: boolean
        }
        Update: {
          client_po_id?: string
          dc_number?: string
          dispatched_on?: string
          document_id?: string | null
          id?: string
          received_on?: string | null
          signed_sealed_stamped?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "dispatches_client_po_id_fkey"
            columns: ["client_po_id"]
            isOneToOne: false
            referencedRelation: "client_pos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dispatches_client_po_id_fkey"
            columns: ["client_po_id"]
            isOneToOne: false
            referencedRelation: "v_po_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dispatches_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          created_at: string
          doc_type: string
          entity_id: string | null
          entity_type: string
          file_name: string | null
          id: string
          storage_path: string | null
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          doc_type: string
          entity_id?: string | null
          entity_type: string
          file_name?: string | null
          id?: string
          storage_path?: string | null
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          doc_type?: string
          entity_id?: string | null
          entity_type?: string
          file_name?: string | null
          id?: string
          storage_path?: string | null
          uploaded_by?: string | null
        }
        Relationships: []
      }
      extension_requests: {
        Row: {
          approval_ref: string | null
          approved_on: string | null
          client_po_id: string
          created_on: string
          id: string
          letter_text: string | null
          reason: string | null
          requested_date: string | null
          status: Database["public"]["Enums"]["extension_status"]
        }
        Insert: {
          approval_ref?: string | null
          approved_on?: string | null
          client_po_id: string
          created_on?: string
          id?: string
          letter_text?: string | null
          reason?: string | null
          requested_date?: string | null
          status?: Database["public"]["Enums"]["extension_status"]
        }
        Update: {
          approval_ref?: string | null
          approved_on?: string | null
          client_po_id?: string
          created_on?: string
          id?: string
          letter_text?: string | null
          reason?: string | null
          requested_date?: string | null
          status?: Database["public"]["Enums"]["extension_status"]
        }
        Relationships: [
          {
            foreignKeyName: "extension_requests_client_po_id_fkey"
            columns: ["client_po_id"]
            isOneToOne: false
            referencedRelation: "client_pos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extension_requests_client_po_id_fkey"
            columns: ["client_po_id"]
            isOneToOne: false
            referencedRelation: "v_po_overview"
            referencedColumns: ["id"]
          },
        ]
      }
      inspections: {
        Row: {
          agency: Database["public"]["Enums"]["inspection_agency"]
          called_on: string | null
          client_po_id: string
          id: string
          remarks: string | null
          result: Database["public"]["Enums"]["inspection_result"]
          scheduled_on: string | null
        }
        Insert: {
          agency: Database["public"]["Enums"]["inspection_agency"]
          called_on?: string | null
          client_po_id: string
          id?: string
          remarks?: string | null
          result?: Database["public"]["Enums"]["inspection_result"]
          scheduled_on?: string | null
        }
        Update: {
          agency?: Database["public"]["Enums"]["inspection_agency"]
          called_on?: string | null
          client_po_id?: string
          id?: string
          remarks?: string | null
          result?: Database["public"]["Enums"]["inspection_result"]
          scheduled_on?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inspections_client_po_id_fkey"
            columns: ["client_po_id"]
            isOneToOne: false
            referencedRelation: "client_pos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspections_client_po_id_fkey"
            columns: ["client_po_id"]
            isOneToOne: false
            referencedRelation: "v_po_overview"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          client_po_id: string
          gst: number
          id: string
          invoice_date: string
          invoice_no: string
          taxable_value: number
          total: number
        }
        Insert: {
          client_po_id: string
          gst?: number
          id?: string
          invoice_date: string
          invoice_no: string
          taxable_value: number
          total: number
        }
        Update: {
          client_po_id?: string
          gst?: number
          id?: string
          invoice_date?: string
          invoice_no?: string
          taxable_value?: number
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoices_client_po_id_fkey"
            columns: ["client_po_id"]
            isOneToOne: true
            referencedRelation: "client_pos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_client_po_id_fkey"
            columns: ["client_po_id"]
            isOneToOne: true
            referencedRelation: "v_po_overview"
            referencedColumns: ["id"]
          },
        ]
      }
      po_discrepancies: {
        Row: {
          actual: string | null
          amendment_ref: string | null
          client_po_id: string
          client_po_item_id: string | null
          expected: string | null
          field: string
          id: string
          raised_on: string
          resolved_on: string | null
        }
        Insert: {
          actual?: string | null
          amendment_ref?: string | null
          client_po_id: string
          client_po_item_id?: string | null
          expected?: string | null
          field: string
          id?: string
          raised_on?: string
          resolved_on?: string | null
        }
        Update: {
          actual?: string | null
          amendment_ref?: string | null
          client_po_id?: string
          client_po_item_id?: string | null
          expected?: string | null
          field?: string
          id?: string
          raised_on?: string
          resolved_on?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "po_discrepancies_client_po_id_fkey"
            columns: ["client_po_id"]
            isOneToOne: false
            referencedRelation: "client_pos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "po_discrepancies_client_po_id_fkey"
            columns: ["client_po_id"]
            isOneToOne: false
            referencedRelation: "v_po_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "po_discrepancies_client_po_item_id_fkey"
            columns: ["client_po_item_id"]
            isOneToOne: false
            referencedRelation: "client_po_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "po_discrepancies_client_po_item_id_fkey"
            columns: ["client_po_item_id"]
            isOneToOne: false
            referencedRelation: "v_po_lines"
            referencedColumns: ["client_po_item_id"]
          },
        ]
      }
      products: {
        Row: {
          created_at: string
          id: string
          name: string
          part_number: string
          spec: string | null
          standard: string | null
          uom: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          part_number: string
          spec?: string | null
          standard?: string | null
          uom?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          part_number?: string
          spec?: string | null
          standard?: string | null
          uom?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: []
      }
      receipts: {
        Row: {
          amount: number
          gst_tds: number
          id: string
          invoice_id: string
          ld_deducted: number
          other_deductions: number
          received_on: string
          reference: string | null
          tds: number
        }
        Insert: {
          amount?: number
          gst_tds?: number
          id?: string
          invoice_id: string
          ld_deducted?: number
          other_deductions?: number
          received_on: string
          reference?: string | null
          tds?: number
        }
        Update: {
          amount?: number
          gst_tds?: number
          id?: string
          invoice_id?: string
          ld_deducted?: number
          other_deductions?: number
          received_on?: string
          reference?: string | null
          tds?: number
        }
        Relationships: [
          {
            foreignKeyName: "receipts_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receipts_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "v_invoice_balance"
            referencedColumns: ["invoice_id"]
          },
          {
            foreignKeyName: "receipts_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "v_po_overview"
            referencedColumns: ["invoice_id"]
          },
        ]
      }
      reminders: {
        Row: {
          assignee_role: Database["public"]["Enums"]["user_role"] | null
          channel: Database["public"]["Enums"]["reminder_channel"]
          created_at: string
          done_at: string | null
          due_on: string
          entity_id: string | null
          entity_type: string | null
          id: string
          kind: string
          status: Database["public"]["Enums"]["reminder_status"]
          text: string
        }
        Insert: {
          assignee_role?: Database["public"]["Enums"]["user_role"] | null
          channel?: Database["public"]["Enums"]["reminder_channel"]
          created_at?: string
          done_at?: string | null
          due_on?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          kind: string
          status?: Database["public"]["Enums"]["reminder_status"]
          text: string
        }
        Update: {
          assignee_role?: Database["public"]["Enums"]["user_role"] | null
          channel?: Database["public"]["Enums"]["reminder_channel"]
          created_at?: string
          done_at?: string | null
          due_on?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          kind?: string
          status?: Database["public"]["Enums"]["reminder_status"]
          text?: string
        }
        Relationships: []
      }
      tender_checklist_items: {
        Row: {
          created_at: string
          done: boolean
          done_at: string | null
          done_by: string | null
          id: string
          kind: Database["public"]["Enums"]["checklist_kind"]
          source: Database["public"]["Enums"]["checklist_source"]
          tender_id: string
          text: string
        }
        Insert: {
          created_at?: string
          done?: boolean
          done_at?: string | null
          done_by?: string | null
          id?: string
          kind: Database["public"]["Enums"]["checklist_kind"]
          source?: Database["public"]["Enums"]["checklist_source"]
          tender_id: string
          text: string
        }
        Update: {
          created_at?: string
          done?: boolean
          done_at?: string | null
          done_by?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["checklist_kind"]
          source?: Database["public"]["Enums"]["checklist_source"]
          tender_id?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "tender_checklist_items_tender_id_fkey"
            columns: ["tender_id"]
            isOneToOne: false
            referencedRelation: "tenders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tender_checklist_items_tender_id_fkey"
            columns: ["tender_id"]
            isOneToOne: false
            referencedRelation: "v_part_history"
            referencedColumns: ["tender_id"]
          },
          {
            foreignKeyName: "tender_checklist_items_tender_id_fkey"
            columns: ["tender_id"]
            isOneToOne: false
            referencedRelation: "v_tender_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      tender_items: {
        Row: {
          description: string | null
          id: string
          line_no: number
          product_id: string | null
          qty: number
          tender_id: string
          unit_bid_price: number | null
          unit_cost: number | null
          uom: string
          vendor_id: string | null
        }
        Insert: {
          description?: string | null
          id?: string
          line_no: number
          product_id?: string | null
          qty: number
          tender_id: string
          unit_bid_price?: number | null
          unit_cost?: number | null
          uom?: string
          vendor_id?: string | null
        }
        Update: {
          description?: string | null
          id?: string
          line_no?: number
          product_id?: string | null
          qty?: number
          tender_id?: string
          unit_bid_price?: number | null
          unit_cost?: number | null
          uom?: string
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tender_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tender_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_part_history"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "tender_items_tender_id_fkey"
            columns: ["tender_id"]
            isOneToOne: false
            referencedRelation: "tenders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tender_items_tender_id_fkey"
            columns: ["tender_id"]
            isOneToOne: false
            referencedRelation: "v_part_history"
            referencedColumns: ["tender_id"]
          },
          {
            foreignKeyName: "tender_items_tender_id_fkey"
            columns: ["tender_id"]
            isOneToOne: false
            referencedRelation: "v_tender_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tender_items_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "v_vendor_po_balance"
            referencedColumns: ["vendor_id"]
          },
          {
            foreignKeyName: "tender_items_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      tenders: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          client_id: string
          created_at: string
          created_by: string | null
          delay_clause_text: string | null
          delivery_period_days: number | null
          emd_amount: number | null
          id: string
          ld_basis: Database["public"]["Enums"]["ld_basis"]
          ld_cap_pct: number
          ld_rate_pct_per_week: number
          loss_reason: string | null
          owner_comment: string | null
          published_on: string | null
          ref_no: string
          remarks: string | null
          result_on: string | null
          source: Database["public"]["Enums"]["tender_source"]
          status: Database["public"]["Enums"]["tender_status"]
          submission_due: string | null
          submitted_at: string | null
          title: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          client_id: string
          created_at?: string
          created_by?: string | null
          delay_clause_text?: string | null
          delivery_period_days?: number | null
          emd_amount?: number | null
          id?: string
          ld_basis?: Database["public"]["Enums"]["ld_basis"]
          ld_cap_pct?: number
          ld_rate_pct_per_week?: number
          loss_reason?: string | null
          owner_comment?: string | null
          published_on?: string | null
          ref_no: string
          remarks?: string | null
          result_on?: string | null
          source: Database["public"]["Enums"]["tender_source"]
          status?: Database["public"]["Enums"]["tender_status"]
          submission_due?: string | null
          submitted_at?: string | null
          title: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          client_id?: string
          created_at?: string
          created_by?: string | null
          delay_clause_text?: string | null
          delivery_period_days?: number | null
          emd_amount?: number | null
          id?: string
          ld_basis?: Database["public"]["Enums"]["ld_basis"]
          ld_cap_pct?: number
          ld_rate_pct_per_week?: number
          loss_reason?: string | null
          owner_comment?: string | null
          published_on?: string | null
          ref_no?: string
          remarks?: string | null
          result_on?: string | null
          source?: Database["public"]["Enums"]["tender_source"]
          status?: Database["public"]["Enums"]["tender_status"]
          submission_due?: string | null
          submitted_at?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenders_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenders_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenders_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_invoice_balance"
            referencedColumns: ["client_id"]
          },
        ]
      }
      vendor_certificates: {
        Row: {
          created_at: string
          document_id: string | null
          id: string
          name: string
          number: string | null
          valid_until: string | null
          vendor_id: string
        }
        Insert: {
          created_at?: string
          document_id?: string | null
          id?: string
          name: string
          number?: string | null
          valid_until?: string | null
          vendor_id: string
        }
        Update: {
          created_at?: string
          document_id?: string | null
          id?: string
          name?: string
          number?: string | null
          valid_until?: string | null
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_certificates_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_certificates_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "v_vendor_po_balance"
            referencedColumns: ["vendor_id"]
          },
          {
            foreignKeyName: "vendor_certificates_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_payments: {
        Row: {
          amount: number
          id: string
          mode: string | null
          paid_on: string
          reference: string | null
          vendor_po_id: string
        }
        Insert: {
          amount: number
          id?: string
          mode?: string | null
          paid_on: string
          reference?: string | null
          vendor_po_id: string
        }
        Update: {
          amount?: number
          id?: string
          mode?: string | null
          paid_on?: string
          reference?: string | null
          vendor_po_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_payments_vendor_po_id_fkey"
            columns: ["vendor_po_id"]
            isOneToOne: false
            referencedRelation: "v_vendor_po_balance"
            referencedColumns: ["vendor_po_id"]
          },
          {
            foreignKeyName: "vendor_payments_vendor_po_id_fkey"
            columns: ["vendor_po_id"]
            isOneToOne: false
            referencedRelation: "vendor_pos"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_po_items: {
        Row: {
          id: string
          product_id: string | null
          qc_result: string | null
          qty: number
          received_qty: number
          unit_price: number
          vendor_po_id: string
        }
        Insert: {
          id?: string
          product_id?: string | null
          qc_result?: string | null
          qty: number
          received_qty?: number
          unit_price: number
          vendor_po_id: string
        }
        Update: {
          id?: string
          product_id?: string | null
          qc_result?: string | null
          qty?: number
          received_qty?: number
          unit_price?: number
          vendor_po_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_po_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_po_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_part_history"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "vendor_po_items_vendor_po_id_fkey"
            columns: ["vendor_po_id"]
            isOneToOne: false
            referencedRelation: "v_vendor_po_balance"
            referencedColumns: ["vendor_po_id"]
          },
          {
            foreignKeyName: "vendor_po_items_vendor_po_id_fkey"
            columns: ["vendor_po_id"]
            isOneToOne: false
            referencedRelation: "vendor_pos"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_pos: {
        Row: {
          client_po_id: string
          created_at: string
          eta: string | null
          id: string
          po_date: string
          po_number: string
          status: Database["public"]["Enums"]["vendor_po_status"]
          vendor_id: string
        }
        Insert: {
          client_po_id: string
          created_at?: string
          eta?: string | null
          id?: string
          po_date: string
          po_number: string
          status?: Database["public"]["Enums"]["vendor_po_status"]
          vendor_id: string
        }
        Update: {
          client_po_id?: string
          created_at?: string
          eta?: string | null
          id?: string
          po_date?: string
          po_number?: string
          status?: Database["public"]["Enums"]["vendor_po_status"]
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_pos_client_po_id_fkey"
            columns: ["client_po_id"]
            isOneToOne: false
            referencedRelation: "client_pos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_pos_client_po_id_fkey"
            columns: ["client_po_id"]
            isOneToOne: false
            referencedRelation: "v_po_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_pos_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "v_vendor_po_balance"
            referencedColumns: ["vendor_id"]
          },
          {
            foreignKeyName: "vendor_pos_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_prices: {
        Row: {
          created_at: string
          id: string
          lead_time_days: number | null
          product_id: string
          quoted_on: string
          unit_price: number
          vendor_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          lead_time_days?: number | null
          product_id: string
          quoted_on?: string
          unit_price: number
          vendor_id: string
        }
        Update: {
          created_at?: string
          id?: string
          lead_time_days?: number | null
          product_id?: string
          quoted_on?: string
          unit_price?: number
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_prices_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_prices_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_part_history"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "vendor_prices_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "v_vendor_po_balance"
            referencedColumns: ["vendor_id"]
          },
          {
            foreignKeyName: "vendor_prices_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendors: {
        Row: {
          city: string | null
          contact_person: string | null
          created_at: string
          created_by: string | null
          email: string | null
          gstin: string | null
          id: string
          iso_certified: boolean
          name: string
          notes: string | null
          phone: string | null
          quality_rating: number | null
          specialisation: string | null
          type: Database["public"]["Enums"]["vendor_type"]
        }
        Insert: {
          city?: string | null
          contact_person?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          gstin?: string | null
          id?: string
          iso_certified?: boolean
          name: string
          notes?: string | null
          phone?: string | null
          quality_rating?: number | null
          specialisation?: string | null
          type: Database["public"]["Enums"]["vendor_type"]
        }
        Update: {
          city?: string | null
          contact_person?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          gstin?: string | null
          id?: string
          iso_certified?: boolean
          name?: string
          notes?: string | null
          phone?: string | null
          quality_rating?: number | null
          specialisation?: string | null
          type?: Database["public"]["Enums"]["vendor_type"]
        }
        Relationships: []
      }
    }
    Views: {
      v_dashboard_kpis: {
        Row: {
          active_orders: number | null
          ar_0_30: number | null
          ar_31_60: number | null
          ar_61_90: number | null
          ar_90_plus: number | null
          awaiting_owner_approval: number | null
          bg_expiring_30d: number | null
          bg_live_value: number | null
          bid_pipeline_value: number | null
          certificates_expiring_30d: number | null
          deliveries_due_45d: number | null
          deliveries_due_45d_value: number | null
          deliveries_overdue: number | null
          extensions_due: number | null
          fy_start: string | null
          ld_exposure_open: number | null
          locked_pos: number | null
          lost_fy: number | null
          open_tenders: number | null
          order_book_value: number | null
          payables_total: number | null
          ready_to_claim: number | null
          receivables_total: number | null
          reminders_due_today: number | null
          win_rate_fy_pct: number | null
          won_fy: number | null
        }
        Relationships: []
      }
      v_invoice_balance: {
        Row: {
          age_bucket: string | null
          age_days: number | null
          balance_due: number | null
          client_id: string | null
          client_name: string | null
          client_po_id: string | null
          gst: number | null
          gst_tds: number | null
          invoice_date: string | null
          invoice_id: string | null
          invoice_no: string | null
          last_receipt_on: string | null
          ld_deducted: number | null
          other_deductions: number | null
          po_number: string | null
          received: number | null
          taxable_value: number | null
          tds: number | null
          total: number | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_client_po_id_fkey"
            columns: ["client_po_id"]
            isOneToOne: true
            referencedRelation: "client_pos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_client_po_id_fkey"
            columns: ["client_po_id"]
            isOneToOne: true
            referencedRelation: "v_po_overview"
            referencedColumns: ["id"]
          },
        ]
      }
      v_part_history: {
        Row: {
          client_name: string | null
          part_number: string | null
          product_id: string | null
          product_name: string | null
          published_on: string | null
          qty: number | null
          ref_no: string | null
          result_on: string | null
          tender_id: string | null
          tender_status: Database["public"]["Enums"]["tender_status"] | null
          unit_bid_price: number | null
          unit_cost: number | null
          vendor_name: string | null
          vendor_type: Database["public"]["Enums"]["vendor_type"] | null
        }
        Relationships: []
      }
      v_po_lines: {
        Row: {
          client_po_id: string | null
          client_po_item_id: string | null
          delivered_qty: number | null
          ordered_qty: number | null
          part_number: string | null
          pending_qty: number | null
          pending_value: number | null
          product_name: string | null
          unit_price: number | null
        }
        Relationships: [
          {
            foreignKeyName: "client_po_items_client_po_id_fkey"
            columns: ["client_po_id"]
            isOneToOne: false
            referencedRelation: "client_pos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_po_items_client_po_id_fkey"
            columns: ["client_po_id"]
            isOneToOne: false
            referencedRelation: "v_po_overview"
            referencedColumns: ["id"]
          },
        ]
      }
      v_po_overview: {
        Row: {
          all_dcs_signed: boolean | null
          client_id: string | null
          client_name: string | null
          days_to_due: number | null
          delay_clause_text: string | null
          delivered_qty: number | null
          dispatch_count: number | null
          due_date: string | null
          effective_due: string | null
          extended_due_date: string | null
          extension_due: boolean | null
          has_approved_extension: boolean | null
          has_pending_extension: boolean | null
          id: string | null
          invoice_id: string | null
          last_dispatch_on: string | null
          latest_vendor_eta: string | null
          ld_basis: Database["public"]["Enums"]["ld_basis"] | null
          ld_cap_pct: number | null
          ld_exposure: number | null
          ld_rate_pct_per_week: number | null
          open_discrepancies: number | null
          ordered_qty: number | null
          payment_docs_missing: string[] | null
          pending_qty: number | null
          pending_value: number | null
          po_date: string | null
          po_doc_types: string[] | null
          po_number: string | null
          projected_delivery: string | null
          ready_to_claim: boolean | null
          status: Database["public"]["Enums"]["po_status"] | null
          tender_doc_types: string[] | null
          tender_id: string | null
          tender_ref: string | null
          title: string | null
          total_value: number | null
          value_delivered_late: number | null
          vendor_eta_late: boolean | null
          weeks_late_projected: number | null
        }
        Relationships: [
          {
            foreignKeyName: "client_pos_tender_id_fkey"
            columns: ["tender_id"]
            isOneToOne: true
            referencedRelation: "tenders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_pos_tender_id_fkey"
            columns: ["tender_id"]
            isOneToOne: true
            referencedRelation: "v_part_history"
            referencedColumns: ["tender_id"]
          },
          {
            foreignKeyName: "client_pos_tender_id_fkey"
            columns: ["tender_id"]
            isOneToOne: true
            referencedRelation: "v_tender_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenders_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenders_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_invoice_balance"
            referencedColumns: ["client_id"]
          },
        ]
      }
      v_tender_summary: {
        Row: {
          approved_at: string | null
          client_id: string | null
          client_name: string | null
          client_type: Database["public"]["Enums"]["client_type"] | null
          days_to_submission: number | null
          emd_amount: number | null
          id: string | null
          item_count: number | null
          lines_incomplete: number | null
          loss_reason: string | null
          margin: number | null
          margin_pct: number | null
          open_required_docs: number | null
          open_submission_checks: number | null
          published_on: string | null
          ref_no: string | null
          result_on: string | null
          source: Database["public"]["Enums"]["tender_source"] | null
          status: Database["public"]["Enums"]["tender_status"] | null
          submission_due: string | null
          submitted_at: string | null
          title: string | null
          total_bid: number | null
          total_cost: number | null
        }
        Relationships: [
          {
            foreignKeyName: "tenders_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenders_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_invoice_balance"
            referencedColumns: ["client_id"]
          },
        ]
      }
      v_vendor_po_balance: {
        Row: {
          balance_due: number | null
          client_po_id: string | null
          client_po_number: string | null
          eta: string | null
          eta_after_client_due: boolean | null
          ordered_qty: number | null
          paid: number | null
          payable_now: number | null
          po_date: string | null
          po_number: string | null
          po_value: number | null
          received_qty: number | null
          received_value: number | null
          status: Database["public"]["Enums"]["vendor_po_status"] | null
          vendor_id: string | null
          vendor_name: string | null
          vendor_po_id: string | null
          vendor_type: Database["public"]["Enums"]["vendor_type"] | null
        }
        Relationships: [
          {
            foreignKeyName: "vendor_pos_client_po_id_fkey"
            columns: ["client_po_id"]
            isOneToOne: false
            referencedRelation: "client_pos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_pos_client_po_id_fkey"
            columns: ["client_po_id"]
            isOneToOne: false
            referencedRelation: "v_po_overview"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      acknowledge_po: { Args: { p_po_id: string }; Returns: undefined }
      approve_tender: {
        Args: { p_comment?: string; p_tender_id: string }
        Returns: undefined
      }
      fn_add_discrepancy: {
        Args: {
          p_actual: string
          p_expected: string
          p_field: string
          p_item: string
          p_po: string
        }
        Returns: undefined
      }
      fn_is_owner: { Args: never; Returns: boolean }
      fn_is_system_context: { Args: never; Returns: boolean }
      fn_ld_amount: {
        Args: {
          p_basis: number
          p_cap: number
          p_rate: number
          p_weeks: number
        }
        Returns: number
      }
      fn_my_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      fn_refresh_alerts: { Args: never; Returns: Json }
      fn_weeks_late: {
        Args: { p_delivered: string; p_due: string }
        Returns: number
      }
      release_po_lock: { Args: { p_po_id: string }; Returns: undefined }
      return_tender: {
        Args: { p_comment: string; p_tender_id: string }
        Returns: undefined
      }
    }
    Enums: {
      bg_kind: "emd" | "pbg"
      bg_status: "active" | "released" | "invoked" | "expired"
      checklist_kind: "item" | "required_doc" | "submission_check"
      checklist_source: "ai" | "manual"
      client_type: "defence_wing" | "dpsu" | "private_mfr"
      extension_status: "draft" | "sent" | "approved" | "rejected"
      inspection_agency: "dgqa" | "buyer_qa" | "third_party"
      inspection_result: "pending" | "passed" | "failed"
      ld_basis: "delayed_value" | "po_value"
      po_status:
        | "received"
        | "locked"
        | "acknowledged"
        | "in_execution"
        | "fully_delivered"
        | "invoiced"
        | "closed"
      reminder_channel: "call" | "email" | "visit"
      reminder_status: "open" | "done" | "snoozed"
      tender_source:
        | "gem"
        | "cppp"
        | "defence_portal"
        | "client_portal"
        | "client_email"
      tender_status:
        | "identified"
        | "evaluation"
        | "preparation"
        | "owner_review"
        | "submitted"
        | "won"
        | "lost"
        | "cancelled"
        | "not_materialised"
      user_role: "owner" | "tender" | "purchase" | "accounts" | "logistics"
      vendor_po_status:
        | "draft"
        | "placed"
        | "partially_received"
        | "received"
        | "cancelled"
      vendor_type: "oem" | "supplier" | "subcontractor"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      bg_kind: ["emd", "pbg"],
      bg_status: ["active", "released", "invoked", "expired"],
      checklist_kind: ["item", "required_doc", "submission_check"],
      checklist_source: ["ai", "manual"],
      client_type: ["defence_wing", "dpsu", "private_mfr"],
      extension_status: ["draft", "sent", "approved", "rejected"],
      inspection_agency: ["dgqa", "buyer_qa", "third_party"],
      inspection_result: ["pending", "passed", "failed"],
      ld_basis: ["delayed_value", "po_value"],
      po_status: [
        "received",
        "locked",
        "acknowledged",
        "in_execution",
        "fully_delivered",
        "invoiced",
        "closed",
      ],
      reminder_channel: ["call", "email", "visit"],
      reminder_status: ["open", "done", "snoozed"],
      tender_source: [
        "gem",
        "cppp",
        "defence_portal",
        "client_portal",
        "client_email",
      ],
      tender_status: [
        "identified",
        "evaluation",
        "preparation",
        "owner_review",
        "submitted",
        "won",
        "lost",
        "cancelled",
        "not_materialised",
      ],
      user_role: ["owner", "tender", "purchase", "accounts", "logistics"],
      vendor_po_status: [
        "draft",
        "placed",
        "partially_received",
        "received",
        "cancelled",
      ],
      vendor_type: ["oem", "supplier", "subcontractor"],
    },
  },
} as const
