/**
 * DEV ONLY — hardcoded identity for standalone development.
 *
 * When this feature is integrated into the main website, replace
 * DEV_TOKEN with the JWT passed from the main website's auth flow.
 * The userID and memberID are decoded from the token server-side —
 * no other code needs to change.
 *
 * Token payload: { sub: "191", session_id: "1446", device_platform: "mobile" }
 */
export const DEV_TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxOTEiLCJzZXNzaW9uX2lkIjoiMTQ0NiIsImRldmljZV9wbGF0Zm9ybSI6Im1vYmlsZSIsImV4cCI6MTc3Njg2NzAwNX0.WHRM1zwPS8z-3adWnRWHVFQ1UssZ-c72znOGCcL_yMs'

export const DEV_USER_ID = '191'
export const DEV_MEMBER_ID = '191' // update if memberID differs from userID
