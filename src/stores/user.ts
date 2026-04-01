import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '../lib/supabase'
import type { User } from '@supabase/supabase-js'

export const useUserStore = defineStore('user', () => {
  const user = ref<User | null>(null)
  const dbUser = ref<any>(null)
  const role = ref<'programmer' | 'normal'>('programmer')
  const isGuest = ref(false)

  const fetchUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      user.value = session?.user || null
      
      if (user.value) {
        isGuest.value = false
        // Ensure user exists in public.users
        const { data: existingUser } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.value.id)
          .single()
          
        if (!existingUser) {
          const { data: newUser } = await supabase
            .from('users')
            .insert({
              id: user.value.id,
              email: user.value.email,
              nickname: user.value.email?.split('@')[0] || 'User',
              role: role.value
            })
            .select()
            .single()
          dbUser.value = newUser
        } else {
          dbUser.value = existingUser
          if (existingUser.role) {
            role.value = existingUser.role
          }
        }

        // Sync local prompts to Supabase if missing in cloud
        if (dbUser.value) {
          const localConfigStr = localStorage.getItem('ai_summary_prompt_config')
          const localPrompt = localStorage.getItem('ai_summary_prompt')
          
          let needsUpdate = false
          const updateData: any = {}
          
          if (!dbUser.value.ai_prompt_config && localConfigStr) {
            try {
              updateData.ai_prompt_config = JSON.parse(localConfigStr)
              needsUpdate = true
            } catch (e) {}
          }
          if (!dbUser.value.ai_prompt && localPrompt) {
            updateData.ai_prompt = localPrompt
            needsUpdate = true
          }
          
          if (needsUpdate) {
            const { error } = await supabase
              .from('users')
              .update(updateData)
              .eq('id', user.value.id)
            if (!error) {
              Object.assign(dbUser.value, updateData)
            }
          }
        }
      } else {
        // Not setting isGuest here if they haven't explicitly chosen it.
        // Wait for explicit guest login or redirect to login page.
        // isGuest.value = true 
        dbUser.value = null
      }
    } catch (e) {
      console.error(e)
    }
  }

  const setGuest = (guestStatus: boolean) => {
    isGuest.value = guestStatus
    if (guestStatus) {
      user.value = null
      dbUser.value = null
    }
  }

  const setRole = async (newRole: 'programmer' | 'normal') => {
    role.value = newRole
    if (user.value && !isGuest.value) {
      await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', user.value.id)
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    user.value = null
    dbUser.value = null
    isGuest.value = false
  }

  return {
    user,
    dbUser,
    role,
    isGuest,
    fetchUser,
    setGuest,
    setRole,
    signOut
  }
})
