import { createSupabaseServerClient } from '@/app/supabase.server'
import { getSession, commitSession } from '@/app/sessions';

type UserInfo = {
  userLogInAs: any,
  accountName: string,
  profileName: string,
  profileId: number,
  isChild: boolean
}


export async function getUserInfo(request: any, forceRefresh: boolean = false): 
  Promise<{ 
    data: UserInfo | null, 
    error?: string | null, 
    headers?: any | null, 
    source?: string | null
  }> 
{
  // check if session exists first
  const session = await getSession(request.headers.get('Cookie'));
  const userSessionData = session.get('userData');

  // IF session exist & not force refresh, return info from session
  if (userSessionData && !forceRefresh) {
    return {data: userSessionData, source: "session", headers: null}
  }

  // if no session, continue to auth from supabase
  const { supabaseClient } = createSupabaseServerClient(request)
  const { data: { user } } = await supabaseClient.auth.getUser() 

  // if logged out
  if (!user) { 
    session.unset('userData')
    return { data: null, error: "User not authenticated", headers: { "Set-Cookie" : await commitSession(session)}}
  }

  // Get profileId, store info in session
  const { data: acct, error: getAcctError } = await supabaseClient
    .from('accounts')
    .select('id')
    .eq('user_id', user?.id)
  if (getAcctError) { return { data: null, error: getAcctError.message} }

  const userData = {
    userLogInAs: user.app_metadata.logInAs, 
    accountName: user.user_metadata.name, 
    profileName: user.app_metadata.logInAs == null ? user.user_metadata.name : user.app_metadata.logInAs.name,
    profileId: user.app_metadata.logInAs == null ? acct[0].id  : user.app_metadata.logInAs.id,
    isChild: user.app_metadata.logInAs != null
  }

  session.set('userData', userData)
  return { 
    data: userData,
    error: null,
    headers: { "Set-Cookie" : await commitSession(session)},
    source: "supabase"
  }
}
