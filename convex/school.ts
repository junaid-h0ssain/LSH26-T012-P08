import { mutation, query } from './_generated/server'
import { v } from 'convex/values'

export const listCases = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query('cases').order('desc').collect()
  },
})

export const getCaseStudents = query({
  args: { caseId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('students')
      .withIndex('by_caseId', (q) => q.eq('caseId', args.caseId))
      .collect()
  },
})

export const saveCase = mutation({
  args: {
    caseId: v.string(),
    subjects: v.array(
      v.object({
        code: v.string(),
        name: v.string(),
        practical: v.boolean(),
      })
    ),
    compulsory: v.array(v.string()),
    students: v.array(
      v.object({
        id: v.string(),
        name: v.string(),
        class: v.string(),
        optional: v.string(),
        marks: v.any(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('cases')
      .withIndex('by_caseId', (q) => q.eq('caseId', args.caseId))
      .first()

    if (!existing) {
      await ctx.db.insert('cases', {
        caseId: args.caseId,
        subjects: args.subjects,
        compulsory: args.compulsory,
        createdAt: Date.now(),
      })
    }

    for (const student of args.students) {
      await ctx.db.insert('students', {
        caseId: args.caseId,
        studentId: student.id,
        name: student.name,
        class: student.class,
        optional: student.optional,
        marks: student.marks,
      })
    }

    return { success: true, caseId: args.caseId, count: args.students.length }
  },
})
