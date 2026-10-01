import { describe, it, expect } from 'vitest'
import {
  getActivePlan, isPaidFarmerPlan, isAgronomistPro, aiLimitKey, resolveAiLimits,
  HECTARE_LIMITS, MEMBER_LIMITS, subscriptionProfileFor,
} from '../../shared/utils/plan'

const now = new Date('2026-10-01T12:00:00Z')

describe('getActivePlan', () => {
  it('без підписки — basic', () => {
    expect(getActivePlan(null, now)).toBe('basic')
    expect(getActivePlan({ plan: null }, now)).toBe('basic')
  })
  it('без дати завершення — план діє', () => {
    expect(getActivePlan({ plan: 'business', expires_at: null }, now)).toBe('business')
  })
  it('майбутня дата — план діє, минула — basic', () => {
    expect(getActivePlan({ plan: 'business_pro', expires_at: '2026-11-01T00:00:00Z' }, now)).toBe('business_pro')
    expect(getActivePlan({ plan: 'business_pro', expires_at: '2026-09-01T00:00:00Z' }, now)).toBe('basic')
  })
  it('premium трактується як business, pro лишається pro, невідомий — basic', () => {
    expect(getActivePlan({ plan: 'premium' }, now)).toBe('business')
    expect(getActivePlan({ plan: 'pro' }, now)).toBe('pro')
    expect(getActivePlan({ plan: 'something' }, now)).toBe('basic')
  })
})

describe('доступи та ліміти', () => {
  it('платні плани фермера', () => {
    expect(isPaidFarmerPlan('business')).toBe(true)
    expect(isPaidFarmerPlan('business_pro')).toBe(true)
    expect(isPaidFarmerPlan('pro')).toBe(false)
    expect(isPaidFarmerPlan('basic')).toBe(false)
    expect(isAgronomistPro('pro')).toBe(true)
  })
  it('гектари і команда', () => {
    expect(HECTARE_LIMITS.basic).toBe(2)
    expect(HECTARE_LIMITS.business).toBe(Infinity)
    expect(MEMBER_LIMITS.basic).toBe(0)
    expect(MEMBER_LIMITS.business).toBe(5)
    expect(MEMBER_LIMITS.business_pro).toBe(Infinity)
  })
})

describe('AI ліміти', () => {
  it('ключ: агроном без PRO має окремий ліміт', () => {
    expect(aiLimitKey('basic', 'agronomist')).toBe('agronomist_basic')
    expect(aiLimitKey('basic', 'farmer')).toBe('basic')
    expect(aiLimitKey('pro', 'agronomist')).toBe('pro')
  })
  it('fallback без даних у БД', () => {
    expect(resolveAiLimits('basic', {})).toEqual({ text: 0, photo: 0 })
    expect(resolveAiLimits('agronomist_basic', {})).toEqual({ text: 10, photo: 2 })
    expect(resolveAiLimits('pro', null)).toEqual({ text: 500, photo: 60 })
    expect(resolveAiLimits('business', {})).toEqual({ text: 3000, photo: 300 })
  })
  it('значення з ai_plan_limits мають пріоритет над fallback', () => {
    expect(resolveAiLimits('business', { business: { text: 100, photo: 5 } })).toEqual({ text: 100, photo: 5 })
  })
  it('індивідуальний ліміт з subscriptions має найвищий пріоритет', () => {
    const db = { business: { text: 100, photo: 5 } }
    expect(resolveAiLimits('business', db, { ai_text_limit: 7, ai_photo_limit: null })).toEqual({ text: 7, photo: 5 })
  })
})

describe('профіль підписки', () => {
  it('агроном — окремий профіль, решта ролей — фермерський', () => {
    expect(subscriptionProfileFor('agronomist')).toBe('agronomist')
    expect(subscriptionProfileFor('farmer')).toBe('farmer')
    expect(subscriptionProfileFor('dacha')).toBe('farmer')
    expect(subscriptionProfileFor(null)).toBe('farmer')
  })
})
