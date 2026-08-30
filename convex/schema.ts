import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
  cases: defineTable({
    caseId: v.string(),
    subjects: v.array(
      v.object({
        code: v.string(),
        name: v.string(),
        practical: v.boolean(),
      })
    ),
    compulsory: v.array(v.string()),
    createdAt: v.number(),
  }).index('by_caseId', ['caseId']),

  students: defineTable({
    caseId: v.string(),
    studentId: v.string(),
    name: v.string(),
    class: v.string(),
    optional: v.string(),
    marks: v.any(),
  }).index('by_caseId', ['caseId']),

  results: defineTable({
    caseId: v.string(),
    studentId: v.string(),
    finalGpa: v.number(),
    finalGrade: v.string(),
    uncancelledGpa: v.number(),
    hasCompulsoryFail: v.boolean(),
    flags: v.object({
      optionalRuleAffected: v.boolean(),
      practicalFail: v.boolean(),
      absent: v.boolean(),
      highAvgFail: v.boolean(),
    }),
  }).index('by_caseId', ['caseId']),
})
