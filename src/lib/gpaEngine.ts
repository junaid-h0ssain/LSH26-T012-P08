export type SubjectConfig = {
  code: string
  name: string
  practical: boolean
}

export type MarkValue = number | { theory: number; practical: number } | 'AB'

export type StudentInput = {
  id: string
  name: string
  class: string
  optional: string
  marks: Record<string, MarkValue>
}

export type SubjectTrace = {
  code: string
  name: string
  practical: boolean
  isCompulsory: boolean
  isOptional: boolean
  rawMark: MarkValue
  theoryMark?: number
  practicalMark?: number
  totalMark: number | 'AB'
  gradePoint: number
  letterGrade: string
  passed: boolean
  failureReason?: 'ABSENT' | 'THEORY_FAIL' | 'PRACTICAL_FAIL' | 'TOTAL_FAIL'
  ruleApplied: string
}

export type StudentResult = {
  id: string
  name: string
  class: string
  optionalCode: string
  optionalName: string
  subjectTraces: SubjectTrace[]
  compulsoryGradePoints: { code: string; name: string; point: number; passed: boolean }[]
  sumCompulsoryPoints: number
  optionalGradePoint: number
  optionalContribution: number
  uncancelledGpa: number
  finalGpa: number
  finalGrade: string
  hasCompulsoryFail: boolean
  failedCompulsorySubjects: { code: string; name: string; reason: string }[]
  flags: {
    optionalRuleAffected: boolean // opt_gp <= 2.0 (an absent optional counts)
    practicalFail: boolean // any subject practical < 8
    absent: boolean // any subject AB
    highAvgFail: boolean // failed compulsory but uncancelled average >= 3.0
  }
}

export type CaseData = {
  case_id: string
  subjects: SubjectConfig[]
  compulsory: string[]
  students: StudentInput[]
}

/**
 * Standard Grading Scale (out of 100 total mark):
 * 80 - 100: 5.0 (A+)
 * 70 - 79:  4.0 (A)
 * 60 - 69:  3.5 (A-)
 * 50 - 59:  3.0 (B)
 * 40 - 49:  2.0 (C)
 * 33 - 39:  1.0 (D)
 * 0  - 32:  0.0 (F)
 */
export function getGradePointAndLetter(totalMark: number): { point: number; letter: string } {
  if (totalMark >= 80) return { point: 5.0, letter: 'A+' }
  if (totalMark >= 70) return { point: 4.0, letter: 'A' }
  if (totalMark >= 60) return { point: 3.5, letter: 'A-' }
  if (totalMark >= 50) return { point: 3.0, letter: 'B' }
  if (totalMark >= 40) return { point: 2.0, letter: 'C' }
  if (totalMark >= 33) return { point: 1.0, letter: 'D' }
  return { point: 0.0, letter: 'F' }
}

/**
 * Letter Grade from Final GPA (R-10):
 * A+ = 5.00
 * A = 4.00 to 4.99
 * A- = 3.50 to 3.99
 * B = 3.00 to 3.49
 * C = 2.00 to 2.99
 * D = 1.00 to 1.99
 * F = fail (< 1.00 or compulsory fail)
 */
export function getLetterFromGpa(gpa: number): string {
  if (gpa >= 5.0) return 'A+'
  if (gpa >= 4.0) return 'A'
  if (gpa >= 3.5) return 'A-'
  if (gpa >= 3.0) return 'B'
  if (gpa >= 2.0) return 'C'
  if (gpa >= 1.0) return 'D'
  return 'F'
}

export function evaluateStudent(
  student: StudentInput,
  subjects: SubjectConfig[],
  compulsoryCodes: string[]
): StudentResult {
  const subjectMap = new Map<string, SubjectConfig>()
  for (const sub of subjects) {
    subjectMap.set(sub.code, sub)
  }

  const traces: SubjectTrace[] = []
  const compulsoryGps: { code: string; name: string; point: number; passed: boolean }[] = []
  const failedCompulsorySubjects: { code: string; name: string; reason: string }[] = []

  let hasPracticalFailFlag = false
  let hasAbsentFlag = false
  let hasCompulsoryFail = false

  // Process Compulsory Subjects
  for (const code of compulsoryCodes) {
    const sub = subjectMap.get(code) || { code, name: code, practical: false }
    const markVal = student.marks[code]

    let trace: SubjectTrace

    if (markVal === 'AB' || markVal === undefined) {
      hasAbsentFlag = true
      hasCompulsoryFail = true
      trace = {
        code,
        name: sub.name,
        practical: sub.practical,
        isCompulsory: true,
        isOptional: false,
        rawMark: 'AB',
        totalMark: 'AB',
        gradePoint: 0.0,
        letterGrade: 'F',
        passed: false,
        failureReason: 'ABSENT',
        ruleApplied: 'Absent in compulsory subject: mark AB, GP 0.0, overall result F (R-12)',
      }
      failedCompulsorySubjects.push({
        code,
        name: sub.name,
        reason: 'Absent (AB) in compulsory subject',
      })
      compulsoryGps.push({ code, name: sub.name, point: 0.0, passed: false })
    } else if (typeof markVal === 'object') {
      const th = markVal.theory ?? 0
      const pr = markVal.practical ?? 0
      const tot = th + pr

      if (pr < 8) {
        hasPracticalFailFlag = true
      }

      if (th < 25 && pr < 8) {
        hasCompulsoryFail = true
        trace = {
          code,
          name: sub.name,
          practical: true,
          isCompulsory: true,
          isOptional: false,
          rawMark: markVal,
          theoryMark: th,
          practicalMark: pr,
          totalMark: tot,
          gradePoint: 0.0,
          letterGrade: 'F',
          passed: false,
          failureReason: 'THEORY_FAIL',
          ruleApplied: `Theory fail (${th}/75 < 25) & Practical fail (${pr}/25 < 8): GP 0.0 (R-11)`,
        }
        failedCompulsorySubjects.push({
          code,
          name: sub.name,
          reason: `Theory (${th}/75) < 25 & Practical (${pr}/25) < 8`,
        })
        compulsoryGps.push({ code, name: sub.name, point: 0.0, passed: false })
      } else if (th < 25) {
        hasCompulsoryFail = true
        trace = {
          code,
          name: sub.name,
          practical: true,
          isCompulsory: true,
          isOptional: false,
          rawMark: markVal,
          theoryMark: th,
          practicalMark: pr,
          totalMark: tot,
          gradePoint: 0.0,
          letterGrade: 'F',
          passed: false,
          failureReason: 'THEORY_FAIL',
          ruleApplied: `Theory fail (${th}/75 < 25 with pass mark 25): GP 0.0 (R-11)`,
        }
        failedCompulsorySubjects.push({
          code,
          name: sub.name,
          reason: `Theory fail (${th}/75 < 25)`,
        })
        compulsoryGps.push({ code, name: sub.name, point: 0.0, passed: false })
      } else if (pr < 8) {
        hasCompulsoryFail = true
        trace = {
          code,
          name: sub.name,
          practical: true,
          isCompulsory: true,
          isOptional: false,
          rawMark: markVal,
          theoryMark: th,
          practicalMark: pr,
          totalMark: tot,
          gradePoint: 0.0,
          letterGrade: 'F',
          passed: false,
          failureReason: 'PRACTICAL_FAIL',
          ruleApplied: `Practical fail (${pr}/25 < 8 with pass mark 8, Theory ${th}/75 passed): GP 0.0 (R-11)`,
        }
        failedCompulsorySubjects.push({
          code,
          name: sub.name,
          reason: `Practical fail (${pr}/25 < 8) despite Theory pass (${th}/75)`,
        })
        compulsoryGps.push({ code, name: sub.name, point: 0.0, passed: false })
      } else {
        const { point, letter } = getGradePointAndLetter(tot)
        if (point === 0.0) {
          hasCompulsoryFail = true
          trace = {
            code,
            name: sub.name,
            practical: true,
            isCompulsory: true,
            isOptional: false,
            rawMark: markVal,
            theoryMark: th,
            practicalMark: pr,
            totalMark: tot,
            gradePoint: 0.0,
            letterGrade: 'F',
            passed: false,
            failureReason: 'TOTAL_FAIL',
            ruleApplied: `Total mark (${tot}/100 < 33) below passing scale: GP 0.0 (R-11)`,
          }
          failedCompulsorySubjects.push({
            code,
            name: sub.name,
            reason: `Total marks (${tot}/100) < 33`,
          })
          compulsoryGps.push({ code, name: sub.name, point: 0.0, passed: false })
        } else {
          trace = {
            code,
            name: sub.name,
            practical: true,
            isCompulsory: true,
            isOptional: false,
            rawMark: markVal,
            theoryMark: th,
            practicalMark: pr,
            totalMark: tot,
            gradePoint: point,
            letterGrade: letter,
            passed: true,
            ruleApplied: `Theory ${th}/75 (>=25) + Practical ${pr}/25 (>=8) = ${tot}/100 -> GP ${point.toFixed(2)} (${letter}) (R-11)`,
          }
          compulsoryGps.push({ code, name: sub.name, point, passed: true })
        }
      }
    } else {
      const tot = markVal
      const { point, letter } = getGradePointAndLetter(tot)
      if (point === 0.0) {
        hasCompulsoryFail = true
        trace = {
          code,
          name: sub.name,
          practical: false,
          isCompulsory: true,
          isOptional: false,
          rawMark: tot,
          totalMark: tot,
          gradePoint: 0.0,
          letterGrade: 'F',
          passed: false,
          failureReason: 'TOTAL_FAIL',
          ruleApplied: `Total mark (${tot}/100 < 33) below passing threshold: GP 0.0 (R-11)`,
        }
        failedCompulsorySubjects.push({
          code,
          name: sub.name,
          reason: `Total marks (${tot}/100) < 33`,
        })
        compulsoryGps.push({ code, name: sub.name, point: 0.0, passed: false })
      } else {
        trace = {
          code,
          name: sub.name,
          practical: false,
          isCompulsory: true,
          isOptional: false,
          rawMark: tot,
          totalMark: tot,
          gradePoint: point,
          letterGrade: letter,
          passed: true,
          ruleApplied: `Score ${tot}/100 -> Grade Point ${point.toFixed(2)} (${letter}) (R-11)`,
        }
        compulsoryGps.push({ code, name: sub.name, point, passed: true })
      }
    }
    traces.push(trace)
  }

  // Process Optional Subject
  const optCode = student.optional
  const optSub = subjectMap.get(optCode) || { code: optCode, name: optCode, practical: true }
  const optMark = student.marks[optCode]

  let optTrace: SubjectTrace
  let optGp = 0.0

  if (optMark === 'AB' || optMark === undefined) {
    hasAbsentFlag = true
    optGp = 0.0
    optTrace = {
      code: optCode,
      name: optSub.name,
      practical: optSub.practical,
      isCompulsory: false,
      isOptional: true,
      rawMark: 'AB',
      totalMark: 'AB',
      gradePoint: 0.0,
      letterGrade: 'F',
      passed: false,
      failureReason: 'ABSENT',
      ruleApplied: 'Absent in optional subject: contributes 0 GP, student flagged on office checking list (R-12)',
    }
  } else if (typeof optMark === 'object') {
    const th = optMark.theory ?? 0
    const pr = optMark.practical ?? 0
    const tot = th + pr

    if (pr < 8) {
      hasPracticalFailFlag = true
    }

    if (th < 25 && pr < 8) {
      optGp = 0.0
      optTrace = {
        code: optCode,
        name: optSub.name,
        practical: true,
        isCompulsory: false,
        isOptional: true,
        rawMark: optMark,
        theoryMark: th,
        practicalMark: pr,
        totalMark: tot,
        gradePoint: 0.0,
        letterGrade: 'F',
        passed: false,
        failureReason: 'THEORY_FAIL',
        ruleApplied: `Optional Theory fail (${th}/75 < 25) & Practical fail (${pr}/25 < 8): GP 0.0 (R-11)`,
      }
    } else if (th < 25) {
      optGp = 0.0
      optTrace = {
        code: optCode,
        name: optSub.name,
        practical: true,
        isCompulsory: false,
        isOptional: true,
        rawMark: optMark,
        theoryMark: th,
        practicalMark: pr,
        totalMark: tot,
        gradePoint: 0.0,
        letterGrade: 'F',
        passed: false,
        failureReason: 'THEORY_FAIL',
        ruleApplied: `Optional Theory fail (${th}/75 < 25): GP 0.0 (R-11)`,
      }
    } else if (pr < 8) {
      optGp = 0.0
      optTrace = {
        code: optCode,
        name: optSub.name,
        practical: true,
        isCompulsory: false,
        isOptional: true,
        rawMark: optMark,
        theoryMark: th,
        practicalMark: pr,
        totalMark: tot,
        gradePoint: 0.0,
        letterGrade: 'F',
        passed: false,
        failureReason: 'PRACTICAL_FAIL',
        ruleApplied: `Optional Practical fail (${pr}/25 < 8): GP 0.0 (R-11)`,
      }
    } else {
      const { point, letter } = getGradePointAndLetter(tot)
      optGp = point
      optTrace = {
        code: optCode,
        name: optSub.name,
        practical: true,
        isCompulsory: false,
        isOptional: true,
        rawMark: optMark,
        theoryMark: th,
        practicalMark: pr,
        totalMark: tot,
        gradePoint: point,
        letterGrade: letter,
        passed: point > 0.0,
        ruleApplied: `Optional Theory ${th}/75 + Practical ${pr}/25 = ${tot}/100 -> GP ${point.toFixed(2)} (${letter}) (R-11)`,
      }
    }
  } else {
    const tot = optMark
    const { point, letter } = getGradePointAndLetter(tot)
    optGp = point
    optTrace = {
      code: optCode,
      name: optSub.name,
      practical: false,
      isCompulsory: false,
      isOptional: true,
      rawMark: tot,
      totalMark: tot,
      gradePoint: point,
      letterGrade: letter,
      passed: point > 0.0,
      ruleApplied: `Optional mark ${tot}/100 -> GP ${point.toFixed(2)} (${letter}) (R-11)`,
    }
  }

  traces.push(optTrace)

  // Optional Rule Calculation: GP > 2 contributes max(0, GP - 2)
  const optContrib = Math.max(0.0, optGp - 2.0)
  const sumCompPoints = compulsoryGps.reduce((acc, c) => acc + c.point, 0)
  
  // GPA calculation: (sum of compulsory GP + max(0, optGP - 2)) / 6, capped at 5.00
  const rawCalculatedAvg = (sumCompPoints + optContrib) / 6.0
  const uncancelledGpa = Math.min(5.0, Math.round(rawCalculatedAvg * 100) / 100)

  let finalGpa = 0.0
  let finalGrade = 'F'

  if (hasCompulsoryFail) {
    finalGpa = 0.0
    finalGrade = 'F'
  } else {
    finalGpa = uncancelledGpa
    finalGrade = getLetterFromGpa(finalGpa)
  }

  const optionalRuleAffected = optGp <= 2.0 // R-29: optional list = every student whose optional GP <= 2.0

  return {
    id: student.id,
    name: student.name,
    class: student.class,
    optionalCode: optCode,
    optionalName: optSub.name,
    subjectTraces: traces,
    compulsoryGradePoints: compulsoryGps,
    sumCompulsoryPoints: Math.round(sumCompPoints * 100) / 100,
    optionalGradePoint: optGp,
    optionalContribution: Math.round(optContrib * 100) / 100,
    uncancelledGpa,
    finalGpa,
    finalGrade,
    hasCompulsoryFail,
    failedCompulsorySubjects,
    flags: {
      optionalRuleAffected,
      practicalFail: hasPracticalFailFlag,
      absent: hasAbsentFlag,
      highAvgFail: hasCompulsoryFail && uncancelledGpa >= 3.0,
    },
  }
}

export function evaluateCase(caseData: CaseData): StudentResult[] {
  return caseData.students.map((student) =>
    evaluateStudent(student, caseData.subjects, caseData.compulsory)
  )
}
