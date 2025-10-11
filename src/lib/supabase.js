// ============================================
// FILE: src/lib/supabase.js - CLEAN VERSION
// ============================================
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials!');
  console.error('URL:', supabaseUrl);
  console.error('Key:', supabaseAnonKey ? 'Present' : 'Missing');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Test connection
supabase.from('mess').select('count').limit(1).then(({ error }) => {
  if (error) {
    console.error('❌ Supabase connection failed:', error);
  } else {
    console.log('✅ Supabase connected successfully');
  }
});

// Helper functions for database operations
export const db = {
  // Mess operations
  async createMess(messData) {
    const { data, error } = await supabase
      .from('mess')
      .insert([messData])
      .select()
      .single()
    if (error) throw error
    return data
  },

  async getMess(messId) {
    const { data, error } = await supabase
      .from('mess')
      .select('*')
      .eq('id', messId)
      .single()
    if (error) throw error
    return data
  },

  // Member operations
  async addMember(memberData) {
    const { data, error } = await supabase
      .from('members')
      .insert([memberData])
      .select()
      .single()
    if (error) throw error
    return data
  },

  async getMembers(messId) {
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .eq('mess_id', messId)
      .order('created_at', { ascending: true })
    if (error) throw error
    return data
  },

  // Meal operations
  async logMeal(mealData) {
    const { data, error } = await supabase
      .from('meals')
      .insert([mealData])
      .select()
      .single()
    if (error) throw error
    return data
  },

  async getMeals(messId, startDate, endDate) {
    let query = supabase
      .from('meals')
      .select('*, members(name)')
      .eq('mess_id', messId)
      .order('meal_date', { ascending: false })
    
    if (startDate) query = query.gte('meal_date', startDate)
    if (endDate) query = query.lte('meal_date', endDate)
    
    const { data, error } = await query
    if (error) throw error
    return data
  },

  // Expense operations
  async addExpense(expenseData) {
    const { data, error } = await supabase
      .from('expenses')
      .insert([expenseData])
      .select()
      .single()
    if (error) throw error
    return data
  },

  async getExpenses(messId, startDate, endDate) {
    let query = supabase
      .from('expenses')
      .select('*, members(name)')
      .eq('mess_id', messId)
      .order('created_at', { ascending: false })
    
    if (startDate) query = query.gte('created_at', startDate)
    if (endDate) query = query.lte('created_at', endDate)
    
    const { data, error } = await query
    if (error) throw error
    return data
  },

  // Menu operations
  async addMenuItem(menuData) {
    const { data, error } = await supabase
      .from('menu_items')
      .insert([menuData])
      .select()
      .single()
    if (error) throw error
    return data
  },

  async getMenuItems(messId, date) {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('mess_id', messId)
      .eq('menu_date', date)
      .order('meal_type')
    if (error) throw error
    return data
  },

  // Rules operations
  async addRule(ruleData) {
    const { data, error } = await supabase
      .from('rules')
      .insert([ruleData])
      .select()
      .single()
    if (error) throw error
    return data
  },

  async getRules(messId) {
    const { data, error } = await supabase
      .from('rules')
      .select('*')
      .eq('mess_id', messId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
  },

  // Voting operations
  async castVote(voteData) {
    const { data, error } = await supabase
      .from('votes')
      .upsert([voteData], { onConflict: 'voter_id,mess_id,voting_period' })
      .select()
      .single()
    if (error) throw error
    return data
  },

  async getVotes(messId, votingPeriod) {
    const { data, error } = await supabase
      .from('votes')
      .select('*')
      .eq('mess_id', messId)
      .eq('voting_period', votingPeriod)
    if (error) throw error
    return data
  }
};
