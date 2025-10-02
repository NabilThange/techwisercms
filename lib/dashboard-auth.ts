export function getDashboardPassword(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem("dashboard_password")
}

export function setDashboardPassword(password: string): void {
  if (typeof window === "undefined") return
  localStorage.setItem("dashboard_password", password)
}

export function clearDashboardPassword(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem("dashboard_password")
}

export function isDashboardAuthenticated(): boolean {
  return getDashboardPassword() !== null
}
