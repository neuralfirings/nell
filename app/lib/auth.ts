import { createSupabaseServerClient } from '@/app/supabase.server'
import { getSession, commitSession } from '@/app/sessions';

type UserInfo = {
  // userLogInAs: any,
  accountName: string,
  profileName: string,
  profileId: number,
  isChild: boolean
}

export function sessionToUserInfo(session: any) {
  const user = session.session ? session.session.user : session.user
  // console.log("session", session)
  // console.log("user >>", user)
  
  return {
    // userLogInAs: user.app_metadata.logInAs, 
    accountName: user.user_metadata.name, 
    profileName: user.app_metadata.logInAs.name,
    profileId: user.app_metadata.logInAs.id, 
    isChild: user.app_metadata.logInAs.isChild
  }
}

export async function getUserInfo(request: any, forceRefresh: boolean = false): 
  Promise<{ 
    data: UserInfo | null, 
    error?: string | null, 
    headers?: any | null, 
    source?: string | null
  }> 
{
  const { supabaseClient, headers } = createSupabaseServerClient(request)

  const { data: sessionData, error: sessionError } = await supabaseClient.auth.getSession()
  // console.log("in userInfo", sessionData, sessionError)
  if (sessionError) { return { data: null, error: sessionError.message} }

  if ( sessionData.session == null) {
    return { data: null, error: "User not authenticated",  headers}
  }
  else if (sessionData.session.user.app_metadata.logInAs == null) {
    const user = sessionData.session.user
    const { data: accountData, error: accountError } = await supabaseClient.from("accounts")
      .select("id")
      .eq("user_id", user.id)
    if (accountError) { return { data: null, error: accountError.message} }
    const userInfo = {
      accountName: user.user_metadata.name, 
      profileName: user.user_metadata.name,
      profileId: accountData[0].id,
      isChild: false
    }
    return {data: userInfo, error: null, headers: headers, source: "session"}
  }
  else {
    const user =  sessionData.session.user
    const userInfo = {
      accountName: user.user_metadata.name, 
      profileName: user.app_metadata.logInAs.name,
      profileId: user.app_metadata.logInAs.id, 
      isChild: user.app_metadata.logInAs.isChild
    }
    // console.log("userInfo", userInfo)
    return { data: userInfo, error: null, headers: headers, source: "session"}
  }

  // check if session exists first
  const session = await getSession(request.headers.get('Cookie'));
  const userSessionData = session.get('userData');

  // IF session exist & not force refresh, return info from session
  if (userSessionData && !forceRefresh) {
    return {data: userSessionData, source: "session", headers: null}
  }

  // if no session, continue to auth from supabase
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
