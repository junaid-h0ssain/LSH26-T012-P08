import { createFileRoute } from '@tanstack/react-router'
import { useState, useMemo } from 'react'
import {
  evaluateCase,
  type CaseData,
  type StudentResult,
  type SubjectTrace,
} from '../lib/gpaEngine'
import { DEFAULT_DATASET } from '../lib/dataset'
import {
  GraduationCap,
  FileCheck,
  AlertTriangle,
  Upload,
  RotateCcw,
  Search,
  CheckCircle2,
  XCircle,
  HelpCircle,
  BarChart3,
  User,
  BookOpen,
  Award,
  Layers,
  ChevronRight,
  Printer,
} from 'lucide-react'

export const Route = createFileRoute('/')({ component: SchoolGpaDashboard })

function SchoolGpaDashboard() {
  const [caseData, setCaseData] = useState<CaseData>(DEFAULT_DATASET)
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [classFilter, setClassFilter] = useState<string>('ALL')
  const [gradeFilter, setGradeFilter] = useState<string>('ALL')
  const [activeTab, setActiveTab] = useState<'results' | 'checking' | 'hardedges' | 'trace'>('results')
  const [checkingListTab, setCheckingListTab] = useState<'all' | 'optional' | 'practical' | 'absent'>('all')
  const [uploadError, setUploadError] = useState<string | null>(null)

  // Evaluate all students using the GPA Engine
  const results = useMemo(() => evaluateCase(caseData), [caseData])

  // Get distinct classes
  const classes = useMemo(() => {
    const set = new Set<string>()
    for (const r of results) {
      if (r.class) set.add(r.class)
    }
    return Array.from(set).sort()
  }, [results])

  // Hard edge cases identification
  const hardEdges = useMemo(() => {
    return {
      highAvgFail: results.filter((r) => r.flags.highAvgFail),
      practicalFail: results.filter((r) => r.flags.practicalFail),
      optBelowPoint: results.filter((r) => r.flags.optionalRuleAffected),
      absent: results.filter((r) => r.flags.absent),
    }
  }, [results])

  // Checking lists for school administration / office (Requirement 4 & R-29)
  const checkingLists = useMemo(() => {
    const optList = results.filter((r) => r.flags.optionalRuleAffected)
    const practList = results.filter((r) => r.flags.practicalFail)
    const absList = results.filter((r) => r.flags.absent)
    const allFlagged = results.filter(
      (r) => r.flags.optionalRuleAffected || r.flags.practicalFail || r.flags.absent
    )
    return { optList, practList, absList, allFlagged }
  }, [results])

  // Filtered student results for main table
  const filteredResults = useMemo(() => {
    return results.filter((r) => {
      const matchesSearch =
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.id.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesClass = classFilter === 'ALL' || r.class === classFilter
      const matchesGrade =
        gradeFilter === 'ALL' ||
        (gradeFilter === 'PASS' && !r.hasCompulsoryFail) ||
        (gradeFilter === 'FAIL' && r.hasCompulsoryFail) ||
        r.finalGrade === gradeFilter
      return matchesSearch && matchesClass && matchesGrade
    })
  }, [results, searchQuery, classFilter, gradeFilter])

  // Currently viewed student for trace
  const activeStudentResult = useMemo(() => {
    if (selectedStudentId) {
      return results.find((r) => r.id === selectedStudentId) || results[0]
    }
    return results[0]
  }, [results, selectedStudentId])

  // File upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null)
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string
        const parsed = JSON.parse(text)
        
        let targetCase: CaseData | null = null
        if (parsed.cases && Array.isArray(parsed.cases) && parsed.cases.length > 0) {
          targetCase = parsed.cases[0]
        } else if (parsed.students && parsed.compulsory && parsed.subjects) {
          targetCase = parsed as CaseData
        }

        if (!targetCase || !targetCase.students || !targetCase.compulsory) {
          throw new Error('Invalid JSON schema format. Expected cases array or CaseData object.')
        }

        setCaseData(targetCase)
        setSelectedStudentId(targetCase.students[0]?.id || null)
      } catch (err: any) {
        setUploadError(`Failed to load JSON fixture: ${err.message}`)
      }
    }
    reader.readAsText(file)
  }

  const handleResetToDefault = () => {
    setCaseData(DEFAULT_DATASET)
    setSelectedStudentId(DEFAULT_DATASET.students[0]?.id || null)
    setUploadError(null)
  }

  // Summary statistics
  const stats = useMemo(() => {
    const total = results.length
    const passed = results.filter((r) => !r.hasCompulsoryFail).length
    const failed = total - passed
    const gpa5 = results.filter((r) => r.finalGpa === 5.0 && !r.hasCompulsoryFail).length
    const avgGpa =
      total > 0
        ? (results.reduce((sum, r) => sum + r.finalGpa, 0) / total).toFixed(2)
        : '0.00'
    return { total, passed, failed, gpa5, avgGpa }
  }, [results])

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans antialiased pb-16">
      {/* Header Bar */}
      <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 shadow-lg shadow-indigo-500/20 text-white">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-white">
                  School GPA & Result Processing Engine
                </h1>
                <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 font-mono border border-cyan-500/20">
                  {caseData.case_id || 'ACTIVE CASE'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                LSH26-T012 Problem 08 • TanStack Start + Convex Architecture
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition">
              <Upload className="w-3.5 h-3.5 text-cyan-400" />
              <span>Upload JSON</span>
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
            <button
              onClick={handleResetToDefault}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
              title="Restore initial published benchmark data"
            >
              <RotateCcw className="w-3.5 h-3.5 text-indigo-400" />
              <span>Reset Default</span>
            </button>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium shadow-md shadow-indigo-600/30 transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Report</span>
            </button>
          </div>
        </div>
      </header>

      {uploadError && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="p-3 bg-red-950/50 border border-red-800 text-red-300 rounded-lg text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{uploadError}</span>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Metric Cards Row */}
        <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 flex flex-col justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Students</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-bold text-white">{stats.total}</span>
              <span className="text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-300">2 Classes</span>
            </div>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 flex flex-col justify-between">
            <span className="text-xs font-medium text-emerald-400 uppercase tracking-wider">Passed</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-bold text-emerald-400">{stats.passed}</span>
              <span className="text-xs text-emerald-500 font-medium">
                {stats.total ? Math.round((stats.passed / stats.total) * 100) : 0}%
              </span>
            </div>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 flex flex-col justify-between">
            <span className="text-xs font-medium text-rose-400 uppercase tracking-wider">Failed (F)</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-bold text-rose-400">{stats.failed}</span>
              <span className="text-xs text-rose-500 font-medium">
                {stats.total ? Math.round((stats.failed / stats.total) * 100) : 0}%
              </span>
            </div>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 flex flex-col justify-between">
            <span className="text-xs font-medium text-amber-400 uppercase tracking-wider">A+ (GPA 5.00)</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-bold text-amber-300">{stats.gpa5}</span>
              <span className="text-xs px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 font-medium">Cap 5.0</span>
            </div>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 flex flex-col justify-between col-span-2 sm:col-span-1">
            <span className="text-xs font-medium text-cyan-400 uppercase tracking-wider">Office Verification</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-bold text-cyan-300">{checkingLists.allFlagged.length}</span>
              <span className="text-xs px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 font-medium">Flagged</span>
            </div>
          </div>
        </section>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 gap-2 overflow-x-auto pb-px">
          <button
            onClick={() => setActiveTab('results')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition whitespace-nowrap ${
              activeTab === 'results'
                ? 'border-cyan-500 text-cyan-400 bg-cyan-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>1 & 2. Student Results & GPA</span>
            <span className="text-xs px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-400">{results.length}</span>
          </button>

          <button
            onClick={() => setActiveTab('trace')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition whitespace-nowrap ${
              activeTab === 'trace'
                ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>3. Per-Student Calculation Trace</span>
            {activeStudentResult && (
              <span className="text-xs px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 font-mono">
                {activeStudentResult.id}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('checking')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition whitespace-nowrap ${
              activeTab === 'checking'
                ? 'border-amber-500 text-amber-400 bg-amber-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <FileCheck className="w-4 h-4" />
            <span>4. Office Checking Lists</span>
            <span className="text-xs px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300">
              {checkingLists.allFlagged.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('hardedges')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition whitespace-nowrap ${
              activeTab === 'hardedges'
                ? 'border-rose-500 text-rose-400 bg-rose-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Hard Edge Showcase</span>
            <span className="text-xs px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300">
              {hardEdges.highAvgFail.length + hardEdges.practicalFail.length + hardEdges.optBelowPoint.length + hardEdges.absent.length}
            </span>
          </button>
        </div>

        {/* TAB 1 & 2: Main Student Result Table */}
        {activeTab === 'results' && (
          <div className="space-y-4">
            {/* Filter controls */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-slate-800/40 p-3 rounded-xl border border-slate-800">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search student by name or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-900/80 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <select
                  value={classFilter}
                  onChange={(e) => setClassFilter(e.target.value)}
                  className="bg-slate-900/80 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value="ALL">All Classes</option>
                  {classes.map((cls) => (
                    <option key={cls} value={cls}>
                      {cls}
                    </option>
                  ))}
                </select>

                <select
                  value={gradeFilter}
                  onChange={(e) => setGradeFilter(e.target.value)}
                  className="bg-slate-900/80 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value="ALL">All Grades / Status</option>
                  <option value="PASS">Passing Students Only</option>
                  <option value="FAIL">Failing Students Only</option>
                  <option value="A+">Grade A+ (5.00)</option>
                  <option value="A">Grade A (4.00-4.99)</option>
                  <option value="A-">Grade A- (3.50-3.99)</option>
                  <option value="B">Grade B (3.00-3.49)</option>
                  <option value="C">Grade C (2.00-2.99)</option>
                  <option value="D">Grade D (1.00-1.99)</option>
                </select>
              </div>
            </div>

            {/* Results Table */}
            <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-slate-900/80 text-xs uppercase font-semibold text-slate-400 tracking-wider border-b border-slate-700/80">
                    <tr>
                      <th className="px-4 py-3">ID</th>
                      <th className="px-4 py-3">Name & Class</th>
                      <th className="px-4 py-3">Compulsory GP Sum</th>
                      <th className="px-4 py-3">Optional Subj (GP &gt; 2)</th>
                      <th className="px-4 py-3">Calculated Avg</th>
                      <th className="px-4 py-3">Final GPA</th>
                      <th className="px-4 py-3">Letter Grade</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredResults.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                          No students found matching your criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredResults.map((r) => {
                        const isSelected = selectedStudentId === r.id
                        return (
                          <tr
                            key={r.id}
                            className={`hover:bg-slate-800/80 transition cursor-pointer ${
                              isSelected ? 'bg-indigo-950/40 border-l-4 border-indigo-500' : ''
                            }`}
                            onClick={() => {
                              setSelectedStudentId(r.id)
                              setActiveTab('trace')
                            }}
                          >
                            <td className="px-4 py-3 font-mono font-bold text-cyan-400">
                              {r.id}
                            </td>
                            <td className="px-4 py-3">
                              <div className="font-semibold text-slate-100">{r.name}</div>
                              <div className="text-xs text-slate-400">{r.class}</div>
                            </td>
                            <td className="px-4 py-3">
                              <span className="font-mono">{r.sumCompulsoryPoints.toFixed(2)}</span>
                              <span className="text-xs text-slate-500 ml-1">/ 30.0</span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono font-medium text-slate-200">
                                  {r.optionalCode}
                                </span>
                                <span className="text-xs px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                                  GP: {r.optionalGradePoint.toFixed(1)}
                                </span>
                                <span
                                  className={`text-xs px-1.5 py-0.5 rounded font-mono font-medium ${
                                    r.optionalContribution > 0
                                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                      : 'bg-slate-800 text-slate-500'
                                  }`}
                                >
                                  +{r.optionalContribution.toFixed(2)}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 font-mono">
                              <span
                                className={
                                  r.hasCompulsoryFail && r.uncancelledGpa >= 3.0
                                    ? 'text-amber-400 line-through'
                                    : 'text-slate-300'
                                }
                              >
                                {r.uncancelledGpa.toFixed(2)}
                              </span>
                              {r.hasCompulsoryFail && (
                                <span className="text-xs text-rose-400 ml-1.5">
                                  (Cancelled)
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`text-base font-bold font-mono ${
                                  r.finalGpa === 5.0
                                    ? 'text-amber-300'
                                    : r.finalGpa >= 3.5
                                    ? 'text-cyan-400'
                                    : r.finalGpa > 0
                                    ? 'text-emerald-400'
                                    : 'text-rose-400'
                                }`}
                              >
                                {r.finalGpa.toFixed(2)}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold ${
                                  r.finalGrade === 'A+'
                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                    : r.finalGrade === 'A'
                                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                                    : r.finalGrade === 'A-' || r.finalGrade === 'B'
                                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                                    : r.finalGrade === 'C' || r.finalGrade === 'D'
                                    ? 'bg-slate-700 text-slate-300'
                                    : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                }`}
                              >
                                {r.finalGrade}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setSelectedStudentId(r.id)
                                  setActiveTab('trace')
                                }}
                                className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-medium"
                              >
                                <span>Trace</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Per-Student Calculation Trace */}
        {activeTab === 'trace' && activeStudentResult && (
          <div className="space-y-6">
            {/* Student Picker Banner */}
            <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-white">{activeStudentResult.name}</h2>
                    <span className="text-xs px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 font-mono border border-cyan-500/20">
                      {activeStudentResult.id}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-300">
                      {activeStudentResult.class}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Optional 4th Subject: <span className="font-semibold text-slate-200">{activeStudentResult.optionalCode} ({activeStudentResult.optionalName})</span>
                  </p>
                </div>
              </div>

              {/* Student Selector Dropdown */}
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400 whitespace-nowrap">Switch Student:</span>
                <select
                  value={activeStudentResult.id}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  {results.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.id} - {s.name} ({s.finalGrade})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* If Student Failed, Highlight Reason Banner (R-13 & Rule 3) */}
            {activeStudentResult.hasCompulsoryFail && (
              <div className="bg-rose-950/40 border-2 border-rose-800/80 rounded-xl p-4 text-rose-200 flex items-start gap-3.5">
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h3 className="font-bold text-rose-300">
                    Compulsory Subject Failure Triggered Result F
                  </h3>
                  <p className="text-xs text-rose-200">
                    Rule R-13: Any failure in a compulsory subject cancels the student's final GPA to <span className="font-mono font-bold">0.00 (Grade F)</span>.
                    The uncancelled average was <span className="font-mono font-bold">{activeStudentResult.uncancelledGpa.toFixed(2)}</span>.
                  </p>
                  <div className="mt-2 text-xs">
                    <span className="font-semibold">Failed Subject(s) Causing Result: </span>
                    {activeStudentResult.failedCompulsorySubjects.map((f, i) => (
                      <span key={f.code} className="inline-block mr-2 mt-1 px-2 py-0.5 rounded bg-rose-900/60 border border-rose-700 font-mono text-rose-100">
                        {f.name} ({f.code}): {f.reason}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Subject Trace Table */}
            <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl overflow-hidden">
              <div className="p-4 border-b border-slate-700 bg-slate-900/40 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-white">Subject Evaluation Trace</h3>
                  <p className="text-xs text-slate-400">
                    Detailed breakdown showing marks entered, GP awarded, and governing rule
                  </p>
                </div>
                <span className="text-xs px-2.5 py-1 rounded bg-slate-800 text-slate-400 font-mono">
                  7 Subjects (6 Compulsory + 1 Optional)
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-slate-900/80 text-xs uppercase font-semibold text-slate-400 border-b border-slate-700">
                    <tr>
                      <th className="px-4 py-3">Subject</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Marks Breakdown</th>
                      <th className="px-4 py-3">Total / Status</th>
                      <th className="px-4 py-3">Grade Point</th>
                      <th className="px-4 py-3">Grade</th>
                      <th className="px-4 py-3">Governing Rule Applied</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {activeStudentResult.subjectTraces.map((trace) => (
                      <tr
                        key={trace.code}
                        className={`hover:bg-slate-800/60 transition ${
                          !trace.passed ? 'bg-rose-950/20' : ''
                        }`}
                      >
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-100">{trace.name}</div>
                          <div className="text-xs text-slate-400 font-mono">{trace.code}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-xs px-2 py-0.5 rounded font-medium ${
                              trace.isCompulsory
                                ? 'bg-slate-700 text-slate-300'
                                : 'bg-purple-900/50 text-purple-300 border border-purple-700/50'
                            }`}
                          >
                            {trace.isCompulsory ? 'Compulsory' : 'Optional (4th)'}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs">
                          {trace.practical ? (
                            trace.rawMark === 'AB' ? (
                              <span className="text-rose-400 font-bold">AB (Absent)</span>
                            ) : (
                              <div>
                                <span className={trace.theoryMark! < 25 ? 'text-rose-400 font-bold' : 'text-slate-200'}>
                                  Th: {trace.theoryMark}/75
                                </span>
                                <span className="text-slate-500 mx-1.5">•</span>
                                <span className={trace.practicalMark! < 8 ? 'text-rose-400 font-bold' : 'text-slate-200'}>
                                  Pr: {trace.practicalMark}/25
                                </span>
                              </div>
                            )
                          ) : (
                            <span className={trace.totalMark === 'AB' ? 'text-rose-400 font-bold' : 'text-slate-200'}>
                              {trace.totalMark === 'AB' ? 'AB (Absent)' : `${trace.totalMark}/100`}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 font-mono">
                          {trace.totalMark === 'AB' ? (
                            <span className="text-rose-400 font-bold">AB</span>
                          ) : (
                            <span className={!trace.passed ? 'text-rose-400 font-bold' : 'text-slate-200'}>
                              {trace.totalMark}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 font-mono font-bold">
                          <span className={trace.gradePoint === 0 ? 'text-rose-400' : 'text-cyan-300'}>
                            {trace.gradePoint.toFixed(2)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-xs px-2 py-0.5 rounded font-bold ${
                              trace.letterGrade === 'F'
                                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                : 'bg-slate-700 text-slate-200'
                            }`}
                          >
                            {trace.letterGrade}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-300 max-w-md">
                          {trace.ruleApplied}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* GPA Calculation Formula Breakdown Card */}
            <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-5 space-y-4">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-indigo-400" />
                <span>GPA Formula Step-by-Step Resolution (R-13)</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
                <div className="p-3.5 rounded-lg bg-slate-900/80 border border-slate-800 space-y-1.5">
                  <span className="text-slate-400 block font-sans font-medium">1. Sum of 6 Compulsory GP</span>
                  <div className="text-sm font-bold text-cyan-400">
                    {activeStudentResult.compulsoryGradePoints.map((c) => c.point.toFixed(1)).join(' + ')} ={' '}
                    {activeStudentResult.sumCompulsoryPoints.toFixed(2)}
                  </div>
                </div>

                <div className="p-3.5 rounded-lg bg-slate-900/80 border border-slate-800 space-y-1.5">
                  <span className="text-slate-400 block font-sans font-medium">2. Optional Bonus Contribution</span>
                  <div className="text-sm font-bold text-purple-400">
                    max(0, {activeStudentResult.optionalGradePoint.toFixed(1)} - 2.00) = +{activeStudentResult.optionalContribution.toFixed(2)}
                  </div>
                </div>

                <div className="p-3.5 rounded-lg bg-slate-900/80 border border-slate-800 space-y-1.5">
                  <span className="text-slate-400 block font-sans font-medium">3. Final Calculation</span>
                  <div className="text-sm font-bold text-amber-300">
                    min(5.00, ({activeStudentResult.sumCompulsoryPoints.toFixed(2)} + {activeStudentResult.optionalContribution.toFixed(2)}) / 6) ={' '}
                    {activeStudentResult.uncancelledGpa.toFixed(2)}
                  </div>
                </div>
              </div>

              <div className="p-3.5 bg-slate-900 rounded-lg border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Final Outcome:</span>
                  <span className="font-bold text-white text-base">
                    GPA: {activeStudentResult.finalGpa.toFixed(2)}
                  </span>
                  <span
                    className={`font-bold px-2 py-0.5 rounded text-xs ${
                      activeStudentResult.finalGrade === 'F'
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    Grade: {activeStudentResult.finalGrade}
                  </span>
                </div>
                {activeStudentResult.hasCompulsoryFail ? (
                  <span className="text-xs text-rose-400 font-medium">
                    ⚠️ Compulsory Fail overridden GPA to 0.00 (F)
                  </span>
                ) : (
                  <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> All compulsory subjects passed
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: Office Checking Lists (Requirement 4 & R-29) */}
        {activeTab === 'checking' && (
          <div className="space-y-5">
            <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-amber-400" />
                  <span>Office Pre-Publication Checking List (R-29)</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Hand verification list for teachers before publishing results
                </p>
              </div>

              {/* Sub-tabs */}
              <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-lg border border-slate-800">
                <button
                  onClick={() => setCheckingListTab('all')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition ${
                    checkingListTab === 'all'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  All Flagged ({checkingLists.allFlagged.length})
                </button>
                <button
                  onClick={() => setCheckingListTab('optional')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition ${
                    checkingListTab === 'optional'
                      ? 'bg-amber-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Optional ≤ 2.0 ({checkingLists.optList.length})
                </button>
                <button
                  onClick={() => setCheckingListTab('practical')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition ${
                    checkingListTab === 'practical'
                      ? 'bg-rose-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Practical Fail ({checkingLists.practList.length})
                </button>
                <button
                  onClick={() => setCheckingListTab('absent')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition ${
                    checkingListTab === 'absent'
                      ? 'bg-cyan-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Absent AB ({checkingLists.absList.length})
                </button>
              </div>
            </div>

            {/* List Table */}
            <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-slate-900/80 text-xs uppercase font-semibold text-slate-400 border-b border-slate-700">
                    <tr>
                      <th className="px-4 py-3">Student ID</th>
                      <th className="px-4 py-3">Student Name</th>
                      <th className="px-4 py-3">Class</th>
                      <th className="px-4 py-3">Flagged Trigger Conditions</th>
                      <th className="px-4 py-3">Final Status</th>
                      <th className="px-4 py-3 text-right">Verification</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {(checkingListTab === 'all'
                      ? checkingLists.allFlagged
                      : checkingListTab === 'optional'
                      ? checkingLists.optList
                      : checkingListTab === 'practical'
                      ? checkingLists.practList
                      : checkingLists.absList
                    ).map((r) => (
                      <tr key={r.id} className="hover:bg-slate-800/60 transition">
                        <td className="px-4 py-3 font-mono font-bold text-cyan-400">{r.id}</td>
                        <td className="px-4 py-3 font-semibold text-slate-100">{r.name}</td>
                        <td className="px-4 py-3 text-xs text-slate-400">{r.class}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1.5">
                            {r.flags.optionalRuleAffected && (
                              <span className="text-xs px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                                Optional GP ({r.optionalGradePoint.toFixed(1)}) ≤ 2.0
                              </span>
                            )}
                            {r.flags.practicalFail && (
                              <span className="text-xs px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20">
                                Practical Mark &lt; 8
                              </span>
                            )}
                            {r.flags.absent && (
                              <span className="text-xs px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                                Absent (AB)
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-xs px-2 py-0.5 rounded font-bold ${
                              r.finalGrade === 'F'
                                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            }`}
                          >
                            {r.finalGrade} (GPA {r.finalGpa.toFixed(2)})
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => {
                              setSelectedStudentId(r.id)
                              setActiveTab('trace')
                            }}
                            className="text-xs font-medium text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-1"
                          >
                            <span>Open Trace</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB: Hard Edge Showcase (Requirement 1 & 3) */}
        {activeTab === 'hardedges' && (
          <div className="space-y-6">
            <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-5">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
                <span>Hard Edge & Corner Case Verification</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Requirement 1 mandates at least 8 students on hard edge cases. The dataset contains test cases across all four categories:
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Edge 1: High Average but Failed Subject */}
              <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-rose-400 text-sm">
                    1. High Average with 1 Failed Compulsory Subject
                  </h3>
                  <span className="text-xs px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 font-mono">
                    {hardEdges.highAvgFail.length} students
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Students whose uncancelled average was high (≥ 3.00), but failing even one compulsory subject produced final GPA 0.00 (F).
                </p>
                <div className="space-y-2 mt-2">
                  {hardEdges.highAvgFail.map((s) => (
                    <div
                      key={s.id}
                      onClick={() => {
                        setSelectedStudentId(s.id)
                        setActiveTab('trace')
                      }}
                      className="p-2.5 rounded-lg bg-slate-900/60 hover:bg-slate-900 border border-slate-800 flex items-center justify-between cursor-pointer text-xs"
                    >
                      <div>
                        <span className="font-mono text-cyan-400 font-bold mr-2">{s.id}</span>
                        <span className="font-medium text-slate-200">{s.name}</span>
                        <div className="text-slate-500 text-[11px] mt-0.5">
                          Failed: {s.failedCompulsorySubjects.map((f) => `${f.name} (${f.code})`).join(', ')}
                        </div>
                      </div>
                      <div className="text-right font-mono">
                        <div className="text-slate-400 line-through">Avg {s.uncancelledGpa.toFixed(2)}</div>
                        <div className="text-rose-400 font-bold">GPA 0.00 (F)</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Edge 2: Practical Fail with Passing Theory */}
              <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-amber-400 text-sm">
                    2. Practical Fail with Passing Theory Mark
                  </h3>
                  <span className="text-xs px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 font-mono">
                    {hardEdges.practicalFail.length} students
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Theory mark passed (≥ 25/75), but practical mark was &lt; 8/25, failing the entire subject (GP 0.0) per Rule R-11.
                </p>
                <div className="space-y-2 mt-2">
                  {hardEdges.practicalFail.slice(0, 6).map((s) => (
                    <div
                      key={s.id}
                      onClick={() => {
                        setSelectedStudentId(s.id)
                        setActiveTab('trace')
                      }}
                      className="p-2.5 rounded-lg bg-slate-900/60 hover:bg-slate-900 border border-slate-800 flex items-center justify-between cursor-pointer text-xs"
                    >
                      <div>
                        <span className="font-mono text-cyan-400 font-bold mr-2">{s.id}</span>
                        <span className="font-medium text-slate-200">{s.name}</span>
                      </div>
                      <div className="text-amber-400 font-mono">Pr &lt; 8 Flagged</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Edge 3: Optional Below Point Where it Helps */}
              <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-indigo-400 text-sm">
                    3. Optional Subject Below Point Where It Helps (GP ≤ 2.0)
                  </h3>
                  <span className="text-xs px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 font-mono">
                    {hardEdges.optBelowPoint.length} students
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Optional subject scored GP ≤ 2.0, providing +0.00 contribution per Rule R-13.
                </p>
                <div className="space-y-2 mt-2">
                  {hardEdges.optBelowPoint.slice(0, 6).map((s) => (
                    <div
                      key={s.id}
                      onClick={() => {
                        setSelectedStudentId(s.id)
                        setActiveTab('trace')
                      }}
                      className="p-2.5 rounded-lg bg-slate-900/60 hover:bg-slate-900 border border-slate-800 flex items-center justify-between cursor-pointer text-xs"
                    >
                      <div>
                        <span className="font-mono text-cyan-400 font-bold mr-2">{s.id}</span>
                        <span className="font-medium text-slate-200">{s.name}</span>
                        <span className="text-slate-400 ml-2">({s.optionalCode})</span>
                      </div>
                      <div className="text-purple-400 font-mono">GP {s.optionalGradePoint.toFixed(1)} (+0.00)</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Edge 4: Absent in Subject */}
              <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-cyan-400 text-sm">
                    4. Absent (AB) in Subject
                  </h3>
                  <span className="text-xs px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 font-mono">
                    {hardEdges.absent.length} students
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Rule R-12: Absent in compulsory gives overall F; absent in optional contributes 0 and enters checking list.
                </p>
                <div className="space-y-2 mt-2">
                  {hardEdges.absent.map((s) => (
                    <div
                      key={s.id}
                      onClick={() => {
                        setSelectedStudentId(s.id)
                        setActiveTab('trace')
                      }}
                      className="p-2.5 rounded-lg bg-slate-900/60 hover:bg-slate-900 border border-slate-800 flex items-center justify-between cursor-pointer text-xs"
                    >
                      <div>
                        <span className="font-mono text-cyan-400 font-bold mr-2">{s.id}</span>
                        <span className="font-medium text-slate-200">{s.name}</span>
                      </div>
                      <div className="text-cyan-400 font-mono font-bold">AB Recorded</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
