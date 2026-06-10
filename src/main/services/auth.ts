import { Auth } from 'msmc'
import type { AccountProfile } from '@shared/types'
import { offlineUUID } from '../util'

export interface MclcAuth {
  access_token: string
  client_token: string
  uuid: string
  name: string
  user_properties: Record<string, unknown> | string
  meta?: { type: 'mojang' | 'msa'; demo?: boolean }
}

export async function loginMicrosoft(): Promise<AccountProfile> {
  const authManager = new Auth('select_account')
  const xbox = await authManager.launch('electron')
  const mc = await xbox.getMinecraft()
  const mclc = mc.mclc(true) as unknown as MclcAuth
  let refreshToken = ''
  try {
    refreshToken = xbox.save()
  } catch {
    /* msmc peut ne pas exposer save() selon le flux */
  }
  return {
    id: `ms-${mclc.uuid}`,
    type: 'microsoft',
    uuid: mclc.uuid,
    name: mclc.name,
    mclc,
    refreshToken,
    expiresAt: Date.now() + 23 * 60 * 60 * 1000
  }
}

export async function refreshMicrosoft(account: AccountProfile): Promise<AccountProfile> {
  if (!account.refreshToken) throw new Error('Reconnexion Microsoft requise')
  const authManager = new Auth('select_account')
  const xbox = await authManager.refresh(account.refreshToken)
  const mc = await xbox.getMinecraft()
  const mclc = mc.mclc(true) as unknown as MclcAuth
  let refreshToken = account.refreshToken
  try {
    refreshToken = xbox.save()
  } catch {
    /* garde l'ancien token */
  }
  return {
    ...account,
    uuid: mclc.uuid,
    name: mclc.name,
    mclc,
    refreshToken,
    expiresAt: Date.now() + 23 * 60 * 60 * 1000
  }
}

export function loginOffline(username: string): AccountProfile {
  const clean = username.trim()
  if (!/^[A-Za-z0-9_]{3,16}$/.test(clean)) {
    throw new Error('Pseudo invalide (3 à 16 caractères : lettres, chiffres, _).')
  }
  const uuid = offlineUUID(clean)
  return { id: `offline-${uuid}`, type: 'offline', uuid, name: clean }
}

export function buildAuthorization(account: AccountProfile): MclcAuth {
  if (account.type === 'microsoft' && account.mclc) {
    return account.mclc as MclcAuth
  }
  return {
    access_token: '0',
    client_token: account.uuid,
    uuid: account.uuid,
    name: account.name,
    user_properties: {},
    meta: { type: 'mojang', demo: false }
  }
}

export async function ensureValidAuth(
  account: AccountProfile
): Promise<{ account: AccountProfile; authorization: MclcAuth }> {
  if (account.type === 'offline') {
    return { account, authorization: buildAuthorization(account) }
  }
  if (account.expiresAt && account.expiresAt < Date.now()) {
    const refreshed = await refreshMicrosoft(account)
    return { account: refreshed, authorization: buildAuthorization(refreshed) }
  }
  return { account, authorization: buildAuthorization(account) }
}
