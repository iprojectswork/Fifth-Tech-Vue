import type { Router } from 'vue-router'

const dynamicNames: string[] = []

export function trackDynamicRouteName(name: string): void {
  if (!dynamicNames.includes(name)) {
    dynamicNames.push(name)
  }
}

export function resetDynamicRoutes(router: Router): void {
  for (const name of [...dynamicNames]) {
    if (router.hasRoute(name)) {
      router.removeRoute(name)
    }
  }
  dynamicNames.length = 0
}

export function getDynamicRouteNames(): readonly string[] {
  return dynamicNames
}
